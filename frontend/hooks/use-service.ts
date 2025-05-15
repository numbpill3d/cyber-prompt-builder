import { useEffect, useState } from 'react';
import { getService, hasService } from '@/core/services/service-locator';

/**
 * Generic hook for accessing services from the service locator
 * @param serviceName The name of the service to retrieve
 * @returns The service instance and loading state
 */
export function useService<T>(serviceName: string): {
  service: T | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [service, setService] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!hasService(serviceName)) {
      setIsLoading(false);
      setError(new Error(`Service '${serviceName}' not found in service locator.`));
      return;
    }

    try {
      const serviceInstance = getService<T>(serviceName);
      setService(serviceInstance);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error accessing service'));
    } finally {
      setIsLoading(false);
    }
  }, [serviceName]);

  return { service, isLoading, error };
}