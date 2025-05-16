/**
 * Terminal Service Implementation
 * Provides secure command execution and terminal session management
 */

import { exec, ExecOptions } from 'child_process';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TerminalService, CommandOptions, CommandResult, TerminalSession, TerminalEvent } from '../../core/interfaces/terminal';
import { Logger } from '../logging/logger';
import { fileSystemService } from '../file-system/file-system-service';

// Initialize logger
const logger = new Logger('TerminalService');

/**
 * Implementation of the TerminalService interface
 */
export class TerminalServiceImpl implements TerminalService {
  private sessions: Map<string, TerminalSession> = new Map();
  private subscribers: Map<string, Set<(event: TerminalEvent) => void>> = new Map();
  private initialized: boolean = false;
  
  // List of allowed commands (for security)
  private allowedCommands: RegExp[] = [
    /^npm (install|run|start|test|build)/,
    /^node /,
    /^git (status|log|pull|push|commit|checkout|branch|merge)/,
    /^ls/,
    /^dir/,
    /^cd /,
    /^mkdir /,
    /^rmdir /,
    /^cat /,
    /^echo /,
    /^type /,
    /^pwd/,
    /^cp /,
    /^copy /,
    /^mv /,
    /^move /,
    /^rm /,
    /^del /,
    /^find /
  ];
  
  // List of explicitly disallowed commands (for security)
  private disallowedCommands: RegExp[] = [
    /^sudo /,
    /^rm -rf /,
    /^deltree /,
    /^format /,
    /^wget /,
    /^curl /,
    /^chmod /,
    /^chown /
  ];

  /**
   * Initialize the terminal service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure file system service is initialized
      if (!fileSystemService.getProjectRoot()) {
        await fileSystemService.initialize();
      }
      
      this.initialized = true;
      logger.info('Terminal service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize terminal service', error);
      throw error;
    }
  }

  /**
   * Execute a command and return the result
   */
  async executeCommand(command: string, options: CommandOptions = {}): Promise<CommandResult> {
    this.ensureInitialized();
    
    // Check if command is allowed
    if (!this.isCommandAllowed(command)) {
      throw new Error(`Command not allowed for security reasons: ${command}`);
    }

    const startTime = Date.now();
    const cwd = options.cwd || fileSystemService.getProjectRoot();
    
    // Prepare exec options
    const execOptions: ExecOptions = {
      cwd,
      env: { ...process.env, ...options.env },
      timeout: options.timeout || 30000,
      maxBuffer: options.maxBuffer || 1024 * 1024, // 1MB default
      shell: options.shell !== false
    };

    try {
      return new Promise<CommandResult>((resolve, reject) => {
        exec(command, execOptions, (error, stdout, stderr) => {
          const duration = Date.now() - startTime;
          
          const result: CommandResult = {
            command,
            exitCode: error ? error.code || 1 : 0,
            stdout: stdout || '',
            stderr: stderr || '',
            timedOut: error?.signal === 'SIGTERM',
            duration,
            cwd
          };
          
          if (error && !result.timedOut) {
            logger.error(`Command execution failed: ${command}`, error);
            // Still resolve with the result, but include error information
            resolve(result);
          } else {
            logger.debug(`Command executed successfully: ${command}`);
            resolve(result);
          }
        });
      });
    } catch (error) {
      logger.error(`Failed to execute command: ${command}`, error);
      throw error;
    }
  }

  /**
   * Create a new terminal session
   */
  async createSession(name?: string, cwd?: string): Promise<TerminalSession> {
    this.ensureInitialized();
    
    const sessionId = uuidv4();
    const now = new Date();
    const workingDir = cwd || fileSystemService.getProjectRoot();
    
    // Verify the working directory exists
    const dirExists = await fileSystemService.exists(workingDir);
    if (!dirExists) {
      throw new Error(`Working directory does not exist: ${workingDir}`);
    }
    
    const session: TerminalSession = {
      id: sessionId,
      name: name || `Terminal ${this.sessions.size + 1}`,
      cwd: workingDir,
      createdAt: now,
      lastUsed: now,
      isActive: true,
      history: []
    };
    
    this.sessions.set(sessionId, session);
    this.subscribers.set(sessionId, new Set());
    
    // Emit session start event
    this.emitEvent(sessionId, {
      type: 'start',
      sessionId,
      data: `Session started in ${workingDir}`,
      timestamp: now
    });
    
    logger.info(`Created terminal session: ${sessionId}`);
    return session;
  }

  /**
   * Get a terminal session by ID
   */
  async getSession(sessionId: string): Promise<TerminalSession | null> {
    this.ensureInitialized();
    return this.sessions.get(sessionId) || null;
  }

  /**
   * List all terminal sessions
   */
  async listSessions(): Promise<TerminalSession[]> {
    this.ensureInitialized();
    return Array.from(this.sessions.values());
  }

  /**
   * Close a terminal session
   */
  async closeSession(sessionId: string): Promise<boolean> {
    this.ensureInitialized();
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    // Update session state
    session.isActive = false;
    
    // Emit close event
    this.emitEvent(sessionId, {
      type: 'close',
      sessionId,
      data: 'Session closed',
      timestamp: new Date()
    });
    
    // Clean up subscribers
    this.subscribers.delete(sessionId);
    
    // Remove the session
    this.sessions.delete(sessionId);
    
    logger.info(`Closed terminal session: ${sessionId}`);
    return true;
  }

  /**
   * Execute a command in a specific session
   */
  async executeInSession(sessionId: string, command: string): Promise<CommandResult> {
    this.ensureInitialized();
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Terminal session not found: ${sessionId}`);
    }
    
    if (!session.isActive) {
      throw new Error(`Terminal session is not active: ${sessionId}`);
    }
    
    // Update last used timestamp
    session.lastUsed = new Date();
    
    // Add command to history
    session.history.push(command);
    
    // Emit command event
    this.emitEvent(sessionId, {
      type: 'command',
      sessionId,
      data: command,
      timestamp: new Date()
    });
    
    try {
      // Execute the command
      const result = await this.executeCommand(command, { cwd: session.cwd });
      
      // Emit output events
      if (result.stdout) {
        this.emitEvent(sessionId, {
          type: 'output',
          sessionId,
          data: result.stdout,
          timestamp: new Date()
        });
      }
      
      if (result.stderr) {
        this.emitEvent(sessionId, {
          type: 'error',
          sessionId,
          data: result.stderr,
          timestamp: new Date()
        });
      }
      
      // Emit exit event
      this.emitEvent(sessionId, {
        type: 'exit',
        sessionId,
        data: `Exit code: ${result.exitCode}`,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      // Emit error event
      this.emitEvent(sessionId, {
        type: 'error',
        sessionId,
        data: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Subscribe to terminal events
   */
  subscribe(sessionId: string, callback: (event: TerminalEvent) => void): () => void {
    const subscribers = this.subscribers.get(sessionId);
    
    if (!subscribers) {
      throw new Error(`Terminal session not found: ${sessionId}`);
    }
    
    subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(sessionId);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  /**
   * Get command history for a session
   */
  async getHistory(sessionId: string, limit?: number): Promise<string[]> {
    this.ensureInitialized();
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Terminal session not found: ${sessionId}`);
    }
    
    const history = [...session.history];
    
    // Return limited history if requested
    if (limit && limit > 0 && limit < history.length) {
      return history.slice(-limit);
    }
    
    return history;
  }

  /**
   * Check if a command is allowed to be executed
   */
  isCommandAllowed(command: string): boolean {
    // Trim the command
    const trimmedCommand = command.trim();
    
    // Check against disallowed commands first
    for (const pattern of this.disallowedCommands) {
      if (pattern.test(trimmedCommand)) {
        return false;
      }
    }
    
    // Then check against allowed commands
    for (const pattern of this.allowedCommands) {
      if (pattern.test(trimmedCommand)) {
        return true;
      }
    }
    
    // If not explicitly allowed, disallow
    return false;
  }

  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Terminal service is not initialized');
    }
  }

  /**
   * Emit an event to all subscribers for a session
   */
  private emitEvent(sessionId: string, event: TerminalEvent): void {
    const subscribers = this.subscribers.get(sessionId);
    
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          logger.error(`Error in terminal event subscriber: ${error}`);
        }
      });
    }
  }
}

// Export a singleton instance
export const terminalService = new TerminalServiceImpl();
