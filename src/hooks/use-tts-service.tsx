import { useService } from './use-service';
import { TTSService } from '../core/interfaces/tts-service';

/**
 * Hook to access the TTS service
 * @returns TTS service instance and loading state
 */
export function useTTSService() {
  const { service, isLoading, error } = useService<TTSService>('ttsService');
  
  return {
    ttsService: service,
    isLoading,
    error
  };
}