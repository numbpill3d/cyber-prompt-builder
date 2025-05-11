/**
 * Goal Planner
 * Manages autonomous, high-level project goals with roadmap generation and execution tracking
 */

import { taskPlanner, TaskPlan, PlannedStep } from './task-planner';
import { taskRunner, TaskRun, TaskRunnerEvent, TaskRunOptions } from './task-runner';
import { sessionManager, Session } from '../session-manager';
import { pluginManager, PluginType } from '../plugin-system/plugin-manager';
import { settingsManager } from '../settings-manager';
import { StructuredResponse } from '../response-handler';
import { deploymentService } from '../deployment-service';
import { getProvider } from '../providers/providers';

// Types of goal execution approaches
export enum ExecutionStyle {
  FULLY_AUTONOMOUS = 'fully_autonomous',  // AI makes all decisions without user input
  APPROVAL_REQUIRED = 'approval_required', // User must approve major decisions
  INTERACTIVE = 'interactive',            // Regular user input and guidance
  COLLABORATIVE = 'collaborative'         // Multiple agents or users work together
}

// Checkpointing intervals
export enum CheckpointFrequency {
  AFTER_EACH_TASK = 'after_each_task',
  AFTER_MILESTONES = 'after_milestones',
  HOURLY = 'hourly',
  MANUAL = 'manual'
}

// Project goal with execution state
export interface ProjectGoal {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  status: 'planning' | 'executing' | 'paused' | 'completed' | 'failed';
  executionStyle: ExecutionStyle;
  checkpointFrequency: CheckpointFrequency;
  sessionId: string;
  roadmap?: ProjectRoadmap;
  currentMilestoneIndex?: number;
  userDecisions: UserDecision[];
  checkpoints: Checkpoint[];
  artifacts: ProjectArtifact[];
  estimatedTimeToCompletion?: string;
  timeline: GoalTimelineEvent[];
  collaborators: string[]; // User/agent IDs
  requiresUserInput?: boolean;
  userInputPrompt?: string;
  parentGoalId?: string; // For sub-goals
  subGoalIds: string[]; // For parent goals
  metadata: Record<string, any>; // Additional goal-specific metadata
}

// High-level project roadmap with milestones
export interface ProjectRoadmap {
  id: string;
  milestones: Milestone[];
  dependencies: Array<[string, string]>; // [milestoneId, dependsOnMilestoneId]
  generatedAt: number;
  updatedAt: number;
  completionPercentage: number;
}

// A milestone represents a significant project achievement
export interface Milestone {
  id: string;
  title: string;
  description: string;
  tasks: TaskPlan[];
  dependencies: string[]; // Milestone IDs this depends on
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed';
  estimatedHours: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  completedAt?: number;
}

// Decision points that required/will require user input
export interface UserDecision {
  id: string;
  question: string;
  options: string[];
  decision?: string;
  timestamp?: number;
  milestoneId?: string;
  taskId?: string;
  isBlocking: boolean;
  context: string;
}

// Checkpoint for resuming the project later
export interface Checkpoint {
  id: string;
  timestamp: number;
  description: string;
  milestoneId: string;
  taskId?: string;
  state: any; // Serialized state of the goal execution
  isAutomatic: boolean;
}

// Output artifacts created during the project
export interface ProjectArtifact {
  id: string;
  name: string;
  type: 'code' | 'design' | 'documentation' | 'deployment' | 'other';
  path?: string;
  url?: string;
  createdAt: number;
  createdByMilestoneId: string;
  metadata: Record<string, any>;
}

// Timeline event for tracking progress
export interface GoalTimelineEvent {
  id: string;
  timestamp: number;
  type: 'milestone_started' | 'milestone_completed' | 'task_started' | 
        'task_completed' | 'user_decision' | 'checkpoint_created' | 
        'artifact_created' | 'error' | 'paused' | 'resumed';
  title: string;
  description: string;
  relatedEntityId?: string; // ID of the related milestone/task/etc.
}

/**
 * GoalPlanner manages the execution of high-level project goals
 */
export class GoalPlanner {
  private goals: Map<string, ProjectGoal> = new Map();
  private activeGoalId: string | null = null;
  private listeners: Map<string, Array<(event: string, data: any) => void>> = new Map();
  
  constructor() {
    // Initialize and register for task runner events
    this.initEventListeners();
    this.loadStoredGoals();
  }
  
  /**
   * Create a new project goal
   */
  async createGoal(
    title: string,
    description: string,
    options: {
      executionStyle?: ExecutionStyle;
      checkpointFrequency?: CheckpointFrequency;
      parentGoalId?: string;
      collaborators?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<ProjectGoal> {
    // Create a new session for this goal
    const sessionId = sessionManager.createSession(title);
    
    // Create the goal structure
    const goalId = this.generateId('goal');
    const now = Date.now();
    
    const goal: ProjectGoal = {
      id: goalId,
      title,
      description,
      createdAt: now,
      updatedAt: now,
      status: 'planning',
      executionStyle: options.executionStyle || ExecutionStyle.APPROVAL_REQUIRED,
      checkpointFrequency: options.checkpointFrequency || CheckpointFrequency.AFTER_MILESTONES,
      sessionId,
      userDecisions: [],
      checkpoints: [],
      artifacts: [],
      timeline: [],
      collaborators: options.collaborators || [],
      subGoalIds: [],
      parentGoalId: options.parentGoalId,
      metadata: options.metadata || {}
    };
    
    // If this is a sub-goal, link it to the parent
    if (options.parentGoalId) {
      const parentGoal = this.goals.get(options.parentGoalId);
      if (parentGoal) {
        parentGoal.subGoalIds.push(goalId);
        parentGoal.updatedAt = now;
        this.goals.set(options.parentGoalId, parentGoal);
      }
    }
    
    // Store the goal
    this.goals.set(goalId, goal);
    this.saveGoals();
    
    // Create a timeline event
    this.addTimelineEvent(goal, {
      type: 'milestone_started',
      title: 'Goal Created',
      description: `Project "${title}" has been created and planning has begun.`
    });
    
    // Generate the roadmap
    await this.generateRoadmap(goalId);
    
    return goal;
  }
  
  /**
   * Generate a roadmap for the goal
   */
  async generateRoadmap(goalId: string): Promise<ProjectRoadmap | null> {
    const goal = this.goals.get(goalId);
    if (!goal) {
      console.error(`Goal not found: ${goalId}`);
      return null;
    }
    
    try {
      // Update goal status
      goal.status = 'planning';
      goal.updatedAt = Date.now();
      
      // Get the provider to use
      const provider = settingsManager.getActiveProvider();
      const apiKey = settingsManager.getApiKey(provider);
      if (!apiKey) {
        throw new Error(`API key not configured for ${provider}`);
      }
      
      // Get the provider instance
      const providerInstance = getProvider(provider);
      
      // Create a roadmap planning prompt
      const planningPrompt = {
        content: `Create a detailed project roadmap for the following goal:
  
GOAL: ${goal.title}
DESCRIPTION: ${goal.description}

Break this down into logical milestones, each with clear deliverables and dependencies.
Format your response as valid JSON conforming to this structure:

{
  "milestones": [
    {
      "title": "Milestone title",
      "description": "Detailed description of the milestone",
      "estimatedHours": 5,
      "priority": "high",
      "dependencies": []
    },
    // More milestones with appropriate dependencies
  ]
}

Ensure each milestone builds logically on previous ones, with clear dependencies. Include estimated hours and priority level for each milestone.`
      };
      
      // Generate the roadmap
      const planResult = await providerInstance.generateCode(planningPrompt, {
        apiKey,
        model: settingsManager.getPreferredModel(provider),
        temperature: 0.3 // Lower temperature for more deterministic planning
      });
      
      // Extract the JSON roadmap
      let roadmapData;
      try {
        // Try to extract JSON from the response
        const jsonMatch = planResult.code.match(/{[\s\S]*}/);
        if (jsonMatch) {
          roadmapData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not extract JSON roadmap from response');
        }
      } catch (error) {
        console.error('Error parsing roadmap JSON:', error);
        throw new Error('Failed to parse roadmap data');
      }
      
      // Create the roadmap structure
      const roadmapId = this.generateId('roadmap');
      const now = Date.now();
      
      const milestones = (roadmapData.milestones || []).map((m: any, index: number) => {
        return {
          id: this.generateId('milestone'),
          title: m.title,
          description: m.description,
          tasks: [],
          dependencies: m.dependencies || [],
          status: 'pending',
          estimatedHours: m.estimatedHours || 2,
          priority: m.priority || 'medium'
        };
      });
      
      // Process milestone dependencies by ID
      const dependencies: Array<[string, string]> = [];
      milestones.forEach(milestone => {
        // Convert milestone titles to IDs
        const depIds = milestone.dependencies;
        milestone.dependencies = [];
        
        depIds.forEach((depTitle: string) => {
          const depMilestone = milestones.find(m => m.title === depTitle);
          if (depMilestone) {
            milestone.dependencies.push(depMilestone.id);
            dependencies.push([milestone.id, depMilestone.id]);
          }
        });
      });
      
      const roadmap: ProjectRoadmap = {
        id: roadmapId,
        milestones,
        dependencies,
        generatedAt: now,
        updatedAt: now,
        completionPercentage: 0
      };
      
      // Update the goal with the roadmap
      goal.roadmap = roadmap;
      goal.updatedAt = now;
      goal.currentMilestoneIndex = 0;
      this.goals.set(goalId, goal);
      this.saveGoals();
      
      // Add timeline event
      this.addTimelineEvent(goal, {
        type: 'milestone_started',
        title: 'Roadmap Generated',
        description: `Project roadmap created with ${milestones.length} milestones.`
      });
      
      // If fully autonomous, start execution immediately
      if (goal.executionStyle === ExecutionStyle.FULLY_AUTONOMOUS) {
        this.executeMilestone(goalId, roadmap.milestones[0].id);
      } else {
        // Create a user decision for roadmap approval
        this.createUserDecision(goal, {
          question: 'Do you approve this project roadmap?',
          options: ['Yes, begin execution', 'Yes, but let me make changes first', 'No, regenerate the roadmap'],
          milestoneId: roadmap.milestones[0].id,
          isBlocking: true,
          context: `Roadmap with ${milestones.length} milestones:\n` + 
                  milestones.map(m => `- ${m.title} (${m.priority} priority, ~${m.estimatedHours}h)`).join('\n')
        });
      }
      
      return roadmap;
    } catch (error) {
      console.error('Error generating roadmap:', error);
      
      // Update goal status
      goal.status = 'failed';
      goal.updatedAt = Date.now();
      
      // Add failure event
      this.addTimelineEvent(goal, {
        type: 'error',
        title: 'Roadmap Generation Failed',
        description: `Failed to generate project roadmap: ${error instanceof Error ? error.message : String(error)}`
      });
      
      this.goals.set(goalId, goal);
      this.saveGoals();
      
      return null;
    }
  }
  
  /**
   * Execute a specific milestone
   */
  async executeMilestone(goalId: string, milestoneId: string): Promise<boolean> {
    const goal = this.goals.get(goalId);
    if (!goal || !goal.roadmap) {
      console.error(`Goal not found or no roadmap: ${goalId}`);
      return false;
    }
    
    // Find the milestone
    const milestone = goal.roadmap.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      console.error(`Milestone not found: ${milestoneId}`);
      return false;
    }
    
    // Check if milestone dependencies are satisfied
    const unsatisfiedDeps = milestone.dependencies.filter(depId => {
      const depMilestone = goal.roadmap?.milestones.find(m => m.id === depId);
      return depMilestone && depMilestone.status !== 'completed';
    });
    
    if (unsatisfiedDeps.length > 0) {
      console.error(`Milestone ${milestoneId} has unsatisfied dependencies`);
      
      // Create a user decision
      this.createUserDecision(goal, {
        question: 'This milestone has unmet dependencies. How would you like to proceed?',
        options: ['Execute anyway', 'Execute dependencies first', 'Cancel execution'],
        milestoneId,
        isBlocking: true,
        context: `Unmet dependencies: ${unsatisfiedDeps.map(depId => {
          const depMilestone = goal.roadmap?.milestones.find(m => m.id === depId);
          return depMilestone?.title || depId;
        }).join(', ')}`
      });
      
      return false;
    }
    
    try {
      // Update milestone and goal status
      milestone.status = 'in_progress';
      goal.status = 'executing';
      goal.updatedAt = Date.now();
      this.goals.set(goalId, goal);
      
      // Add timeline event
      this.addTimelineEvent(goal, {
        type: 'milestone_started',
        title: `Started: ${milestone.title}`,
        description: `Executing milestone: ${milestone.description}`,
        relatedEntityId: milestoneId
      });
      
      // Generate tasks for this milestone
      const tasks = await this.generateMilestoneTasks(goal, milestone);
      if (!tasks || tasks.length === 0) {
        throw new Error('Failed to generate tasks for milestone');
      }
      
      // Store the tasks in the milestone
      milestone.tasks = tasks;
      goal.updatedAt = Date.now();
      this.goals.set(goalId, goal);
      this.saveGoals();
      
      // Start executing the first task
      for (const task of tasks) {
        // Check if the task has any unsatisfied dependencies
        const canExecute = this.canExecuteTask(task, tasks);
        if (canExecute) {
          await this.executeTask(goalId, milestoneId, task.id);
          break;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error executing milestone ${milestoneId}:`, error);
      
      // Update milestone and goal status
      milestone.status = 'failed';
      goal.updatedAt = Date.now();
      
      // Add failure event
      this.addTimelineEvent(goal, {
        type: 'error',
        title: `Failed: ${milestone.title}`,
        description: `Failed to execute milestone: ${error instanceof Error ? error.message : String(error)}`,
        relatedEntityId: milestoneId
      });
      
      this.goals.set(goalId, goal);
      this.saveGoals();
      
      return false;
    }
  }
  
  /**
   * Check if a task can be executed (all dependencies satisfied)
   */
  private canExecuteTask(task: PlannedStep, allTasks: TaskPlan[]): boolean {
    if (task.dependencies.length === 0) {
      return true;
    }
    
    for (const depId of task.dependencies) {
      const depTask = allTasks.find(t => t.steps.some(s => s.id === depId));
      if (!depTask) {
        return false;
      }
      
      const depStep = depTask.steps.find(s => s.id === depId);
      if (!depStep || depStep.status !== 'completed') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Generate tasks for a milestone
   */
  private async generateMilestoneTasks(
    goal: ProjectGoal,
    milestone: Milestone
  ): Promise<TaskPlan[]> {
    // Get the provider
    const provider = settingsManager.getActiveProvider();
    
    // Create task planning prompt
    const planningPrompt = `Generate detailed tasks to achieve this milestone:
    
MILESTONE: ${milestone.title}
DESCRIPTION: ${milestone.description}

Break this down into executable tasks with dependencies.`;
    
    // Generate tasks using the task planner
    try {
      const taskPlan = await taskPlanner.decomposeTask(
        planningPrompt,
        provider,
        { complexity: 'complex' }
      );
      
      return [taskPlan];
    } catch (error) {
      console.error('Error generating milestone tasks:', error);
      
      // Add failure event
      this.addTimelineEvent(goal, {
        type: 'error',
        title: `Task Generation Failed for ${milestone.title}`,
