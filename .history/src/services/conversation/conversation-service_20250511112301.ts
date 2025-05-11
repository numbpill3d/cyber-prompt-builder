/**
 * Conversation Service
 * Manages conversation context, history, and code block tracking
 */

import { sessionManager, Session, SessionIteration, EditAction, EditTarget } from '../session-manager';
import { 
  ConversationTurn, 
  CodeBlockRef,
  ContextRetrievalOptions, 
  ContextBundle,
  ConversationBranch,
  ConversationRelationType,
  ConversationRelation
} from './conversation-types';
import { codeBlockManager } from './code-block-manager';
import { StructuredResponse } from '../response-handler';
import { AIPrompt } from '../providers/index';
import { getMemoryService } from '../memory/memory-service';
import { MemoryType, MemoryEntry } from '../memory/memory-types';

// Simple internal function to generate IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Core Conversation Service implementation
 * Extends the session manager with code block awareness and enhanced context handling
 */
export class ConversationService {
  private turns: Map<string, ConversationTurn> = new Map();
  private branches: Map<string, ConversationBranch> = new Map();
  private relations: ConversationRelation[] = [];
  private activeBranchId: string | null = null;
  
  constructor() {
    // Initialize by converting existing sessions
    this.initialize();
  }
  
  /**
   * Initialize by loading data from session manager
   */
  private async initialize(): Promise<void> {
    // Create default main branch
    const mainBranchId = generateId();
    this.branches.set(mainBranchId, {
      id: mainBranchId,
      name: 'Main Branch',
      rootTurnId: '',
      createdAt: Date.now(),
      active: true,
      turns: []
    });
    this.activeBranchId = mainBranchId;
    
    // Process existing sessions and convert to our format
    const sessions = sessionManager.getAllSessions();
    for (const session of sessions) {
      await this.importFromSession(session);
    }
  }
  
  /**
   * Import conversation history from a session
   */
  private async importFromSession(session: Session): Promise<void> {
    const branch: ConversationBranch = {
      id: generateId(),
      name: session.title,
      rootTurnId: '',
      createdAt: session.created,
      active: false,
      turns: []
    };
    
    let previousTurnId: string | undefined;
    
    for (const iteration of session.iterations) {
      // Convert iteration to turn
      const turnId = generateId();
      
      // Extract code blocks from response
      const codeBlockRefs = codeBlockManager.extractAndTrackCodeBlocks(
        iteration.response,
        turnId
      );
      
      // Create memory entries for this turn
      const memoryIds = await this.createMemoriesForTurn(
        turnId,
        iteration,
        codeBlockRefs
      );
      
      // Create the turn
      const turn: ConversationTurn = {
        id: turnId,
        timestamp: iteration.timestamp,
        prompt: iteration.prompt,
        response: iteration.response,
        codeBlockRefs,
        editAction: iteration.editAction,
        editTarget: iteration.editTarget,
        provider: iteration.provider,
        model: iteration.model,
        parentTurnId: previousTurnId,
        memoryIds,
        metadata: {
          tags: [],
          importance: 5
        }
      };
      
      // Add turn to collections
      this.turns.set(turnId, turn);
      branch.turns.push(turn);
      
      // If this is first turn, set as root
      if (!branch.rootTurnId) {
        branch.rootTurnId = turnId;
      }
      
      // Create sequential relation if we have a previous turn
      if (previousTurnId) {
        this.relations.push({
          sourceId: previousTurnId,
          targetId: turnId,
          type: ConversationRelationType.SEQUENTIAL,
          createdAt: Date.now()
        });
      }
      
      previousTurnId = turnId;
    }
    
    // Add branch to collection
    this.branches.set(branch.id, branch);
  }
  
  /**
   * Create memory entries for a conversation turn
   */
  private async createMemoriesForTurn(
    turnId: string,
    iteration: SessionIteration,
    codeBlockRefs: CodeBlockRef[]
  ): Promise<string[]> {
    try {
      const memoryService = await getMemoryService();
      const memoryIds: string[] = [];
      
      // Create collection if it doesn't exist
      await memoryService.createCollection({
        name: 'conversation-history',
        metadata: {
          description: 'Conversation turn history'
        }
      }).catch(() => {/* Ignore if already exists */});
      
      // Store the prompt
      const promptMemory = await memoryService.addMemory(
        'conversation-history',
        iteration.prompt.content || '',
        {
          type: MemoryType.CHAT,
          source: 'user',
          sessionId: turnId,
          tags: ['prompt'],
          custom: {
            turnId,
            context: iteration.prompt.context,
            editAction: iteration.editAction,
            editTarget: iteration.editTarget
          }
        }
      );
      memoryIds.push(promptMemory.id);
      
      // Store the response explanation if it exists
      if (iteration.response.explanation) {
        const explanationMemory = await memoryService.addMemory(
          'conversation-history',
          iteration.response.explanation,
          {
            type: MemoryType.CHAT,
            source: 'ai',
            sessionId: turnId,
            tags: ['explanation'],
            custom: {
              turnId,
              model: iteration.model,
              provider: iteration.provider
            }
          }
        );
        memoryIds.push(explanationMemory.id);
      }
      
      return memoryIds;
    } catch (error) {
      console.error('Failed to create memories for turn:', error);
      return [];
    }
  }
  
  /**
   * Add a new conversation turn
   */
  async addTurn(
    prompt: AIPrompt,
    response: StructuredResponse,
    provider: string,
    model: string,
    editAction?: EditAction,
    editTarget?: EditTarget,
    parentTurnId?: string
  ): Promise<ConversationTurn> {
    const branch = this.getActiveBranch();
    if (!branch) {
      throw new Error('No active branch found');
    }
    
    const turnId = generateId();
    
    // Extract and track code blocks
    const codeBlockRefs = codeBlockManager.extractAndTrackCodeBlocks(
      response, 
      turnId
    );
    
    // Create memory entries
    const memoryIds = await this.createMemoriesForTurn(
      turnId,
      {
        id: turnId,
        prompt,
        response,
        timestamp: Date.now(),
        provider,
        model,
        editAction,
        editTarget
      },
      codeBlockRefs
    );
    
    // Determine parent turn - use specified or get last turn in branch
    const actualParentId = parentTurnId || (branch.turns.length > 0 
      ? branch.turns[branch.turns.length - 1].id 
      : undefined);
    
    // Create the turn
    const turn: ConversationTurn = {
      id: turnId,
      timestamp: Date.now(),
      prompt,
      response,
      codeBlockRefs,
      editAction,
      editTarget,
      provider,
      model,
      parentTurnId: actualParentId,
      memoryIds,
      metadata: {
        tags: [],
        importance: 5
      }
    };
    
    // Add turn to collections
    this.turns.set(turnId, turn);
    branch.turns.push(turn);
    
    // If this is first turn, set as root
    if (!branch.rootTurnId) {
      branch.rootTurnId = turnId;
    }
    
    // Create relation
    if (actualParentId) {
      // Determine relation type based on whether this is a direct continuation
      const relationType = parentTurnId !== undefined 
        ? ConversationRelationType.BRANCH 
        : ConversationRelationType.SEQUENTIAL;
        
      this.relations.push({
        sourceId: actualParentId,
        targetId: turnId,
        type: relationType,
        createdAt: Date.now()
      });
    }
    
    // Also update session manager to maintain compatibility
    this.syncToSessionManager(turn);
    
    return turn;
  }
  
  /**
   * Update session manager with turn data to maintain compatibility
   */
  private syncToSessionManager(turn: ConversationTurn): void {
    const branch = this.getActiveBranch();
    if (!branch) return;
    
    let sessionId = branch.id;
    
    // Check if a session already exists for this branch
    const sessions = sessionManager.getAllSessions();
    const existingSession = sessions.find(s => s.title === branch.name);
    
    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      // Create a new session
      sessionId = sessionManager.createSession(branch.name);
    }
    
    // Add iteration to session
    sessionManager.addIteration(
      sessionId,
      turn.prompt,
      turn.response,
      turn.provider,
      turn.model,
      turn.editAction,
      turn.editTarget
    );
  }
  
  /**
   * Get a conversation turn by ID
   */
  getTurn(turnId: string): ConversationTurn | undefined {
    return this.turns.get(turnId);
  }
  
  /**
   * Get the active branch
   */
  getActiveBranch(): ConversationBranch | undefined {
    if (!this.activeBranchId) return undefined;
    return this.branches.get(this.activeBranchId);
  }
  
  /**
   * Set the active branch
   */
  setActiveBranch(branchId: string): boolean {
    if (!this.branches.has(branchId)) return false;
    
    // Deactivate current branch
    if (this.activeBranchId) {
      const currentBranch = this.branches.get(this.activeBranchId);
      if (currentBranch) {
        currentBranch.active = false;
      }
    }
    
    // Activate new branch
    const newBranch = this.branches.get(branchId);
    if (newBranch) {
      newBranch.active = true;
      this.activeBranchId = branchId;
      return true;
    }
    
    return false;
  }
  
  /**
   * Create a new branch from a specific turn
   */
  createBranch(
    turnId: string, 
    name: string = 'New Branch',
    description?: string
  ): string | null {
    const turn = this.turns.get(turnId);
    if (!turn) return null;
    
    const branchId = generateId();
    const branch: ConversationBranch = {
      id: branchId,
      name,
      rootTurnId: turnId,
      createdAt: Date.now(),
      active: false,
      description,
      turns: [turn] // Start with just the root turn
    };
    
    this.branches.set(branchId, branch);
    return branchId;
  }
  
  /**
   * Get all branches
   */
  getAllBranches(): ConversationBranch[] {
    return Array.from(this.branches.values());
  }
  
  /**
   * Get all turns in the active branch
   */
  getActiveBranchTurns(): ConversationTurn[] {
    const branch = this.getActiveBranch();
    if (!branch) return [];
    return [...branch.turns];
  }
  
  /**
   * Get all descendants of a turn
   */
  getTurnDescendants(turnId: string): ConversationTurn[] {
    const descendants: ConversationTurn[] = [];
    const visited = new Set<string>();
    const queue: string[] = [turnId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      // Find outgoing relations
      const outgoingRelations = this.relations.filter(rel => rel.sourceId === currentId);
      
      for (const relation of outgoingRelations) {
        const target = this.turns.get(relation.targetId);
        if (target && !visited.has(relation.targetId)) {
          descendants.push(target);
          queue.push(relation.targetId);
        }
      }
    }
    
    return descendants;
  }
  
  /**
   * Generate a follow-up prompt with enhanced context
   */
  async generateFollowUpPrompt(
    userPrompt: string,
    editAction: EditAction,
    editTarget: EditTarget,
    turnId?: string
  ): Promise<AIPrompt> {
    // Get the reference turn, either specified or latest in active branch
    let referenceTurn: ConversationTurn | undefined;
    
    if (turnId) {
      referenceTurn = this.turns.get(turnId);
    } else {
      const branch = this.getActiveBranch();
      if (branch && branch.turns.length > 0) {
        referenceTurn = branch.turns[branch.turns.length - 1];
      }
    }
    
    if (!referenceTurn) {
      // No previous context, return as new prompt
      return { content: userPrompt };
    }
    
    // Retrieve relevant context
    const context = await this.retrieveContext({
      turnLimit: 3,
      includeCodeBlocks: true,
      codeBlockLimit: 2,
      includeMemories: true,
      semanticSearchQuery: userPrompt
    }, referenceTurn.id);
    
    // Build context from previous interaction and code blocks
    let contextualPrompt = `I previously generated code based on this request: "${referenceTurn.prompt.content}".`;
    
    // Add information about the current code
    const codeBlocksContent = codeBlockManager.getCodeContent(referenceTurn.codeBlockRefs);
    const languages = Object.keys(codeBlocksContent);
    
    if (languages.length > 0) {
      contextualPrompt += ` The solution included code in: ${languages.join(', ')}.`;
    }
    
    // Add specific target information
    if (editTarget && editTarget !== 'all' && codeBlocksContent[editTarget]) {
      contextualPrompt += `\n\nHere is the current ${editTarget} code:\n\`\`\`${editTarget}\n${codeBlocksContent[editTarget]}\n\`\`\``;
    } else if (editTarget === 'all') {
      // Include all code blocks
      for (const [lang, code] of Object.entries(codeBlocksContent)) {
        contextualPrompt += `\n\nHere is the current ${lang} code:\n\`\`\`${lang}\n${code}\n\`\`\``;
      }
    }
    
    // Add relevant memories if available
    if (context.memories.length > 0) {
      contextualPrompt += `\n\nRelevant context from previous conversations:\n`;
      
      for (const memory of context.memories) {
        contextualPrompt += `- ${memory.content.substring(0, 200)}${memory.content.length > 200 ? '...' : ''}\n`;
      }
    }
    
    // Add action information
    const actionDescription = this.getActionDescription(editAction, editTarget);
    let enhancedPrompt = `${actionDescription}: ${userPrompt}`;
    
    return {
      content: enhancedPrompt,
      context: contextualPrompt
    };
  }
  
  /**
   * Retrieve context based on specified options
   */
  async retrieveContext(
    options: ContextRetrievalOptions = {},
    referenceTurnId?: string
  ): Promise<ContextBundle> {
    const result: ContextBundle = {
      conversationContext: '',
      referencedTurns: [],
      codeBlocks: [],
      memories: [],
      totalTokenEstimate: 0
    };
    
    // Get reference turn
    let referenceTurn: ConversationTurn | undefined;
    if (referenceTurnId) {
      referenceTurn = this.turns.get(referenceTurnId);
    } else {
      const branch = this.getActiveBranch();
      if (branch && branch.turns.length > 0) {
        referenceTurn = branch.turns[branch.turns.length - 1];
      }
    }
    
    if (!referenceTurn) return result;
    
    // Get conversation history
    const history: ConversationTurn[] = [];
    let currentTurn: ConversationTurn | undefined = referenceTurn;
    
    // Collect up to turnLimit turns going backward
    const turnLimit = options.turnLimit || 3;
    while (currentTurn && history.length < turnLimit) {
      history.unshift(currentTurn); // Add to beginning
      
      if (currentTurn.parentTurnId) {
        currentTurn = this.turns.get(currentTurn.parentTurnId);
      } else {
        currentTurn = undefined;
      }
    }
    
    // Add turns to result
    result.referencedTurns = history;
    
    // Build conversation context string
    let contextString = '';
    for (const turn of history) {
      contextString += `USER: ${turn.prompt.content}\n`;
      contextString += `AI: ${turn.response.explanation || 'No explanation provided'}\n\n`;
    }
    result.conversationContext = contextString;
    
    // Get code blocks if requested
    if (options.includeCodeBlocks) {
      const codeBlockLimit = options.codeBlockLimit || 5;
      const codeBlockIds = new Set<string>();
      
      // Collect code block IDs from history
      for (const turn of history) {
        for (const ref of turn.codeBlockRefs) {
          codeBlockIds.add(ref.id);
          
          if (codeBlockIds.size >= codeBlockLimit) break;
        }
        
        if (codeBlockIds.size >= codeBlockLimit) break;
      }
      
      // Get code blocks
      for (const blockId of codeBlockIds) {
        const block = codeBlockManager.getCodeBlock(blockId);
        if (block) {
          result.codeBlocks.push(block);
        }
      }
    }
    
    // Retrieve memories if requested
    if (options.includeMemories && options.semanticSearchQuery) {
      try {
        const memoryService = await getMemoryService();
        
        // Search for relevant memories
        const memoryResult = await memoryService.searchMemories('conversation-history', {
          query: options.semanticSearchQuery,
          threshold: options.similarityThreshold || 0.7,
          maxResults: 5,
          types: options.memoryTypes
        });
        
        result.memories = memoryResult.entries;
      } catch (error) {
        console.error('Failed to retrieve memories:', error);
      }
    }
    
    // Estimate token count (very rough approximation)
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);
    
    result.totalTokenEstimate = estimateTokens(result.conversationContext);
    
    // Add code block tokens
    for (const block of result.codeBlocks) {
      const currentVersion = block.versions.find(v => v.id === block.currentVersionId);
      if (currentVersion) {
        result.totalTokenEstimate += estimateTokens(currentVersion.code);
      }
    }
    
    // Add memory tokens
    for (const memory of result.memories) {
      result.totalTokenEstimate += estimateTokens(memory.content);
    }
    
    return result;
  }
  
  /**
   * Get descriptive text for an edit action
   */
  private getActionDescription(action: EditAction, target: EditTarget): string {
    const targetStr = target === 'all' ? 'the entire codebase' : `the ${target} code`;
    
    switch(action) {
      case 'refactor':
        return `Refactor ${targetStr} to`;
      case 'optimize':
        return `Optimize ${targetStr} to`;
      case 'add':
        return `Add to ${targetStr}`;
      case 'remove':
        return `Remove from ${targetStr}`;
      case 'fix':
        return `Fix ${targetStr} to`;
      case 'explain':
        return `Explain ${targetStr}`;
      case 'regenerate':
        return `Regenerate ${targetStr}`;
      case 'modify':
        return `Modify ${targetStr} to`;
      case 'convert':
        return `Convert ${targetStr} to`;
      default:
        return `Update ${targetStr} to`;
    }
  }
  
  /**
   * Determine edit intent from a prompt
   */
  analyzePromptIntent(prompt: string): { action: EditAction, target: EditTarget } {
    return sessionManager.analyzePromptIntent(prompt);
  }
  
  /**
   * Get memories associated with a turn
   */
  async getTurnMemories(turnId: string): Promise<MemoryEntry[]> {
    const turn = this.turns.get(turnId);
    if (!turn || !turn.memoryIds.length) return [];
    
    try {
      const memoryService = await getMemoryService();
      return await memoryService.getMemories('conversation-history', turn.memoryIds);
    } catch (error) {
      console.error('Failed to get turn memories:', error);
      return [];
    }
  }
  
  /**
   * Get related turns based on content similarity
   */
  async findRelatedTurns(content: string, limit: number = 5): Promise<ConversationTurn[]> {
    try {
      const memoryService = await getMemoryService();
      
      // Search for related turns using vector similarity
      const results = await memoryService.findSimilar('conversation-history', content, {
        maxResults: limit,
        threshold: 0.6
      });
      
      // Extract turn IDs from memory metadata
      const turnIds = new Set<string>();
      for (const entry of results.entries) {
        if (entry.metadata.custom?.turnId) {
          turnIds.add(entry.metadata.custom.turnId);
        }
      }
      
      // Get turns
      return Array.from(turnIds)
        .map(id => this.turns.get(id))
        .filter((turn): turn is ConversationTurn => turn !== undefined);
    } catch (error) {
      console.error('Failed to find related turns:', error);
      return [];
    }
  }
}

// Create singleton instance
export const conversationService = new ConversationService();