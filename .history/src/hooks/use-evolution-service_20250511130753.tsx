import { useService } from './use-service';
import { EvolutionEngine } from '../core/interfaces/evolution-engine';

/**
 * Hook to access the Evolution engine
 * @returns Evolution engine instance and loading state
 */
export function useEvolutionService() {
  const { service, isLoading, error } = useService<EvolutionEngine>('evolutionService');
  
  return {
    evolutionService: service,
    isLoading,
    error
  };
}