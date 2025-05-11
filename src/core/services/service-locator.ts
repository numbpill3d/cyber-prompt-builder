/**
 * Service Locator
 * Simple service locator pattern implementation for managing dependencies
 */

// Store for registered services
const services: Record<string, any> = {};

/**
 * Register a service instance with the service locator
 * @param name Unique identifier for the service
 * @param service Service instance
 */
export function registerService(name: string, service: any): void {
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