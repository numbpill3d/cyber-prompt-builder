import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ServiceLocatorProvider } from '@/hooks/use-service';
import { ServiceLocator } from '@/core/services/service-locator';

// Create the service locator wrapper
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  serviceLocator?: ServiceLocator;
  route?: string;
}

/**
 * Custom render function that wraps components with necessary providers
 * including ServiceLocatorProvider and BrowserRouter
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    serviceLocator = new ServiceLocator(),
    route = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Set up window.location for the route
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ServiceLocatorProvider serviceLocator={serviceLocator}>
        <BrowserRouter>{children}</BrowserRouter>
      </ServiceLocatorProvider>
    );
  }

  return {
    user: userEvent.setup(),
    serviceLocator,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}

/**
 * Creates a mock function that returns the provided value
 */
export function mockReturnValue<T>(value: T): jest.Mock<any, any, T> {
  return vi.fn().mockReturnValue(value);
}

/**
 * Creates a mock function that resolves to the provided value
 */
export function mockResolvedValue<T>(value: T): jest.Mock<any, any, Promise<T>> {
  return vi.fn().mockResolvedValue(value);
}

/**
 * Creates a mock function that rejects with the provided error
 */
export function mockRejectedValue(error: Error): jest.Mock {
  return vi.fn().mockRejectedValue(error);
}

/**
 * Waits for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock implementation of window.matchMedia for tests
 */
export function mockMatchMedia(matches: boolean = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Creates a partial mock object from a type
 */
export type PartialMock<T> = {
  [P in keyof T]?: T[P] extends (...args: infer A) => infer R 
    ? jest.Mock<R, A> 
    : T[P];
};