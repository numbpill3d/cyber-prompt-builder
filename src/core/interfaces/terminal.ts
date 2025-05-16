/**
 * Terminal Interface
 * Provides a secure interface for executing commands and managing terminal sessions
 */

/**
 * Command execution options
 */
export interface CommandOptions {
  /** Working directory for the command */
  cwd?: string;
  
  /** Environment variables to set */
  env?: Record<string, string>;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Whether to capture stderr */
  captureStderr?: boolean;
  
  /** Whether to capture stdout */
  captureStdout?: boolean;
  
  /** Whether to run in shell */
  shell?: boolean;
  
  /** Maximum buffer size for output (in bytes) */
  maxBuffer?: number;
}

/**
 * Result of a command execution
 */
export interface CommandResult {
  /** Command that was executed */
  command: string;
  
  /** Exit code of the command */
  exitCode: number;
  
  /** Standard output */
  stdout: string;
  
  /** Standard error */
  stderr: string;
  
  /** Whether the command timed out */
  timedOut: boolean;
  
  /** Duration of execution in milliseconds */
  duration: number;
  
  /** Working directory the command was executed in */
  cwd: string;
}

/**
 * Terminal session information
 */
export interface TerminalSession {
  /** Unique ID for the terminal session */
  id: string;
  
  /** Name of the terminal session */
  name: string;
  
  /** Current working directory */
  cwd: string;
  
  /** When the session was created */
  createdAt: Date;
  
  /** When the session was last used */
  lastUsed: Date;
  
  /** Whether the session is currently active */
  isActive: boolean;
  
  /** Command history */
  history: string[];
}

/**
 * Terminal event types
 */
export type TerminalEventType = 
  | 'output' 
  | 'error' 
  | 'command' 
  | 'exit' 
  | 'start' 
  | 'close';

/**
 * Terminal event data
 */
export interface TerminalEvent {
  /** Type of event */
  type: TerminalEventType;
  
  /** Session ID */
  sessionId: string;
  
  /** Event data */
  data: string;
  
  /** Timestamp */
  timestamp: Date;
}

/**
 * Terminal Service Interface
 */
export interface TerminalService {
  /**
   * Initialize the terminal service
   */
  initialize(): Promise<void>;
  
  /**
   * Execute a command and return the result
   * @param command Command to execute
   * @param options Command options
   */
  executeCommand(command: string, options?: CommandOptions): Promise<CommandResult>;
  
  /**
   * Create a new terminal session
   * @param name Optional name for the session
   * @param cwd Initial working directory
   */
  createSession(name?: string, cwd?: string): Promise<TerminalSession>;
  
  /**
   * Get a terminal session by ID
   * @param sessionId Session ID
   */
  getSession(sessionId: string): Promise<TerminalSession | null>;
  
  /**
   * List all terminal sessions
   */
  listSessions(): Promise<TerminalSession[]>;
  
  /**
   * Close a terminal session
   * @param sessionId Session ID
   */
  closeSession(sessionId: string): Promise<boolean>;
  
  /**
   * Execute a command in a specific session
   * @param sessionId Session ID
   * @param command Command to execute
   */
  executeInSession(sessionId: string, command: string): Promise<CommandResult>;
  
  /**
   * Subscribe to terminal events
   * @param sessionId Session ID
   * @param callback Callback function for events
   */
  subscribe(sessionId: string, callback: (event: TerminalEvent) => void): () => void;
  
  /**
   * Get command history for a session
   * @param sessionId Session ID
   * @param limit Maximum number of history items to return
   */
  getHistory(sessionId: string, limit?: number): Promise<string[]>;
  
  /**
   * Check if a command is allowed to be executed
   * @param command Command to check
   */
  isCommandAllowed(command: string): boolean;
}
