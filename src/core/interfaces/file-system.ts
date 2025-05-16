/**
 * File System Interface
 * Provides a secure interface for file operations within the project
 */

/**
 * File information object
 */
export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: Date;
  extension?: string;
  content?: string;
}

/**
 * Search options for finding files
 */
export interface FileSearchOptions {
  recursive?: boolean;
  includeContent?: boolean;
  fileTypes?: string[];
  maxResults?: number;
  searchPattern?: RegExp | string;
}

/**
 * File write options
 */
export interface FileWriteOptions {
  createDirectories?: boolean;
  overwrite?: boolean;
  encoding?: string;
}

/**
 * File read options
 */
export interface FileReadOptions {
  encoding?: string;
}

/**
 * Result of a file search operation
 */
export interface FileSearchResult {
  files: FileInfo[];
  totalFound: number;
  searchOptions: FileSearchOptions;
}

/**
 * File System Service Interface
 */
export interface FileSystemService {
  /**
   * Initialize the file system service
   */
  initialize(): Promise<void>;
  
  /**
   * Read a file's content
   * @param path Path to the file
   * @param options Read options
   */
  readFile(path: string, options?: FileReadOptions): Promise<string>;
  
  /**
   * Write content to a file
   * @param path Path to the file
   * @param content Content to write
   * @param options Write options
   */
  writeFile(path: string, content: string, options?: FileWriteOptions): Promise<void>;
  
  /**
   * Check if a file or directory exists
   * @param path Path to check
   */
  exists(path: string): Promise<boolean>;
  
  /**
   * Get information about a file or directory
   * @param path Path to the file or directory
   */
  getInfo(path: string): Promise<FileInfo>;
  
  /**
   * List contents of a directory
   * @param path Directory path
   * @param recursive Whether to list subdirectories recursively
   */
  listDirectory(path: string, recursive?: boolean): Promise<FileInfo[]>;
  
  /**
   * Create a directory
   * @param path Directory path
   * @param recursive Create parent directories if they don't exist
   */
  createDirectory(path: string, recursive?: boolean): Promise<void>;
  
  /**
   * Delete a file
   * @param path Path to the file
   */
  deleteFile(path: string): Promise<void>;
  
  /**
   * Delete a directory
   * @param path Path to the directory
   * @param recursive Delete contents recursively
   */
  deleteDirectory(path: string, recursive?: boolean): Promise<void>;
  
  /**
   * Search for files
   * @param basePath Base path to start search from
   * @param options Search options
   */
  searchFiles(basePath: string, options?: FileSearchOptions): Promise<FileSearchResult>;
  
  /**
   * Get the project root directory
   */
  getProjectRoot(): string;
  
  /**
   * Resolve a path relative to the project root
   * @param relativePath Path relative to project root
   */
  resolvePath(relativePath: string): string;
}
