/**
 * File System Service Implementation
 * Provides secure file operations for the application
 * Note: This is a browser-compatible mock implementation
 */

import { FileSystemService, FileInfo, FileSearchOptions, FileWriteOptions, FileReadOptions, FileSearchResult } from '../../core/interfaces/file-system';
import { Logger } from '../logging/logger';

// Initialize logger
const logger = new Logger('FileSystemService');

/**
 * Implementation of the FileSystemService interface
 */
export class FileSystemServiceImpl implements FileSystemService {
  private projectRoot: string;
  private initialized: boolean = false;
  private mockFiles: Map<string, { content: string; lastModified: Date }> = new Map();

  constructor(projectRoot?: string) {
    // Default to workspace directory for browser environment
    this.projectRoot = projectRoot || '/workspace';
    logger.info(`File system service created with root: ${this.projectRoot} (browser mode)`);
  }

  /**
   * Initialize the file system service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize with some mock files for demonstration
      this.mockFiles.set('/workspace/README.md', {
        content: '# Cyber Prompt Builder\n\nA modular AI prompt building system.',
        lastModified: new Date()
      });
      
      this.initialized = true;
      logger.info('File system service initialized successfully (browser mode)');
    } catch (error) {
      logger.error('Failed to initialize file system service', error);
      throw error;
    }
  }

  /**
   * Read a file's content
   */
  async readFile(filePath: string, options?: FileReadOptions): Promise<string> {
    this.ensureInitialized();
    const fullPath = this.resolvePath(filePath);
    this.validatePath(fullPath);

    try {
      const encoding = options?.encoding || 'utf8';
      const content = await fs.promises.readFile(fullPath, { encoding: encoding as BufferEncoding });
      logger.debug(`Read file: ${filePath}`);
      return content;
    } catch (error) {
      logger.error(`Failed to read file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Write content to a file
   */
  async writeFile(filePath: string, content: string, options?: FileWriteOptions): Promise<void> {
    this.ensureInitialized();
    const fullPath = this.resolvePath(filePath);
    this.validatePath(fullPath);

    try {
      const dirPath = path.dirname(fullPath);
      
      // Create directories if needed
      if (options?.createDirectories) {
        await fs.promises.mkdir(dirPath, { recursive: true });
      }

      // Check if file exists and overwrite is not allowed
      if (!options?.overwrite) {
        const exists = await this.exists(filePath);
        if (exists) {
          throw new Error(`File already exists and overwrite is not allowed: ${filePath}`);
        }
      }

      const encoding = options?.encoding || 'utf8';
      await fs.promises.writeFile(fullPath, content, { encoding: encoding as BufferEncoding });
      logger.debug(`Wrote file: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to write file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Check if a file or directory exists
   */
  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(filePath);
    
    try {
      await fs.promises.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get information about a file or directory
   */
  async getInfo(filePath: string): Promise<FileInfo> {
    this.ensureInitialized();
    const fullPath = this.resolvePath(filePath);
    this.validatePath(fullPath);

    try {
      const stats = await fs.promises.stat(fullPath);
      const isDirectory = stats.isDirectory();
      const parsedPath = path.parse(fullPath);
      
      const fileInfo: FileInfo = {
        name: parsedPath.base,
        path: filePath,
        isDirectory,
        size: stats.size,
        lastModified: stats.mtime
      };

      if (!isDirectory) {
        fileInfo.extension = parsedPath.ext.slice(1); // Remove the leading dot
      }

      return fileInfo;
    } catch (error) {
      logger.error(`Failed to get info for: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * List contents of a directory
   */
  async listDirectory(dirPath: string, recursive: boolean = false): Promise<FileInfo[]> {
    this.ensureInitialized();
    const fullPath = this.resolvePath(dirPath);
    this.validatePath(fullPath);

    try {
      const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
      let results: FileInfo[] = [];

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        const info = await this.getInfo(entryPath);
        results.push(info);

        if (recursive && entry.isDirectory()) {
          const subEntries = await this.listDirectory(entryPath, true);
          results = results.concat(subEntries);
        }
      }

      return results;
    } catch (error) {
      logger.error(`Failed to list directory: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(dirPath: string, recursive: boolean = false): Promise<void> {
    this.ensureInitialized();
    const fullPath = this.resolvePath(dirPath);
    this.validatePath(fullPath);

    try {
      await fs.promises.mkdir(fullPath, { recursive });
      logger.debug(`Created directory: ${dirPath}`);
    } catch (error) {
      logger.error(`Failed to create directory: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    this.ensureInitialized();
    const fullPath = this.resolvePath(filePath);
    this.validatePath(fullPath);

    try {
      const info = await this.getInfo(filePath);
      if (info.isDirectory) {
        throw new Error(`Cannot delete directory using deleteFile: ${filePath}`);
      }

      await fs.promises.unlink(fullPath);
      logger.debug(`Deleted file: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to delete file: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Delete a directory
   */
  async deleteDirectory(dirPath: string, recursive: boolean = false): Promise<void> {
    this.ensureInitialized();
    const fullPath = this.resolvePath(dirPath);
    this.validatePath(fullPath);

    try {
      if (recursive) {
        await fs.promises.rm(fullPath, { recursive, force: true });
      } else {
        await fs.promises.rmdir(fullPath);
      }
      logger.debug(`Deleted directory: ${dirPath}`);
    } catch (error) {
      logger.error(`Failed to delete directory: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * Search for files
   */
  async searchFiles(basePath: string, options: FileSearchOptions = {}): Promise<FileSearchResult> {
    this.ensureInitialized();
    const fullBasePath = this.resolvePath(basePath);
    this.validatePath(fullBasePath);

    const defaultOptions: FileSearchOptions = {
      recursive: true,
      includeContent: false,
      maxResults: 100
    };

    const searchOptions = { ...defaultOptions, ...options };
    const results: FileInfo[] = [];
    let totalFound = 0;

    try {
      await this.searchFilesRecursive(
        basePath,
        searchOptions,
        results,
        totalFound
      );

      return {
        files: results,
        totalFound,
        searchOptions
      };
    } catch (error) {
      logger.error(`Failed to search files in: ${basePath}`, error);
      throw error;
    }
  }

  /**
   * Get the project root directory
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }

  /**
   * Resolve a path relative to the project root
   */
  resolvePath(relativePath: string): string {
    // If the path is already absolute, return it
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    
    // Otherwise, resolve it relative to the project root
    return path.resolve(this.projectRoot, relativePath);
  }

  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('File system service is not initialized');
    }
  }

  /**
   * Validate a path is within the project root
   */
  private validatePath(fullPath: string): void {
    const normalizedPath = path.normalize(fullPath);
    const normalizedRoot = path.normalize(this.projectRoot);

    if (!normalizedPath.startsWith(normalizedRoot)) {
      throw new Error(`Path is outside of project root: ${fullPath}`);
    }
  }

  /**
   * Recursive helper for searching files
   */
  private async searchFilesRecursive(
    currentPath: string,
    options: FileSearchOptions,
    results: FileInfo[],
    totalFound: number
  ): Promise<void> {
    // Stop if we've reached the maximum results
    if (options.maxResults && results.length >= options.maxResults) {
      return;
    }

    const entries = await this.listDirectory(currentPath, false);

    for (const entry of entries) {
      // Check if we've reached the maximum results
      if (options.maxResults && results.length >= options.maxResults) {
        break;
      }

      // Skip directories if not recursive
      if (entry.isDirectory) {
        if (options.recursive) {
          await this.searchFilesRecursive(
            entry.path,
            options,
            results,
            totalFound
          );
        }
        continue;
      }

      // Check file type filter
      if (options.fileTypes && options.fileTypes.length > 0) {
        if (!entry.extension || !options.fileTypes.includes(entry.extension)) {
          continue;
        }
      }

      // Check search pattern
      if (options.searchPattern) {
        const pattern = typeof options.searchPattern === 'string'
          ? new RegExp(options.searchPattern)
          : options.searchPattern;

        // Check filename
        if (!pattern.test(entry.name)) {
          // If not matching filename and we need to check content
          if (options.includeContent) {
            const content = await this.readFile(entry.path);
            if (!pattern.test(content)) {
              continue;
            }
            // Add content to the entry if it matches
            entry.content = content;
          } else {
            continue;
          }
        }
      } else if (options.includeContent) {
        // If no pattern but includeContent is true, read the content
        entry.content = await this.readFile(entry.path);
      }

      // Add to results
      totalFound++;
      results.push(entry);
    }
  }
}

// Export a singleton instance
export const fileSystemService = new FileSystemServiceImpl();
