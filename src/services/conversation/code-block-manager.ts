/**
 * Code Block Manager
 * Tracks and versions code blocks throughout a conversation
 */

import { 
  CodeBlockContext, 
  CodeBlockVersion, 
  CodeBlockRef 
} from './conversation-types';
import { StructuredResponse } from '../response-handler';
import { getMemoryService } from '../memory/memory-service';
import { MemoryType } from '../memory/memory-types';

// Simple internal function to generate IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Service for managing code blocks within conversations
 */
export class CodeBlockManager {
  private codeBlocks: Map<string, CodeBlockContext> = new Map();
  
  /**
   * Create a new code block from code content
   */
  createCodeBlock(
    language: string,
    code: string,
    turnId: string,
    metadata?: Partial<CodeBlockContext['metadata']>
  ): CodeBlockContext {
    const blockId = generateId();
    const versionId = generateId();
    
    const version: CodeBlockVersion = {
      id: versionId,
      code,
      createdAt: Date.now(),
      turnId,
      changeSummary: 'Initial version'
    };
    
    const codeBlock: CodeBlockContext = {
      id: blockId,
      language,
      createdAt: Date.now(),
      versions: [version],
      currentVersionId: versionId,
      references: {
        turnIds: [turnId],
        relatedCodeBlockIds: []
      },
      metadata: {
        tags: metadata?.tags || [],
        complexity: metadata?.complexity,
        classification: metadata?.classification,
        custom: metadata?.custom || {}
      }
    };
    
    this.codeBlocks.set(blockId, codeBlock);
    
    // Store in memory service for long-term persistence and search
    this.persistToMemory(codeBlock);
    
    return codeBlock;
  }
  
  /**
   * Get a code block by ID
   */
  getCodeBlock(blockId: string): CodeBlockContext | undefined {
    return this.codeBlocks.get(blockId);
  }
  
  /**
   * Add a new version to an existing code block
   */
  addVersion(
    blockId: string,
    code: string,
    turnId: string,
    changeSummary?: string
  ): CodeBlockVersion | null {
    const block = this.codeBlocks.get(blockId);
    if (!block) return null;
    
    // Get current version as parent
    const parentVersionId = block.currentVersionId;
    const parentVersion = block.versions.find(v => v.id === parentVersionId);
    
    // Create new version
    const versionId = generateId();
    const version: CodeBlockVersion = {
      id: versionId,
      code,
      parentVersionId,
      createdAt: Date.now(),
      turnId,
      changeSummary: changeSummary || 'Updated version'
    };
    
    // Compute diff if parent exists
    if (parentVersion) {
      // Here you'd calculate a diff between parentVersion.code and code
      // For now we're just noting there was a change
      version.diffFromParent = `Changes from previous version`;
    }
    
    // Add version and update references
    block.versions.push(version);
    block.currentVersionId = versionId;
    
    if (!block.references.turnIds.includes(turnId)) {
      block.references.turnIds.push(turnId);
    }
    
    // Update memory
    this.persistToMemory(block);
    
    return version;
  }
  
  /**
   * Extract code blocks from a response and track them
   */
  extractAndTrackCodeBlocks(
    response: StructuredResponse,
    turnId: string
  ): CodeBlockRef[] {
    const refs: CodeBlockRef[] = [];
    
    for (const [language, code] of Object.entries(response.codeBlocks)) {
      // Check if this is a new code block or an update to existing one
      // For now, we'll create a new block each time 
      // (in a real implementation, you'd detect updates to existing blocks)
      const block = this.createCodeBlock(language, code, turnId);
      
      const ref: CodeBlockRef = {
        id: block.id,
        language,
        versionId: block.currentVersionId,
        contextualName: this.inferContextualName(language, code)
      };
      
      refs.push(ref);
    }
    
    return refs;
  }
  
  /**
   * Update existing code blocks based on specific edits
   */
  updateTrackedCodeBlocks(
    refs: CodeBlockRef[],
    response: StructuredResponse,
    turnId: string,
    targetLanguage?: string
  ): CodeBlockRef[] {
    const updatedRefs: CodeBlockRef[] = [];
    
    // Process targeted update
    if (targetLanguage && response.codeBlocks[targetLanguage]) {
      // Find existing block with this language
      const existingRef = refs.find(ref => ref.language === targetLanguage);
      
      if (existingRef) {
        // Update existing block
        const newVersion = this.addVersion(
          existingRef.id,
          response.codeBlocks[targetLanguage],
          turnId,
          `Updated ${targetLanguage} code`
        );
        
        if (newVersion) {
          updatedRefs.push({
            ...existingRef,
            versionId: newVersion.id
          });
        }
      } else {
        // Create new block
        const block = this.createCodeBlock(
          targetLanguage, 
          response.codeBlocks[targetLanguage],
          turnId
        );
        
        updatedRefs.push({
          id: block.id,
          language: targetLanguage,
          versionId: block.currentVersionId,
          contextualName: this.inferContextualName(targetLanguage, response.codeBlocks[targetLanguage])
        });
      }
    } else {
      // Process all code blocks
      for (const [language, code] of Object.entries(response.codeBlocks)) {
        // Find existing block with this language
        const existingRef = refs.find(ref => ref.language === language);
        
        if (existingRef) {
          // Update existing block
          const newVersion = this.addVersion(
            existingRef.id,
            code,
            turnId,
            `Updated ${language} code`
          );
          
          if (newVersion) {
            updatedRefs.push({
              ...existingRef,
              versionId: newVersion.id
            });
          }
        } else {
          // Create new block
          const block = this.createCodeBlock(language, code, turnId);
          
          updatedRefs.push({
            id: block.id,
            language,
            versionId: block.currentVersionId,
            contextualName: this.inferContextualName(language, code)
          });
        }
      }
    }
    
    // Keep references to blocks that weren't updated
    for (const ref of refs) {
      if (!updatedRefs.some(r => r.id === ref.id)) {
        updatedRefs.push(ref);
      }
    }
    
    return updatedRefs;
  }
  
  /**
   * Get current code content for all code blocks in refs
   */
  getCodeContent(refs: CodeBlockRef[]): Record<string, string> {
    const content: Record<string, string> = {};
    
    for (const ref of refs) {
      const block = this.codeBlocks.get(ref.id);
      if (!block) continue;
      
      const version = block.versions.find(v => v.id === ref.versionId) || 
                     block.versions.find(v => v.id === block.currentVersionId);
      
      if (version) {
        content[ref.language] = version.code;
      }
    }
    
    return content;
  }
  
  /**
   * Create relations between code blocks
   */
  relateCodeBlocks(sourceId: string, targetId: string): boolean {
    const source = this.codeBlocks.get(sourceId);
    const target = this.codeBlocks.get(targetId);
    
    if (!source || !target) return false;
    
    // Add bidirectional relationship
    if (!source.references.relatedCodeBlockIds.includes(targetId)) {
      source.references.relatedCodeBlockIds.push(targetId);
    }
    
    if (!target.references.relatedCodeBlockIds.includes(sourceId)) {
      target.references.relatedCodeBlockIds.push(sourceId);
    }
    
    return true;
  }
  
  /**
   * Get all code blocks that reference a specific turn
   */
  getCodeBlocksForTurn(turnId: string): CodeBlockContext[] {
    return Array.from(this.codeBlocks.values())
      .filter(block => block.references.turnIds.includes(turnId));
  }
  
  /**
   * Get specific version of a code block
   */
  getCodeBlockVersion(blockId: string, versionId: string): CodeBlockVersion | null {
    const block = this.codeBlocks.get(blockId);
    if (!block) return null;
    
    return block.versions.find(v => v.id === versionId) || null;
  }
  
  /**
   * Get version history for a code block
   */
  getVersionHistory(blockId: string): CodeBlockVersion[] {
    const block = this.codeBlocks.get(blockId);
    if (!block) return [];
    
    // Sort versions by creation time
    return [...block.versions].sort((a, b) => a.createdAt - b.createdAt);
  }
  
  /**
   * Try to infer a contextual name for a code block
   */
  private inferContextualName(language: string, code: string): string | undefined {
    // Basic heuristics to infer code block purpose
    if (language === 'html') {
      if (code.includes('<html') || code.includes('<!DOCTYPE')) {
        return 'Main HTML document';
      }
      
      if (code.includes('<nav')) {
        return 'Navigation component';
      }
      
      if (code.includes('<form')) {
        return 'Form component';
      }
    }
    
    if (language === 'js' || language === 'ts') {
      // Check for component patterns
      if (code.includes('class') && code.includes('extends Component')) {
        const matches = code.match(/class\s+(\w+)/);
        if (matches && matches[1]) {
          return `${matches[1]} component`;
        }
      }
      
      // Check for function components
      if (code.includes('function') && code.includes('return') && code.includes('<')) {
        const matches = code.match(/function\s+(\w+)/);
        if (matches && matches[1]) {
          return `${matches[1]} component`;
        }
      }
      
      // Check for utility functions
      if (code.includes('function') && !code.includes('<')) {
        return 'Utility functions';
      }
    }
    
    if (language === 'css') {
      return 'Stylesheet';
    }
    
    if (language === 'python') {
      if (code.includes('def ') && code.includes('class ')) {
        return 'Python class definition';
      }
      if (code.includes('def ')) {
        return 'Python functions';
      }
    }
    
    // Default to language-based name
    return `${language} code`;
  }
  
  /**
   * Persist code block to memory service for long-term storage
   */
  private async persistToMemory(block: CodeBlockContext): Promise<void> {
    try {
      const memoryService = await getMemoryService();
      
      // Ensure code collection exists
      await memoryService.createCollection({
        name: 'code-blocks',
        metadata: {
          description: 'Code block storage for conversation manager'
        }
      }).catch(() => {/* Ignore if already exists */});
      
      // Current version of the code
      const currentVersion = block.versions.find(v => v.id === block.currentVersionId);
      if (!currentVersion) return;
      
      // Store the code block
      await memoryService.addMemory(
        'code-blocks',
        currentVersion.code,
        {
          type: MemoryType.CODE,
          source: 'conversation-manager',
          tags: [...(block.metadata.tags || []), block.language],
          language: block.language,
          title: block.filename || `${block.language} code block`,
          custom: {
            blockId: block.id,
            versionId: currentVersion.id,
            purpose: block.purpose,
            turnIds: block.references.turnIds,
            history: block.versions.map(v => ({
              id: v.id,
              createdAt: v.createdAt,
              turnId: v.turnId,
              changeSummary: v.changeSummary
            }))
          }
        }
      );
    } catch (error) {
      console.error('Failed to persist code block to memory:', error);
    }
  }
  
  /**
   * Load code blocks from memory service
   */
  async loadFromMemory(): Promise<void> {
    try {
      const memoryService = await getMemoryService();
      
      // Get all code blocks from memory
      const result = await memoryService.searchMemories('code-blocks', {
        types: [MemoryType.CODE],
        maxResults: 1000
      });
      
      // Process results
      for (const entry of result.entries) {
        if (!entry.metadata.custom?.blockId) continue;
        
        // Check if we already have this block loaded
        if (this.codeBlocks.has(entry.metadata.custom.blockId)) continue;
        
        // Reconstruct code block from memory
        const blockId = entry.metadata.custom.blockId;
        const versions: CodeBlockVersion[] = [];
        
        // Reconstruct versions
        if (Array.isArray(entry.metadata.custom.history)) {
          for (const historyItem of entry.metadata.custom.history) {
            versions.push({
              id: historyItem.id,
              code: historyItem.id === entry.metadata.custom.versionId ? entry.content : '',
              createdAt: historyItem.createdAt,
              turnId: historyItem.turnId,
              changeSummary: historyItem.changeSummary
            });
          }
        }
        
        // Ensure we have at least the current version
        if (versions.length === 0) {
          versions.push({
            id: entry.metadata.custom.versionId,
            code: entry.content,
            createdAt: entry.createdAt,
            turnId: Array.isArray(entry.metadata.custom.turnIds) ? 
              entry.metadata.custom.turnIds[0] : 'unknown',
            changeSummary: 'Restored from memory'
          });
        }
        
        // Create code block
        const codeBlock: CodeBlockContext = {
          id: blockId,
          language: entry.metadata.language || '',
          filename: entry.metadata.title,
          purpose: entry.metadata.custom.purpose,
          createdAt: entry.createdAt,
          versions,
          currentVersionId: entry.metadata.custom.versionId,
          references: {
            turnIds: Array.isArray(entry.metadata.custom.turnIds) ? 
              entry.metadata.custom.turnIds : [],
            relatedCodeBlockIds: []
          },
          metadata: {
            tags: entry.metadata.tags || [],
            classification: entry.metadata.custom.classification,
            custom: entry.metadata.custom || {}
          }
        };
        
        this.codeBlocks.set(blockId, codeBlock);
      }
    } catch (error) {
      console.error('Failed to load code blocks from memory:', error);
    }
  }
}

// Create singleton instance
export const codeBlockManager = new CodeBlockManager();

// Initialize by loading from memory
(async function() {
  try {
    await codeBlockManager.loadFromMemory();
  } catch (error) {
    console.error('Failed to initialize code block manager:', error);
  }
})();