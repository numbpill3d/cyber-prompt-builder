/**
 * Conversation Service Implementation
 * Implements the ConversationManager interface
 */

// Simple ID generator since we don't have uuid/nanoid
function generateId(prefix: string = ''): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}
import {
  ConversationManager,
  AIPrompt,
  ConversationTurn,
  EditAction,
  EditTarget,
  ConversationBranch,
  ContextRetrievalOptions,
  ContextBundle,
  CodeBlock,
  CodeBlockRef,
  CodeBlockVersion
} from '../../core/interfaces/conversation-manager';
import { StructuredResponse } from '../../core/models/response';
import { MemoryEntry, MemoryService } from '../../core/interfaces/memory-engine';
import { getService } from '../../core/services/service-locator';

/**
 * Implementation of the ConversationManager interface
 */
export class ConversationService implements ConversationManager {
  private memoryService: MemoryService;
  private branches: Map<string, ConversationBranch> = new Map();
  private activeBranchId: string | null = null;
  private codeBlocks: Map<string, CodeBlock> = new Map();
  
  constructor() {
    this.memoryService = getService<MemoryService>('memoryService');
    this.initialize();
  }
  
  /**
   * Initialize the conversation service
   */
  private initialize(): void {
    // Create a default branch if none exists
    if (this.branches.size === 0) {
      const defaultBranch: ConversationBranch = {
        id: generateId('branch'),
        name: 'Main Conversation',
        rootTurnId: '',
        createdAt: Date.now(),
        active: true,
        turns: []
      };
      
      this.branches.set(defaultBranch.id, defaultBranch);
      this.activeBranchId = defaultBranch.id;
    }
  }
  
  /**
   * Add a new turn to the conversation
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
      throw new Error('No active conversation branch found');
    }
    
    // Process code blocks in response
    const codeBlockRefs: CodeBlockRef[] = this.extractCodeBlockRefs(response);
    
    // Create the turn
    const turn: ConversationTurn = {
      id: generateId('turn'),
      timestamp: Date.now(),
      prompt,
      response,
      codeBlockRefs,
      editAction,
      editTarget,
      provider,
      model,
      parentTurnId,
      memoryIds: [],
      metadata: {
        tags: [],
        importance: 1,
        custom: {}
      }
    };
    
    // Add to branch
    branch.turns.push(turn);
    
    // If this is the first turn in the branch, update rootTurnId
    if (branch.turns.length === 1) {
      branch.rootTurnId = turn.id;
    }
    
    // Store in memory service
    const memoryEntry = await this.memoryService.addMemory('conversationTurns', 
      JSON.stringify({
        prompt: turn.prompt,
        response: turn.response,
        editAction: turn.editAction,
        editTarget: turn.editTarget
      }), 
      {
        type: 'CHAT' as any, // Cast to any to bypass type checking
        turnId: turn.id,
        branchId: branch.id,
        timestamp: turn.timestamp,
        provider,
        model,
        tags: [...(turn.metadata.tags || [])],
        sessionId: branch.id
      }
    );
    
    // Update turn with memory ID
    turn.memoryIds.push(memoryEntry.id);
    
    return turn;
  }
  
  /**
   * Get a specific turn by ID
   */
  getTurn(turnId: string): ConversationTurn | undefined {
    // Check all branches for the turn
    for (const branch of this.branches.values()) {
      const turn = branch.turns.find(t => t.id === turnId);
      if (turn) return turn;
    }
    return undefined;
  }
  
  /**
   * Get all descendants of a turn
   */
  getTurnDescendants(turnId: string): ConversationTurn[] {
    const descendants: ConversationTurn[] = [];
    const processedTurns = new Set<string>();
    
    // Process all branches
    for (const branch of this.branches.values()) {
      // Find turns with the parentTurnId
      const directDescendants = branch.turns.filter(t => t.parentTurnId === turnId);
      
      // Add direct descendants and their descendants recursively
      for (const turn of directDescendants) {
        if (!processedTurns.has(turn.id)) {
          descendants.push(turn);
          processedTurns.add(turn.id);
          
          // Add recursive descendants
          const childDescendants = this.getTurnDescendants(turn.id);
          for (const child of childDescendants) {
            if (!processedTurns.has(child.id)) {
              descendants.push(child);
              processedTurns.add(child.id);
            }
          }
        }
      }
    }
    
    return descendants;
  }
  
  /**
   * Get the currently active branch
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
    
    // Set current branch as inactive
    if (this.activeBranchId) {
      const currentBranch = this.branches.get(this.activeBranchId);
      if (currentBranch) currentBranch.active = false;
    }
    
    // Update active branch
    this.activeBranchId = branchId;
    const newActiveBranch = this.branches.get(branchId);
    if (newActiveBranch) newActiveBranch.active = true;
    
    return true;
  }
  
  /**
   * Create a new branch from a specific turn
   */
  createBranch(turnId: string, name?: string, description?: string): string | null {
    // Find the turn
    const turn = this.getTurn(turnId);
    if (!turn) return null;
    
    // Create a new branch
    const newBranch: ConversationBranch = {
      id: generateId('branch'),
      name: name || `Branch from ${new Date().toLocaleString()}`,
      description,
      rootTurnId: turnId,
      createdAt: Date.now(),
      active: false,
      turns: []
    };
    
    // If the turn is already in an existing branch, copy the path up to that turn
    let sourceBranch: ConversationBranch | undefined;
    let turnPath: ConversationTurn[] = [];
    
    for (const branch of this.branches.values()) {
      const turnIndex = branch.turns.findIndex(t => t.id === turnId);
      if (turnIndex >= 0) {
        sourceBranch = branch;
        turnPath = branch.turns.slice(0, turnIndex + 1);
        break;
      }
    }
    
    if (sourceBranch && turnPath.length > 0) {
      // Deep clone the turns to avoid reference issues
      newBranch.turns = turnPath.map(t => ({...t}));
    } else {
      // Just add the single turn if we couldn't find a path
      if (turn) newBranch.turns.push({...turn});
    }
    
    // Add to branches
    this.branches.set(newBranch.id, newBranch);
    
    return newBranch.id;
  }
  
  /**
   * Get all conversation branches
   */
  getAllBranches(): ConversationBranch[] {
    return Array.from(this.branches.values());
  }
  
  /**
   * Get all turns in the active branch
   */
  getActiveBranchTurns(): ConversationTurn[] {
    const branch = this.getActiveBranch();
    return branch ? branch.turns : [];
  }
  
  /**
   * Retrieve conversation context based on options
   */
  async retrieveContext(
    options: ContextRetrievalOptions = {}, 
    referenceTurnId?: string
  ): Promise<ContextBundle> {
    const branch = this.getActiveBranch();
    if (!branch) {
      throw new Error('No active conversation branch found');
    }
    
    // Default options
    const defaults: ContextRetrievalOptions = {
      turnLimit: 10,
      includeCodeBlocks: true,
      codeBlockLimit: 5,
      includeMemories: true,
      similarityThreshold: 0.7
    };
    
    const mergedOptions: ContextRetrievalOptions = {...defaults, ...options};
    
    // Get turns for context
    let relevantTurns: ConversationTurn[] = [];
    
    if (referenceTurnId) {
      // Get specific turn and its ancestors up to limit
      const referenceTurn = this.getTurn(referenceTurnId);
      if (referenceTurn) {
        relevantTurns = this.getTurnLineage(referenceTurn, mergedOptions.turnLimit || 10);
      }
    } else {
      // Get most recent turns up to limit
      relevantTurns = branch.turns.slice(-1 * (mergedOptions.turnLimit || 10));
    }
    
    // Build conversation context
    let conversationContext = relevantTurns
      .map(turn => `User: ${turn.prompt.content}\nAssistant: ${turn.response.explanation || turn.response.raw || ''}`)
      .join('\n\n');
    
    // Get code blocks
    const codeBlocks: CodeBlock[] = [];
    if (mergedOptions.includeCodeBlocks) {
      const codeBlockMap = new Map<string, CodeBlock>();
      
      // Collect code blocks from relevant turns
      for (const turn of relevantTurns) {
        for (const ref of turn.codeBlockRefs) {
          const block = this.codeBlocks.get(ref.id);
          if (block && !codeBlockMap.has(block.id)) {
            codeBlockMap.set(block.id, block);
          }
        }
      }
      
      // Add most recent code blocks up to limit
      const sortedBlocks = Array.from(codeBlockMap.values())
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, mergedOptions.codeBlockLimit || 5);
      
      codeBlocks.push(...sortedBlocks);
    }
    
    // Get memories
    let memories: MemoryEntry[] = [];
    if (mergedOptions.includeMemories) {
      // Use semantic search if a query is provided
      if (mergedOptions.semanticSearchQuery) {
        const searchResults = await this.memoryService.findSimilar('conversationTurns',
          mergedOptions.semanticSearchQuery,
          { 
            threshold: mergedOptions.similarityThreshold || 0.7,
            maxResults: 10,
            types: mergedOptions.memoryTypes as any[]
          }
        );
        memories = searchResults.entries;
      } else {
        // Otherwise just get memories related to the turns
        const memoryIds = relevantTurns.flatMap(turn => turn.memoryIds);
        if (memoryIds.length > 0) {
          memories = await this.memoryService.getMemories('conversationTurns', memoryIds);
        }
      }
    }
    
    // Estimate token count (very rough approximation)
    const totalTokenEstimate = 
      this.estimateTokens(conversationContext) +
      codeBlocks.reduce((sum, block) => {
        const version = block.versions.find(v => v.id === block.currentVersionId);
        return sum + this.estimateTokens(version?.code || '');
      }, 0) +
      memories.reduce((sum, mem) => sum + this.estimateTokens(mem.content), 0);
    
    return {
      conversationContext,
      referencedTurns: relevantTurns,
      codeBlocks,
      memories,
      totalTokenEstimate
    };
  }
  
  /**
   * Generate a follow-up prompt based on user input and edit action
   */
  async generateFollowUpPrompt(
    userPrompt: string,
    editAction: EditAction,
    editTarget: EditTarget,
    turnId?: string
  ): Promise<AIPrompt> {
    // Get context for the prompt
    const contextOptions: ContextRetrievalOptions = {
      turnLimit: 3,
      includeCodeBlocks: true,
      codeBlockLimit: 2,
      includeMemories: true
    };
    
    const context = await this.retrieveContext(contextOptions, turnId);
    
    // Format a context string
    let contextString = `Action: ${editAction}\nTarget: ${editTarget}\n\n`;
    
    // Add conversation context
    if (context.conversationContext) {
      contextString += `Recent conversation:\n${context.conversationContext}\n\n`;
    }
    
    // Add code blocks if relevant to the edit target
    if (context.codeBlocks.length > 0) {
      contextString += 'Relevant code blocks:\n';
      
      for (const block of context.codeBlocks) {
        const version = block.versions.find(v => v.id === block.currentVersionId);
        if (version) {
          contextString += `Language: ${block.language}\n\`\`\`${block.language}\n${version.code}\n\`\`\`\n\n`;
        }
      }
    }
    
    return {
      content: userPrompt,
      context: contextString
    };
  }
  
  /**
   * Analyze the intent of a user prompt
   */
  analyzePromptIntent(prompt: string): { action: EditAction, target: EditTarget } {
    // This is a simplified implementation
    // In a real system, this would use more sophisticated NLP
    
    // Default values
    let action = EditAction.EXPLAIN;
    let target = 'general';
    
    // Check for action keywords
    if (prompt.match(/\b(refactor|improve|clean)\b/i)) action = EditAction.REFACTOR;
    else if (prompt.match(/\b(optimize|speed|performance)\b/i)) action = EditAction.OPTIMIZE;
    else if (prompt.match(/\b(add|extend|implement|create)\b/i)) action = EditAction.ADD;
    else if (prompt.match(/\b(remove|delete|eliminate)\b/i)) action = EditAction.REMOVE;
    else if (prompt.match(/\b(fix|correct|resolve|debug)\b/i)) action = EditAction.FIX;
    else if (prompt.match(/\b(explain|clarify|describe)\b/i)) action = EditAction.EXPLAIN;
    else if (prompt.match(/\b(regenerate|redo)\b/i)) action = EditAction.REGENERATE;
    else if (prompt.match(/\b(modify|change|update)\b/i)) action = EditAction.MODIFY;
    else if (prompt.match(/\b(convert|transform|translate)\b/i)) action = EditAction.CONVERT;
    
    // Extract potential targets
    const codeTargets = prompt.match(/\b(\w+\.\w+|\w+\.js|\w+\.ts|\w+\.py|\w+\.java|\w+\.c|function \w+|\w+ function|class \w+)\b/i);
    if (codeTargets) {
      target = codeTargets[1];
    }
    
    return { action, target };
  }
  
  /**
   * Get memories associated with a turn
   */
  async getTurnMemories(turnId: string): Promise<MemoryEntry[]> {
    const turn = this.getTurn(turnId);
    if (!turn || turn.memoryIds.length === 0) return [];
    
    return this.memoryService.getMemories('conversationTurns', turn.memoryIds);
  }
  
  /**
   * Find turns related to specific content
   */
  async findRelatedTurns(content: string, limit: number = 5): Promise<ConversationTurn[]> {
    // Search for similar content in memory
    const searchResults = await this.memoryService.findSimilar('conversationTurns', content, {
      maxResults: limit,
      threshold: 0.6
    });
    
    // Convert memory entries back to turns
    const relatedTurns: ConversationTurn[] = [];
    for (const entry of searchResults.entries) {
      const turnId = entry.metadata.custom?.turnId;
      if (turnId) {
        const turn = this.getTurn(turnId);
        if (turn && !relatedTurns.some(t => t.id === turn.id)) {
          relatedTurns.push(turn);
        }
      }
    }
    
    return relatedTurns;
  }
  
  /**
   * Extract code block references from a structured response
   */
  private extractCodeBlockRefs(response: StructuredResponse): CodeBlockRef[] {
    const refs: CodeBlockRef[] = [];
    
    // Check for code blocks in the response
    if (response.codeBlocks && response.codeBlocks.length > 0) {
      for (const codeBlock of response.codeBlocks) {
        // Generate an ID for the code block
        const blockId = generateId('code');
        
        // Create a reference
        const ref: CodeBlockRef = {
          id: blockId,
          language: codeBlock.language || 'text',
          lineStart: 0,  // These would be determined by the actual position
          lineEnd: 0     // in the UI where the code block is rendered
        };
        
        // Store the code block
        this.storeCodeBlock(blockId, codeBlock.code, codeBlock.language || 'text');
        
        refs.push(ref);
      }
    }
    
    return refs;
  }
  
  /**
   * Store a code block
   */
  private storeCodeBlock(id: string, code: string, language: string): void {
    const timestamp = Date.now();
    
    // Create a version
    const version = {
      id: generateId('version'),
      code,
      createdAt: timestamp
    };
    
    // Create or update the code block
    if (this.codeBlocks.has(id)) {
      // Update existing code block
      const block = this.codeBlocks.get(id)!;
      block.versions.push(version);
      block.currentVersionId = version.id;
      block.updatedAt = timestamp;
    } else {
      // Create new code block
      const block: CodeBlock = {
        id,
        language,
        versions: [version],
        currentVersionId: version.id,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      this.codeBlocks.set(id, block);
    }
  }
  
  /**
   * Get the lineage (ancestors) of a turn up to a limit
   */
  private getTurnLineage(turn: ConversationTurn, limit: number): ConversationTurn[] {
    const lineage: ConversationTurn[] = [turn];
    let currentTurn = turn;
    
    while (lineage.length < limit && currentTurn.parentTurnId) {
      const parentTurn = this.getTurn(currentTurn.parentTurnId);
      if (!parentTurn) break;
      
      lineage.unshift(parentTurn);
      currentTurn = parentTurn;
    }
    
    return lineage;
  }
  
  /**
   * Estimate token count for a string
   * This is a very rough approximation
   */
  private estimateTokens(text: string): number {
    if (!text) return 0;
    // Rough estimate: ~4 chars per token for English
    return Math.ceil(text.length / 4);
  }
}

// Factory function
export function createConversationService(): ConversationManager {
  return new ConversationService();
}