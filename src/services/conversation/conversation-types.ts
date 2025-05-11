/**
 * Conversation Manager - Type Definitions
 * Defines core data structures for conversation context and code block tracking
 */

import { EditAction, EditTarget } from '../session-manager';
import { MemoryEntry, MemoryType } from '../memory/memory-types';
import { StructuredResponse } from '../response-handler';
import { AIPrompt } from '../providers/index';

/**
 * Represents a single unit of conversation (prompt + response)
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
  parentTurnId?: string; // For branching conversations
  memoryIds: string[]; // References to memory entries
  metadata: {
    tags?: string[];
    importance?: number;
    custom?: Record<string, any>;
  };
}

/**
 * Reference to a code block within a conversation
 */
export interface CodeBlockRef {
  id: string;
  language: string;
  versionId: string; // Points to a specific version in CodeBlockContext
  contextualName?: string; // User-friendly name (e.g. "login component", "database schema")
}

/**
 * Represents the evolution of a code block over time
 */
export interface CodeBlockContext {
  id: string;
  language: string;
  filename?: string;
  purpose?: string;
  createdAt: number;
  versions: CodeBlockVersion[];
  currentVersionId: string;
  references: {
    turnIds: string[]; // Conversation turns that reference this code block
    relatedCodeBlockIds: string[]; // Other code blocks that interact with this one
  };
  metadata: {
    tags?: string[];
    complexity?: number;
    classification?: string; // "component", "utility", "config", etc.
    custom?: Record<string, any>;
  };
}

/**
 * A single version of a code block
 */
export interface CodeBlockVersion {
  id: string;
  code: string;
  createdAt: number;
  parentVersionId?: string; // For tracking version history
  turnId: string; // Conversation turn that generated this version
  changeSummary?: string; // Brief description of what changed
  diffFromParent?: string; // Optional stored diff from parent version
}

/**
 * Types of relationships between conversation turns
 */
export enum ConversationRelationType {
  SEQUENTIAL = 'sequential', // Normal flow
  BRANCH = 'branch',        // Fork in conversation
  REVISION = 'revision',     // Revisits and modifies previous turn
  REFERENCE = 'reference',   // References but doesn't modify
  MERGE = 'merge'            // Combines branches
}

/**
 * Relationship between conversation turns
 */
export interface ConversationRelation {
  sourceId: string;
  targetId: string;
  type: ConversationRelationType;
  createdAt: number;
  metadata?: Record<string, any>;
}

/**
 * Context retrieval options
 */
export interface ContextRetrievalOptions {
  turnLimit?: number;
  includeCodeBlocks?: boolean;
  codeBlockLimit?: number;
  includeMemories?: boolean;
  memoryTypes?: MemoryType[];
  semanticSearchQuery?: string;
  similarityThreshold?: number;
  maxTokens?: number;
}

/**
 * Resulting context bundle from retrieval
 */
export interface ContextBundle {
  conversationContext: string;
  referencedTurns: ConversationTurn[];
  codeBlocks: CodeBlockContext[];
  memories: MemoryEntry[];
  totalTokenEstimate: number;
}

/**
 * Branch/fork information
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