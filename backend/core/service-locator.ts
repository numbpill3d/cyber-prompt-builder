
/**
 * Service Locator
 * Simple service locator pattern implementation for managing dependencies
 */

// Store for registered services
const services: Record<string, unknown> = {};

/**
 * Register a service instance with the service locator
 * @param name Unique identifier for the service
 * @param service Service instance
 */
export function registerService(name: string, service: unknown): void {
  if (services[name]) {
    console.warn(`Service '${name}' is being overwritten.`);
  }
  
  services[name] = service;
}

/**
 * Get a service instance by name
 * @param name The name of the service to retrieve
 * @returns The service instance
 * @throws Error if service is not registered
 */
export function getService<T>(name: string): T {
  if (!services[name]) {
    throw new Error(`Service '${name}' not found in service locator.`);
  }
  
  return services[name] as T;
}

/**
 * Check if a service is registered
 * @param name The name of the service to check
 * @returns True if service is registered, false otherwise
 */
export function hasService(name: string): boolean {
  return !!services[name];
}

/**
 * Remove a service from the registry
 * @param name The name of the service to remove
 * @returns True if service was removed, false if it wasn't registered
 */
export function removeService(name: string): boolean {
  if (!services[name]) {
    return false;
  }
  
  delete services[name];
  return true;
}

/**
 * Get all registered service names
 * @returns Array of service names
 */
export function getRegisteredServices(): string[] {
  return Object.keys(services);
}

/**
 * Clear all registered services
 * Useful for testing and hot reloading
 */
export function clearServices(): void {
  Object.keys(services).forEach(key => {
    delete services[key];
  });
}

/**
 * Service Locator Class for dependency injection
 */
export class ServiceLocator {
  private services: Map<string, unknown> = new Map();

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found`);
    }
    return service as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  clear(): void {
    this.services.clear();
  }
}
