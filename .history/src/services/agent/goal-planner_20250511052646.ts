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
