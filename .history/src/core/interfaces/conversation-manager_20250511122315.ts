/**
 * Conversation Manager Interface
 * Defines the contract for conversation management services
 */

import { MemoryEntry } from './memory-engine';
import { StructuredResponse } from '../models/response';

/**
 * Code block reference type
 */
export interface CodeBlockRef {
  id: string;
  language: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Code block version type
 */
export interface CodeBlockVersion {
  id: string;
  code: string;
  createdAt: number;
  metadata?: Record<string, any>;
}

/**
 * Code block type
 */
export interface CodeBlock {
  id: string;
  language: string;
  versions: CodeBlockVersion[];
  currentVersionId: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

/**
 * Edit action type
 */
export enum EditAction {
  REFACTOR = 'refactor',
  OPTIMIZE = 'optimize',
  ADD = 'add',
  REMOVE = 'remove',
  FIX = 'fix',
  EXPLAIN = 'explain',
  REGENERATE = 'regenerate',
  MODIFY = 'modify',
  CONVERT = 'convert'
}

/**
 * Edit target type
 */
export type EditTarget = string;

/**
 * Prompt type
 */
export interface AIPrompt {
  content: string;
  context?: string;
}

/**
 * Conversation turn metadata
 */
export interface TurnMetadata {
  tags: string[];
  importance: number;
  custom?: Record<string, any>;
}

/**
 * Conversation turn type
 */
export interface ConversationTurn {
  id: string;
  timestamp: number;
  prompt: AIPrompt;
  response: StructuredResponse;
  codeBlockRefs: CodeBlockRef[];
  editAction?: EditAction;
  editTarget?: EditTarget;
  provider: string;
  model: string;
  parentTurnId?: string;
  memoryIds: string[];
  metadata: TurnMetadata;
}

/**
 * Conversation relation type enum
 */
export enum ConversationRelationType {
  SEQUENTIAL = 'sequential',
  BRANCH = 'branch',
  REFERENCE = 'reference'
}

/**
 * Conversation relation type
 */
export interface ConversationRelation {
  sourceId: string;
  targetId: string;
  type: ConversationRelationType;
  createdAt: number;
}

/**
 * Conversation branch type
 */
export interface ConversationBranch {
  id: string;
  name: string;
  rootTurnId: string;
  createdAt: number;
  active: boolean;
  description?: string;
  turns: ConversationTurn[];
}

/**
 * Context retrieval options
 */
export interface ContextRetrievalOptions {
  turnLimit?: number;
  includeCodeBlocks?: boolean;
  codeBlockLimit?: number;
  includeMemories?: boolean;
  semanticSearchQuery?: string;
  similarityThreshold?: number;
  memoryTypes?: string[];
}

/**
 * Context bundle type
 */
export interface ContextBundle {
  conversationContext: string;
  referencedTurns: ConversationTurn[];
  codeBlocks: CodeBlock[];
  memories: MemoryEntry[];
  totalTokenEstimate: number;
}

/**
 * Conversation manager interface
 */
export interface ConversationManager {
  // Turn management
  addTurn(
    prompt: AIPrompt,
    response: StructuredResponse,
    provider: string,
    model: string,
    editAction?: EditAction,
    editTarget?: EditTarget,
    parentTurnId?: string
  ): Promise<ConversationTurn>;
  
  getTurn(turnId: string): ConversationTurn | undefined;
  getTurnDescendants(turnId: string): ConversationTurn[];
  
  // Branch management
  getActiveBranch(): ConversationBranch | undefined;
  setActiveBranch(branchId: string): boolean;
  createBranch(turnId: string, name?: string, description?: string): string | null;
  getAllBranches(): ConversationBranch[];
  getActiveBranchTurns(): ConversationTurn[];
  
  // Context retrieval
  retrieveContext(options?: ContextRetrievalOptions, referenceTurnId?: string): Promise<ContextBundle>;
  
  // Prompt generation
  generateFollowUpPrompt(
    userPrompt: string,
    editAction: EditAction,
    editTarget: EditTarget,
    turnId?: string
  ): Promise<AIPrompt>;
  
  // Intent analysis
  analyzePromptIntent(prompt: string): { action: EditAction, target: EditTarget };
  
  // Memory integration
  getTurnMemories(turnId: string): Promise<MemoryEntry[]>;
  findRelatedTurns(content: string, limit?: number): Promise<ConversationTurn[]>;
}