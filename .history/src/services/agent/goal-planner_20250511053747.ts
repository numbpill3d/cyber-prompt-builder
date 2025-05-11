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
        description: `Failed to generate tasks: ${error instanceof Error ? error.message : String(error)}`,
        relatedEntityId: milestone.id
      });
      
      throw error;
    }
  }
  
  /**
   * Execute a task within a milestone
   */
  private async executeTask(
    goalId: string,
    milestoneId: string,
    taskId: string
  ): Promise<boolean> {
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
    
    // Find the task
    let taskPlan: TaskPlan | undefined;
    let taskStep: PlannedStep | undefined;
    
    for (const plan of milestone.tasks) {
      for (const step of plan.steps) {
        if (step.id === taskId) {
          taskPlan = plan;
          taskStep = step;
          break;
        }
      }
      if (taskStep) break;
    }
    
    if (!taskPlan || !taskStep) {
      console.error(`Task not found: ${taskId}`);
      return false;
    }
    
    try {
      // Update task status
      taskStep.status = 'in_progress';
      goal.updatedAt = Date.now();
      this.goals.set(goalId, goal);
      
      // Add timeline event
      this.addTimelineEvent(goal, {
        type: 'task_started',
        title: `Started Task: ${taskStep.title}`,
        description: taskStep.description,
        relatedEntityId: taskId
      });
      
      // Execute the task using task runner
      const taskRunOptions: TaskRunOptions = {
        autoExecute: true,
        sessionId: goal.sessionId,
        provider: settingsManager.getActiveProvider()
      };
      
      const taskRun = await taskRunner.startRun(taskStep.prompt, taskRunOptions);
      
      // Wait for task execution to complete
      await this.waitForTaskExecution(taskRun.id);
      
      // Get the updated task run
      const updatedRun = taskRunner.getRun(taskRun.id);
      if (!updatedRun) {
        throw new Error('Task run not found after execution');
      }
      
      if (updatedRun.status !== 'completed') {
        throw new Error(`Task execution failed: ${updatedRun.error || 'Unknown error'}`);
      }
      
      // Get the latest goal (may have been updated during execution)
      const updatedGoal = this.goals.get(goalId);
      if (!updatedGoal || !updatedGoal.roadmap) {
        throw new Error('Goal or roadmap not found after execution');
      }
      
      // Find the milestone and task again (they may have changed)
      const updatedMilestone = updatedGoal.roadmap.milestones.find(m => m.id === milestoneId);
      if (!updatedMilestone) {
        throw new Error('Milestone not found after execution');
      }
      
      // Find the task step again
      let updatedTaskStep: PlannedStep | undefined;
      for (const plan of updatedMilestone.tasks) {
        for (const step of plan.steps) {
          if (step.id === taskId) {
            updatedTaskStep = step;
            break;
          }
        }
        if (updatedTaskStep) break;
      }
      
      if (!updatedTaskStep) {
        throw new Error('Task step not found after execution');
      }
      
      // Get the final response
      const responseIds = Object.keys(updatedRun.responses);
      const finalResponseId = responseIds[responseIds.length - 1];
      const finalResponse = updatedRun.responses[finalResponseId];
      
      // Store the response in the task
      updatedTaskStep.response = finalResponse;
      updatedTaskStep.status = 'completed';
      updatedGoal.updatedAt = Date.now();
      
      // Add timeline event
      this.addTimelineEvent(updatedGoal, {
        type: 'task_completed',
        title: `Completed Task: ${updatedTaskStep.title}`,
        description: `Task completed successfully.`,
        relatedEntityId: taskId
      });
      
      // Check if all tasks in the milestone are completed
      const allTasksCompleted = this.areAllMilestoneTasks(updatedMilestone);
      
      if (allTasksCompleted) {
        // Mark milestone as completed
        updatedMilestone.status = 'completed';
        updatedMilestone.completedAt = Date.now();
        
        // Add milestone completion event
        this.addTimelineEvent(updatedGoal, {
          type: 'milestone_completed',
          title: `Completed: ${updatedMilestone.title}`,
          description: `All tasks for this milestone have been completed.`,
          relatedEntityId: milestoneId
        });
        
        // Create checkpoint
        if (updatedGoal.checkpointFrequency === CheckpointFrequency.AFTER_MILESTONES) {
          this.createCheckpoint(updatedGoal, {
            description: `Milestone completed: ${updatedMilestone.title}`,
            milestoneId,
            isAutomatic: true
          });
        }
        
        // Move to the next milestone
        await this.progressToNextMilestone(goalId);
      } else {
        // Find the next task to execute
        let nextTask: PlannedStep | undefined;
        
        for (const plan of updatedMilestone.tasks) {
          for (const step of plan.steps) {
            if (step.status === 'pending' && this.canExecuteTask(step, updatedMilestone.tasks)) {
              nextTask = step;
              break;
            }
          }
          if (nextTask) break;
        }
        
        if (nextTask) {
          // Execute the next task
          await this.executeTask(goalId, milestoneId, nextTask.id);
        } else {
          // No more executable tasks, but not all completed
          // This might be a dependency issue or user intervention is needed
          console.warn('No more executable tasks, but milestone is not complete');
          
          // Create user decision
          this.createUserDecision(updatedGoal, {
            question: 'Some tasks cannot be executed automatically. How would you like to proceed?',
            options: ['Skip remaining tasks', 'Manual resolution', 'Consider milestone complete'],
            milestoneId,
            isBlocking: true,
            context: `Milestone: ${updatedMilestone.title}\nCompleted tasks: ${
              updatedMilestone.tasks.reduce((count, plan) => 
                count + plan.steps.filter(s => s.status === 'completed').length, 0)
            }\nPending tasks: ${
              updatedMilestone.tasks.reduce((count, plan) => 
                count + plan.steps.filter(s => s.status === 'pending').length, 0)
            }`
          });
        }
      }
      
      this.goals.set(goalId, updatedGoal);
      this.saveGoals();
      
      return true;
    } catch (error) {
      console.error(`Error executing task ${taskId}:`, error);
      
      // Get the latest goal
      const updatedGoal = this.goals.get(goalId);
      if (!updatedGoal || !updatedGoal.roadmap) {
        return false;
      }
      
      // Find the milestone and task again
      const updatedMilestone = updatedGoal.roadmap.milestones.find(m => m.id === milestoneId);
      if (!updatedMilestone) {
        return false;
      }
      
      // Find the task step again
      let updatedTaskStep: PlannedStep | undefined;
      for (const plan of updatedMilestone.tasks) {
        for (const step of plan.steps) {
          if (step.id === taskId) {
            updatedTaskStep = step;
            break;
          }
        }
        if (updatedTaskStep) break;
      }
      
      if (!updatedTaskStep) {
        return false;
      }
      
      // Update task status
      updatedTaskStep.status = 'failed';
      updatedGoal.updatedAt = Date.now();
      
      // Add failure event
      this.addTimelineEvent(updatedGoal, {
        type: 'error',
        title: `Failed Task: ${updatedTaskStep.title}`,
        description: `Failed to execute task: ${error instanceof Error ? error.message : String(error)}`,
        relatedEntityId: taskId
      });
      
      this.goals.set(goalId, updatedGoal);
      this.saveGoals();
      
      return false;
    }
  }
  
  /**
   * Check if all tasks in a milestone are completed
   */
  private areAllMilestoneTasks(milestone: Milestone): boolean {
    for (const plan of milestone.tasks) {
      for (const step of plan.steps) {
        if (step.status !== 'completed' && !step.optional) {
          return false;
        }
      }
    }
    return true;
  }
  
  /**
   * Wait for a task to complete execution
   */
  private async waitForTaskExecution(taskRunId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const run = taskRunner.getRun(taskRunId);
        if (!run) {
          clearInterval(checkInterval);
          reject(new Error('Task run not found'));
          return;
        }
        
        if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
          clearInterval(checkInterval);
          if (run.status === 'completed') {
            resolve();
          } else {
            reject(new Error(`Task execution ${run.status}: ${run.error || 'Unknown error'}`));
          }
        }
      }, 1000); // Check every second
    });
  }
  
  /**
   * Progress to the next milestone after the current one is completed
   */
  private async progressToNextMilestone(goalId: string): Promise<boolean> {
    const goal = this.goals.get(goalId);
    if (!goal || !goal.roadmap) {
      console.error(`Goal not found or no roadmap: ${goalId}`);
      return false;
    }
    
    // Calculate the next milestone index
    const currentIndex = goal.currentMilestoneIndex !== undefined ? goal.currentMilestoneIndex : -1;
    const nextIndex = currentIndex + 1;
    
    // Check if we've completed all milestones
    if (nextIndex >= goal.roadmap.milestones.length) {
      // All milestones completed!
      goal.status = 'completed';
      goal.updatedAt = Date.now();
      
      // Add completion event
      this.addTimelineEvent(goal, {
        type: 'milestone_completed',
        title: 'Project Completed',
        description: `All ${goal.roadmap.milestones.length} milestones have been completed successfully.`
      });
      
      // Create final checkpoint
      this.createCheckpoint(goal, {
        description: 'Project completed successfully',
        milestoneId: goal.roadmap.milestones[goal.roadmap.milestones.length - 1].id,
        isAutomatic: true
      });
      
      this.goals.set(goalId, goal);
      this.saveGoals();
      
      return true;
    }
    
    // Get the next milestone
    const nextMilestone = goal.roadmap.milestones[nextIndex];
    
    // Update the current milestone index
    goal.currentMilestoneIndex = nextIndex;
    goal.updatedAt = Date.now();
    this.goals.set(goalId, goal);
    this.saveGoals();
    
    // If approval required, create a user decision
    if (goal.executionStyle === ExecutionStyle.APPROVAL_REQUIRED) {
      this.createUserDecision(goal, {
        question: `Ready to begin the next milestone: "${nextMilestone.title}"?`,
        options: ['Yes, begin execution', 'Pause execution', 'Skip this milestone'],
        milestoneId: nextMilestone.id,
        isBlocking: true,
        context: `Milestone: ${nextMilestone.title}\nDescription: ${nextMilestone.description}\nEstimated time: ${nextMilestone.estimatedHours} hours\nPriority: ${nextMilestone.priority}`
      });
      
      return true;
    }
    
    // Otherwise, automatically execute the next milestone
    return this.executeMilestone(goalId, nextMilestone.id);
  }
  
  /**
   * Create a user decision point
   */
  private createUserDecision(
    goal: ProjectGoal,
    decision: {
      question: string;
      options: string[];
      milestoneId?: string;
      taskId?: string;
      isBlocking: boolean;
      context: string;
    }
  ): UserDecision {
    const decisionId = this.generateId('decision');
    
    const userDecision: UserDecision = {
      id: decisionId,
      question: decision.question,
      options: decision.options,
      milestoneId: decision.milestoneId,
      taskId: decision.taskId,
      isBlocking: decision.isBlocking,
      context: decision.context
    };
    
    // Add the decision to the goal
    goal.userDecisions.push(userDecision);
    
    // If the decision is blocking, update the goal state
    if (decision.isBlocking) {
      goal.requiresUserInput = true;
      goal.userInputPrompt = decision.question;
      
      if (goal.status === 'executing') {
        goal.status = 'paused';
        
        // Add paused event
        this.addTimelineEvent(goal, {
          type: 'paused',
          title: 'Execution Paused',
          description: `Waiting for user input: ${decision.question}`,
          relatedEntityId: decisionId
        });
      }
    }
    
    goal.updatedAt = Date.now();
    this.goals.set(goal.id, goal);
    this.saveGoals();
    
    // Emit event
    this.emitEvent('user_decision_created', { 
      goalId: goal.id, 
      decision: userDecision 
    });
    
    return userDecision;
  }
  
  /**
   * Submit a decision for a user decision point
   */
  async submitUserDecision(
    goalId: string,
    decisionId: string,
    choice: string
  ): Promise<boolean> {
    const goal = this.goals.get(goalId);
    if (!goal) {
      console.error(`Goal not found: ${goalId}`);
      return false;
    }
    
    // Find the decision
    const decisionIndex = goal.userDecisions.findIndex(d => d.id === decisionId);
    if (decisionIndex === -1) {
      console.error(`Decision not found: ${decisionId}`);
      return false;
    }
    
    const decision = goal.userDecisions[decisionIndex];
    
    // Ensure the choice is valid
    if (!decision.options.includes(choice)) {
      console.error(`Invalid choice: ${choice}`);
      return false;
    }
    
    // Update the decision
    decision.decision = choice;
    decision.timestamp = Date.now();
    goal.userDecisions[decisionIndex] = decision;
    
    // Add timeline event
    this.addTimelineEvent(goal, {
      type: 'user_decision',
      title: 'User Decision',
      description: `Decision: "${decision.question}" - Choice: "${choice}"`,
      relatedEntityId: decisionId
    });
    
    // Process the decision based on context
    await this.processUserDecision(goal, decision, choice);
    
    // Check if there are any more blocking decisions
    const hasBlockingDecisions = goal.userDecisions.some(d => 
      !d.decision && d.isBlocking
    );
    
    // Update the goal state
    if (!hasBlockingDecisions) {
      goal.requiresUserInput = false;
      goal.userInputPrompt = undefined;
      
      if (goal.status === 'paused') {
        goal.status = 'executing';
        
        // Add resumed event
        this.addTimelineEvent(goal, {
          type: 'resumed',
          title: 'Execution Resumed',
          description: 'User input provided, execution resumed.'
        });
      }
    }
    
    goal.updatedAt = Date.now();
    this.goals.set(goalId, goal);
    this.saveGoals();
    
    return true;
  }
  
  /**
   * Process a user decision based on its context
   */
  private async processUserDecision(
    goal: ProjectGoal,
    decision: UserDecision,
    choice: string
  ): Promise<void> {
    // Handle roadmap approval decision
    if (decision.question.includes('approve this project roadmap')) {
      if (choice.startsWith('Yes, begin')) {
        // Begin execution of the first milestone
        if (goal.roadmap && goal.roadmap.milestones.length > 0) {
          goal.currentMilestoneIndex = 0;
          await this.executeMilestone(goal.id, goal.roadmap.milestones[0].id);
        }
      } else if (choice.includes('regenerate')) {
        // Regenerate the roadmap
        await this.generateRoadmap(goal.id);
      }
      // 'Yes, but let me make changes' case is handled by the UI
      return;
    }
    
    // Handle milestone execution decisions
    if (decision.question.includes('Ready to begin the next milestone')) {
      if (choice.startsWith('Yes, begin')) {
        // Begin execution
        if (decision.milestoneId) {
          await this.executeMilestone(goal.id, decision.milestoneId);
        }
      } else if (choice.includes('Skip')) {
        // Skip this milestone
        if (goal.roadmap && goal.currentMilestoneIndex !== undefined) {
          const milestone = goal.roadmap.milestones[goal.currentMilestoneIndex];
          if (milestone) {
            milestone.status = 'completed';
            milestone.completedAt = Date.now();
            
            // Add skipped event
            this.addTimelineEvent(goal, {
              type: 'milestone_completed',
              title: `Skipped: ${milestone.title}`,
              description: 'Milestone was skipped by user decision.',
              relatedEntityId: milestone.id
            });
            
            // Progress to the next milestone
            await this.progressToNextMilestone(goal.id);
          }
        }
      }
      // 'Pause execution' case is already handled
      return;
    }
    
    // Handle dependency issue decisions
    if (decision.question.includes('unmet dependencies')) {
      if (choice === 'Execute anyway' && decision.milestoneId) {
        // Force execution despite dependencies
        await this.executeMilestone(goal.id, decision.milestoneId);
      } else if (choice === 'Execute dependencies first') {
        // Find and execute dependencies
        if (goal.roadmap && decision.milestoneId) {
          const milestone = goal.roadmap.milestones.find(m => m.id === decision.milestoneId);
          if (milestone) {
            for (const depId of milestone.dependencies) {
              const depMilestone = goal.roadmap.milestones.find(m => m.id === depId);
              if (depMilestone && depMilestone.status !== 'completed') {
                await this.executeMilestone(goal.id, depId);
                break; // Execute one dependency at a time
              }
            }
          }
        }
      }
      // 'Cancel execution' case is already handled
      return;
    }
    
    // Handle task execution issues
    if (decision.question.includes('tasks cannot be executed automatically')) {
      if (choice === 'Skip remaining tasks' && decision.milestoneId) {
        // Skip remaining tasks and move on
        if (goal.roadmap) {
          const milestone = goal.roadmap.milestones.find(m => m.id === decision.milestoneId);
          if (milestone) {
            // Mark all pending tasks as completed
            for (const plan of milestone.tasks) {
              for (const step of plan.steps) {
                if (step.status === 'pending') {
                  step.status = 'completed';
                }
              }
            }
            
            // Mark milestone as completed
            milestone.status = 'completed';
            milestone.completedAt = Date.now();
            
            // Add milestone completion event
            this.addTimelineEvent(goal, {
              type: 'milestone_completed',
              title: `Completed: ${milestone.title}`,
              description: 'Remaining tasks were skipped by user decision.',
              relatedEntityId: milestone.id
            });
            
            // Progress to the next milestone
            await this.progressToNextMilestone(goal.id);
          }
        }
      } else if (choice === 'Consider milestone complete' && decision.milestoneId) {
        // Mark milestone as complete without doing anything else
        if (goal.roadmap) {
          const milestone = goal.roadmap.milestones.find(m => m.id === decision.milestoneId);
          if (milestone) {
            milestone.status = 'completed';
            milestone.completedAt = Date.now();
            
            // Add milestone completion event
            this.addTimelineEvent(goal, {
              type: 'milestone_completed',
              title: `Completed: ${milestone.title}`,
              description: 'Milestone was manually marked as complete.',
              relatedEntityId: milestone.id
            });
            
            // Progress to the next milestone
            await this.progressToNextMilestone(goal.id);
          }
        }
      }
      // 'Manual resolution' case is handled by the UI
      return;
    }
  }
  
  /**
   * Create a checkpoint for a goal
   */
  private createCheckpoint(
    goal: ProjectGoal,
    options: {
      description: string;
      milestoneId: string;
      taskId?: string;
      isAutomatic: boolean;
    }
  ): Checkpoint {
    const checkpointId = this.generateId('checkpoint');
    const now = Date.now();
    
    // Create a serializable state of the goal execution
    const state = this.serializeGoalState(goal);
    
    const checkpoint: Checkpoint = {
      id: checkpointId,
      timestamp: now,
      description: options.description,
      milestoneId: options.milestoneId,
      taskId: options.taskId,
      state,
      isAutomatic: options.isAutomatic
    };
    
    // Add the checkpoint to the goal
    goal.checkpoints.push(checkpoint);
    goal.updatedAt = now;
    
    // Add timeline event
    this.addTimelineEvent(goal, {
      type: 'checkpoint_created',
      title: 'Checkpoint Created',
      description: options.description,
      relatedEntityId: checkpointId
    });
    
    this.goals.set(goal.id, goal);
    this.saveGoals();
    
    return checkpoint;
  }
  
  /**
   * Serialize the goal state for checkpoint storage
   */
  private serializeGoalState(goal: ProjectGoal): any {
    // Create a simplified version of the goal state
    // excluding any circular references or non-serializable data
    const state = {
      id: goal.id,
      title: goal.title,
      status: goal.status,
      currentMilestoneIndex: goal.currentMilestoneIndex,
      milestones: goal.roadmap ? goal.roadmap.milestones.map(m => ({
        id: m.id,
        title: m.title,
        status: m.status,
        tasks: m.tasks.map(t => ({
          id: t.id,
          title: t.title,
          steps: t.steps.map(s => ({
            id: s.id,
            title: s.title,
            status: s.status
          }))
        }))
      })) : [],
      artifacts: goal.artifacts,
      timestamp: Date.now()
    };
    
    return state;
  }
  
  /**
   * Restore a goal from a checkpoint
   */
  async restoreFromCheckpoint(
    goalId: string,
    checkpointId: string
  ): Promise<boolean> {
    const goal = this.goals.get(goalId);
    if (!goal) {
      console.error(`Goal not found: ${goalId}`);
      return false;
    }
    
    // Find the checkpoint
    const checkpoint = goal.checkpoints.find(c => c.id === checkpointId);
    if (!checkpoint) {
      console.error(`Checkpoint not found: ${checkpointId}`);
      return false;
    }
    
    try {
      // Restore the goal state from the checkpoint
      // This is a simplified version; in a real implementation,
      // we would carefully merge the checkpoint state with the current goal
      
      // Update milestone and task statuses
      if (goal.roadmap && checkpoint.state.milestones) {
        for (const checkpointMilestone of checkpoint.state.milestones) {
          const milestone = goal.roadmap.milestones.find(m => m.id === checkpointMilestone.id);
          if (milestone) {
            milestone.status = checkpointMilestone.status;
            
            // Update tasks
            for (const checkpointTask of checkpointMilestone.tasks || []) {
              for (const plan of milestone.tasks) {
                // Update steps
                for (const checkpointStep of checkpointTask.steps || []) {
                  const step = plan.steps.find(s => s.id === checkpointStep.id);
                  if (step) {
                    step.status = checkpointStep.status;
                  }
                }
              }
            }
          }
        }
      }
      
      // Update goal status and milestone index
      goal.status = checkpoint.state.status || 'paused';
      goal.currentMilestoneIndex = checkpoint.state.currentMilestoneIndex;
      goal.updatedAt = Date.now();
      
      // Add timeline event
      this.addTimelineEvent(goal, {
        type: 'checkpoint_created',
        title: 'Restored from Checkpoint',
        description: `Goal state restored from checkpoint: ${checkpoint.description}`,
        relatedEntityId: checkpointId
      });
      
      this.goals.set(goalId, goal);
      this.saveGoals();
      
      return true;
    } catch (error) {
      console.error('Error restoring from checkpoint:', error);
      
      // Add failure event
      this.addTimelineEvent(goal, {
        type: 'error',
        title: 'Checkpoint Restoration Failed',
        description: `Failed to restore from checkpoint: ${error instanceof Error ? error.message : String(error)}`,
        relatedEntityId: checkpointId
      });
      
      return false;
    }
  }
  
  /**
   * Add a timeline event to a goal
   */
  private addTimelineEvent(
    goal: ProjectGoal,
    event: {
      type: GoalTimelineEvent['type'];
      title: string;
      description: string;
      relatedEntityId?: string;
    }
  ): GoalTimelineEvent {
    const eventId = this.generateId('event');
    const timestamp = Date.now();
    
    const timelineEvent: GoalTimelineEvent = {
      id: eventId,
      timestamp,
      type: event.type,
      title: event.title,
      description: event.description,
      relatedEntityId: event.relatedEntityId
    };
    
    goal.timeline.push(timelineEvent);
    goal.updatedAt = timestamp;
    
    // Emit the event
    this.emitEvent('goal_timeline_event', {
      goalId: goal.id,
      event: timelineEvent
    });
    
    return timelineEvent;
  }
  
  /**
   * Calculate the progress of a goal (0-100)
   */
  calculateGoalProgress(goalId: string): number {
    const goal = this.goals.get(goalId);
    if (!goal || !goal.roadmap) {
      return 0;
    }
    
    // Count completed milestones
    const totalMilestones = goal.roadmap.milestones.length;
    if (totalMilestones === 0) {
      return 0;
    }
    
    let completedMilestones = 0;
    let partialProgress = 0;
    
    for (const milestone of goal.roadmap.milestones) {
      if (milestone.status === 'completed') {
        completedMilestones++;
      } else if (milestone.status === 'in_progress') {
        // Calculate partial progress for in-progress milestone
        const totalTasks = milestone.tasks.reduce((count, plan) => count + plan.steps.length, 0);
        if (totalTasks > 0) {
          const completedTasks = milestone.tasks.reduce((count, plan) => {
            return count + plan.steps.filter(s => s.status === 'completed').length;
          }, 0);
          
          partialProgress = completedTasks / totalTasks;
        }
      }
    }
    
    // Calculate overall progress
    const progress = ((completedMilestones + partialProgress) / totalMilestones) * 100;
    
    // Update roadmap completion percentage
    if (goal.roadmap) {
      goal.roadmap.completionPercentage = progress;
      goal.updatedAt = Date.now();
      this.goals.set(goalId, goal);
    }
    
    return Math.round(progress);
  }
  
  /**
   * Get a goal by ID
   */
  getGoal(goalId: string): ProjectGoal | undefined {
    return this.goals.get(goalId);
  }
  
  /**
   * Get all goals
   */
  getAllGoals(): ProjectGoal[] {
    return Array.from(this.goals.values());
  }
  
  /**
   * Delete a goal
   */
  deleteGoal(goalId: string): boolean {
    // Check if goal exists
    if (!this.goals.has(goalId)) {
      return false;
    }
    
    // Delete the goal
    this.goals.delete(goalId);
    this.saveGoals();
    
    // If this was the active goal, clear it
    if (this.activeGoalId === goalId) {
      this.activeGoalId = null;
    }
    
    // Emit event
    this.emitEvent('goal_deleted', { goalId });
    
    return true;
  }
  
  /**
   * Set the active goal
   */
  setActiveGoal(goalId: string | null): boolean {
    if (goalId === null) {
      this.activeGoalId = null;
      return true;
    }
    
    if (!this.goals.has(goalId)) {
      return false;
    }
    
    this.activeGoalId = goalId;
    return true;
  }
  
  /**
   * Get the active goal
   */
  getActiveGoal(): ProjectGoal | undefined {
    if (!this.activeGoalId) {
      return undefined;
    }
    
    return this.goals.get(this.activeGoalId);
  }
  
  /**
   * Generate a unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Save goals to localStorage
   */
  private saveGoals(): void {
    try {
      const serializedGoals = JSON.stringify(Array.from(this.goals.entries()));
      localStorage.setItem('cyber_prompt_goals', serializedGoals);
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  }
  
  /**
   * Load goals from localStorage
   */
  private loadStoredGoals(): void {
    try {
      const serializedGoals = localStorage.getItem('cyber_prompt_goals');
      if (serializedGoals) {
        const goalEntries = JSON.parse(serializedGoals);
        this.goals = new Map(goalEntries);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  }
  
  /**
   * Register event handlers for task runner events
   */
  private initEventListeners(): void {
    taskRunner.addEventListener((event, data) => {
      // Map task runner events to goal events
      switch (event) {
        case 'step-completed':
          this.handleTaskStepCompleted(data);
          break;
        case 'step-failed':
          this.handleTaskStepFailed(data);
          break;
        case 'task-completed':
          this.handleTaskCompleted(data);
          break;
        case 'task-failed':
          this.handleTaskFailed(data);
          break;
      }
    });
  }
  
  /**
   * Handle task step completed event
   */
  private handleTaskStepCompleted(data: any): void {
    // Find goals associated with this task
    // In a real implementation, we would have a mapping between tasks and goals
  }
  
  /**
   * Handle task step failed event
   */
  private handleTaskStepFailed(data: any): void {
    // Handle task step failure
  }
  
  /**
   * Handle task completed event
   */
  private handleTaskCompleted(data: any): void {
    // Handle task completion
  }
  
  /**
   * Handle task failed event
   */
  private handleTaskFailed(data: any): void {
    // Handle task failure
  }
  
  /**
   * Add event listener
   */
  addEventListener(eventType: string, handler: (event: string, data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(handler);
  }
  
  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, handler: (event: string, data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      return;
    }
    
    const listeners = this.listeners.get(eventType)!;
    const index = listeners.indexOf(handler);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * Emit an event
   */
  private emitEvent(eventType: string, data: any): void {
    if (!this.listeners.has(eventType)) {
      return;
    }
    
    for (const handler of this.listeners.get(eventType)!) {
      try {
        handler(eventType, data);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    }
  }
}

// Export singleton instance
export const goalPlanner = new GoalPlanner();