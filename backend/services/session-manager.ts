/**
 * Session Manager
 * Manages conversational context and code iteration history
 */

import { StructuredResponse } from './response-handler';
import { AIPrompt } from './providers/index';
import { getStorage } from '@shared/services/storage';

// Simple internal function to generate IDs instead of relying on uuid package
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Types of edits that can be requested in follow-up prompts
export type EditAction = 
  'refactor' | 'optimize' | 'add' | 'remove' | 'fix' | 
  'explain' | 'regenerate' | 'modify' | 'convert';

// Target of the edit (which language/part)
export type EditTarget = string; // Language or 'all'

// Session represents a conversation thread with history
export interface Session {
  id: string;
  title: string;
  created: number;
  updated: number;
  iterations: SessionIteration[];
  activeIterationIndex: number;
}

// A single iteration within a session
export interface SessionIteration {
  id: string;
  prompt: AIPrompt;
  response: StructuredResponse;
  timestamp: number;
  editAction?: EditAction;
  editTarget?: EditTarget;
  provider: string;
  model: string;
}

/**
 * Session history for handling conversation context and code iterations
 */
export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private currentSessionId: string | null = null;
  private storage = getStorage();
  
  /**
   * Create a new session
   */
  createSession(title: string = 'New Session'): string {
    const id = generateId();
    const session: Session = {
      id,
      title,
      created: Date.now(),
      updated: Date.now(),
      iterations: [],
      activeIterationIndex: -1
    };
    
    this.sessions.set(id, session);
    this.currentSessionId = id;
    
    this.saveSession(id);
    return id;
  }
  
  /**
   * Get a session by ID
   */
  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }
  
  /**
   * Get the current active session
   */
  getCurrentSession(): Session | undefined {
    if (!this.currentSessionId) return undefined;
    return this.sessions.get(this.currentSessionId);
  }
  
  /**
   * Set the current active session
   */
  setCurrentSession(id: string): boolean {
    if (!this.sessions.has(id)) return false;
    this.currentSessionId = id;
    return true;
  }
  
  /**
   * Get all sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
  
  /**
   * Add a new iteration to a session
   */
  addIteration(
    sessionId: string,
    prompt: AIPrompt,
    response: StructuredResponse,
    provider: string,
    model: string,
    editAction?: EditAction,
    editTarget?: EditTarget
  ): string {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    
    const iterationId = generateId();
    const iteration: SessionIteration = {
      id: iterationId,
      prompt,
      response,
      timestamp: Date.now(),
      provider,
      model,
      editAction,
      editTarget
    };
    
    // If we're not at the end of the history, truncate the future iterations
    if (session.activeIterationIndex < session.iterations.length - 1) {
      session.iterations = session.iterations.slice(0, session.activeIterationIndex + 1);
    }
    
    session.iterations.push(iteration);
    session.activeIterationIndex = session.iterations.length - 1;
    session.updated = Date.now();
    
    this.saveSession(sessionId);
    return iterationId;
  }
  
  /**
   * Update a session's title
   */
  updateSessionTitle(sessionId: string, title: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.title = title;
    session.updated = Date.now();
    this.saveSession(sessionId);
    return true;
  }
  
  /**
   * Navigate to a specific iteration in the history
   */
  navigateToIteration(sessionId: string, iterationIndex: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    if (iterationIndex < 0 || iterationIndex >= session.iterations.length) {
      return false;
    }
    
    session.activeIterationIndex = iterationIndex;
    return true;
  }
  
  /**
   * Delete a session
   */
  deleteSession(sessionId: string): boolean {
    if (!this.sessions.has(sessionId)) return false;

    this.sessions.delete(sessionId);
    this.storage.removeItem(`session_${sessionId}`);
    
    // If we deleted the current session, set current to null
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    
    return true;
  }
  
  /**
   * Fork a session at a specific iteration, creating a new branch
   */
  forkSession(sessionId: string, iterationIndex: number, newTitle?: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    if (iterationIndex < 0 || iterationIndex >= session.iterations.length) {
      return null;
    }
    
    // Create a new session with iterations up to the specified index
    const newSessionId = this.createSession(newTitle || `${session.title} (fork)`);
    const newSession = this.sessions.get(newSessionId)!;
    
    // Copy iterations up to and including the specified index
    newSession.iterations = session.iterations.slice(0, iterationIndex + 1).map(it => ({...it}));
    newSession.activeIterationIndex = iterationIndex;
    
    this.saveSession(newSessionId);
    return newSessionId;
  }
  
  /**
   * Generate a follow-up prompt based on previous context
   */
  generateFollowUpPrompt(
    sessionId: string, 
    userPrompt: string,
    editAction: EditAction,
    editTarget: EditTarget
  ): AIPrompt {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    
    const currentIteration = session.iterations[session.activeIterationIndex];
    if (!currentIteration) {
      // No previous context, return as new prompt
      return { content: userPrompt };
    }
    
    // Build context from previous iteration
    let context = `I previously generated code based on this request: "${currentIteration.prompt.content}".`;
    
    // Add information about the current code
    const codeBlocks = currentIteration.response.codeBlocks;
    const languages = Object.keys(codeBlocks);
    
    if (languages.length > 0) {
      context += ` The solution included code in: ${languages.join(', ')}.`;
    }
    
    // Add specific target information
    if (editTarget && editTarget !== 'all' && codeBlocks[editTarget]) {
      context += `\n\nHere is the current ${editTarget} code:\n\`\`\`${editTarget}\n${codeBlocks[editTarget]}\n\`\`\``;
    } else if (editTarget === 'all') {
      // Include all code blocks
      for (const [lang, code] of Object.entries(codeBlocks)) {
        context += `\n\nHere is the current ${lang} code:\n\`\`\`${lang}\n${code}\n\`\`\``;
      }
    }
    
    // Add action information
    const actionDescription = this.getActionDescription(editAction, editTarget);
    let enhancedPrompt = `${actionDescription}: ${userPrompt}`;
    
    return {
      content: enhancedPrompt,
      context
    };
  }
  
  /**
   * Get a description for an edit action
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
   * Determine the action and target from a user prompt
   */
  analyzePromptIntent(prompt: string): { action: EditAction, target: EditTarget } {
    // Default values
    let action: EditAction = 'modify';
    let target: EditTarget = 'all';
    
    // Check for action keywords
    const actionKeywords: Record<EditAction, string[]> = {
      'refactor': ['refactor', 'restructure', 'rewrite'],
      'optimize': ['optimize', 'improve', 'speed up', 'faster'],
      'add': ['add', 'include', 'insert', 'create'],
      'remove': ['remove', 'delete', 'take out'],
      'fix': ['fix', 'debug', 'solve', 'correct'],
      'explain': ['explain', 'describe', 'clarify'],
      'regenerate': ['regenerate', 'redo', 'start over'],
      'modify': ['modify', 'change', 'update'],
      'convert': ['convert', 'transform', 'port']
    };
    
    // Check for target keywords
    const targetKeywords: Record<string, string[]> = {
      'html': ['html', 'markup', 'structure', 'dom'],
      'css': ['css', 'style', 'styling', 'design'],
      'js': ['javascript', 'js', 'script', 'functionality'],
      'python': ['python', 'py'],
      'all': ['everything', 'all', 'code', 'project']
    };
    
    // Detect action
    for (const [act, keywords] of Object.entries(actionKeywords)) {
      if (keywords.some(keyword => prompt.toLowerCase().includes(keyword))) {
        action = act as EditAction;
        break;
      }
    }
    
    // Detect target
    for (const [tgt, keywords] of Object.entries(targetKeywords)) {
      if (keywords.some(keyword => prompt.toLowerCase().includes(keyword))) {
        target = tgt;
        break;
      }
    }
    
    return { action, target };
  }
  
  /**
   * Save a session using the configured storage
   */
  private saveSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      this.storage.setItem(`session_${sessionId}`, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }
  
  /**
   * Load all sessions from storage
   */
  loadSessions(): void {
    try {
      for (const key of this.storage.keys()) {
        if (key.startsWith('session_')) {
          const sessionId = key.replace('session_', '');
          const sessionData = this.storage.getItem(key);

          if (sessionData) {
            const session = JSON.parse(sessionData) as Session;
            this.sessions.set(sessionId, session);
          }
        }
      }
      
      // Set current session to most recently updated
      const sessions = Array.from(this.sessions.values());
      if (sessions.length > 0) {
        const mostRecent = sessions.sort((a, b) => b.updated - a.updated)[0];
        this.currentSessionId = mostRecent.id;
      }
    } catch (error) {
this.currentSessionId = mostRecent.id;
      }
    } catch (error) {
      // TODO: Implement a more robust logging system
      console.error('Error loading sessions:', error);
    }
  }
    }
  }
}

// Create a singleton instance for use throughout the app
export const sessionManager = new SessionManager();

// Load sessions on initialization
sessionManager.loadSessions();