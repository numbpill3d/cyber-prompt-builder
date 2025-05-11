import { useService } from './use-service';
import { MemoryService } from '../core/interfaces/memory-engine';

/**
 * Hook to access the memory service
 * @returns Memory service instance and loading state
 */
export function useMemoryService() {
  const { service, isLoading, error } = useService<MemoryService>('memoryService');
  
  return {
    memoryService: service,
    isLoading,
    error
  };
}