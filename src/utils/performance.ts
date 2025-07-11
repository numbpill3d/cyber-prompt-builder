/**
 * Performance Utilities
 * Utilities for optimizing application performance
 */

import React from 'react';

/**
 * Lazy load a component with error boundary
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  name: string
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem(`retry-lazy-refreshed-${name}`) || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem(`retry-lazy-refreshed-${name}`, 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem(`retry-lazy-refreshed-${name}`, 'true');
        return window.location.reload();
      }
      throw error;
    }
  });
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Measure performance of a function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await fn();
    const end = performance.now();
    
    console.log(`Performance: ${name} took ${(end - start).toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`Performance: ${name} failed after ${(end - start).toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Get memory usage information
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    };
  }
  return null;
}