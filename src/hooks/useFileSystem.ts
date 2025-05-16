import { useState, useEffect, useCallback } from 'react';
import { FileInfo, FileSearchOptions, FileWriteOptions, FileReadOptions } from '../core/interfaces/file-system';
import { getService } from '../core/services/service-locator';
import { FileSystemService } from '../core/interfaces/file-system';
import { toast } from '../components/ui/sonner';

/**
 * Hook for using the file system service
 */
export const useFileSystem = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fileSystemService, setFileSystemService] = useState<FileSystemService | null>(null);

  // Initialize the file system service
  useEffect(() => {
    try {
      const service = getService<FileSystemService>('fileSystemService');
      setFileSystemService(service);
    } catch (err) {
      console.error('Failed to get file system service:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to initialize file system service');
    }
  }, []);

  /**
   * Read a file's content
   */
  const readFile = useCallback(async (path: string, options?: FileReadOptions) => {
    if (!fileSystemService) {
      throw new Error('File system service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await fileSystemService.readFile(path, options);
      return content;
    } catch (err) {
      console.error(`Failed to read file: ${path}`, err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fileSystemService]);

  /**
   * Write content to a file
   */
  const writeFile = useCallback(async (path: string, content: string, options?: FileWriteOptions) => {
    if (!fileSystemService) {
      throw new Error('File system service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      await fileSystemService.writeFile(path, content, options);
    } catch (err) {
      console.error(`Failed to write file: ${path}`, err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fileSystemService]);

  /**
   * List contents of a directory
   */
  const listDirectory = useCallback(async (path: string, recursive?: boolean) => {
    if (!fileSystemService) {
      throw new Error('File system service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const files = await fileSystemService.listDirectory(path, recursive);
      return files;
    } catch (err) {
      console.error(`Failed to list directory: ${path}`, err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fileSystemService]);

  /**
   * Search for files
   */
  const searchFiles = useCallback(async (basePath: string, options?: FileSearchOptions) => {
    if (!fileSystemService) {
      throw new Error('File system service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fileSystemService.searchFiles(basePath, options);
      return result;
    } catch (err) {
      console.error(`Failed to search files in: ${basePath}`, err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fileSystemService]);

  /**
   * Create a directory
   */
  const createDirectory = useCallback(async (path: string, recursive?: boolean) => {
    if (!fileSystemService) {
      throw new Error('File system service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      await fileSystemService.createDirectory(path, recursive);
    } catch (err) {
      console.error(`Failed to create directory: ${path}`, err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fileSystemService]);

  /**
   * Delete a file
   */
  const deleteFile = useCallback(async (path: string) => {
    if (!fileSystemService) {
      throw new Error('File system service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      await fileSystemService.deleteFile(path);
    } catch (err) {
      console.error(`Failed to delete file: ${path}`, err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fileSystemService]);

  /**
   * Delete a directory
   */
  const deleteDirectory = useCallback(async (path: string, recursive?: boolean) => {
    if (!fileSystemService) {
      throw new Error('File system service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      await fileSystemService.deleteDirectory(path, recursive);
    } catch (err) {
      console.error(`Failed to delete directory: ${path}`, err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fileSystemService]);

  return {
    isLoading,
    error,
    readFile,
    writeFile,
    listDirectory,
    searchFiles,
    createDirectory,
    deleteFile,
    deleteDirectory,
    getProjectRoot: fileSystemService?.getProjectRoot.bind(fileSystemService),
    resolvePath: fileSystemService?.resolvePath.bind(fileSystemService),
    exists: fileSystemService?.exists.bind(fileSystemService),
    getInfo: fileSystemService?.getInfo.bind(fileSystemService),
  };
};

export default useFileSystem;
