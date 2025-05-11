# Testing Strategy

This document outlines the comprehensive testing approach for our refactored architecture, covering unit tests, service tests, provider tests, UI component tests, and integration tests.

## Overview

Our testing architecture uses Vitest as the test runner with React Testing Library for component tests. We've implemented a robust mocking system that allows us to test components and services in isolation while maintaining type safety.

## Running Tests

Tests can be run using the following npm scripts:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage reporting
npm run test:coverage
```

## Test Structure

### Unit Tests

Unit tests verify that individual units of code work as expected. These focus on testing a specific function, method, or small component in isolation.

Example: `src/services/memory/memory-service.test.ts`

### Service Tests

Service tests verify that our core services function correctly, with dependencies properly mocked.

Example: `src/services/memory/memory-service.test.ts`

### Provider Tests

Provider tests ensure that our API provider integrations work correctly, with external APIs mocked using MSW.

Example: `src/core/providers/claude-provider.test.ts`

### UI Component Tests

UI Component tests verify that our React components render correctly and respond appropriately to user interactions.

Example: `src/components/CodeBlock.test.ts`

### Integration Tests

Integration tests verify that multiple components and services work together correctly.

Example: `src/core/services/model-router.test.ts`

## Test Utilities

### Mock Services

We provide mock implementations of all services in `src/test/mocks/service-mocks.ts`. These mocks implement the same interfaces as the real services but use vi.fn() to create mockable functions.

```typescript
// Example usage
import { createMockMemoryEngine } from '@/test/mocks/service-mocks';

const mockMemoryEngine = createMockMemoryEngine();
vi.mocked(mockMemoryEngine.searchMemories).mockResolvedValue([/* mock memories */]);
```

### Testing Utilities

We provide utilities for common testing patterns in `src/test/utils/test-utils.tsx`:

```typescript
// Render a component with all providers
const { user, serviceLocator } = renderWithProviders(<MyComponent />);

// Create mock functions
const mockFn = mockReturnValue('mock value');
const mockAsyncFn = mockResolvedValue({ data: 'mock data' });
const mockErrorFn = mockRejectedValue(new Error('mock error'));
```

### API Mocking

We use MSW (Mock Service Worker) to intercept and mock API requests. Mock handlers are defined in `src/test/mocks/handlers.ts`.

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on the state from previous tests.

2. **Arrange-Act-Assert**: Structure tests with clear sections for setup, action, and verification.

3. **Mock Dependencies**: Use the provided mock utilities to isolate the unit under test.

4. **Test Edge Cases**: Include tests for error conditions, empty states, and boundary conditions.

5. **Meaningful Assertions**: Make assertions that verify behavior, not implementation details.

6. **Prefer Function Mocks**: Use vi.fn() and vi.mock() rather than implementing complex mock objects.

7. **Keep Tests Simple**: Tests should be straightforward to understand and maintain.

## Coverage Goals

We aim for the following coverage targets:

- **Branches**: 70%
- **Functions**: 80% 
- **Lines**: 80%
- **Statements**: 80%

Focus coverage on critical paths and complex logic rather than simple property access or straightforward rendering.

## Examples

### Unit Test Example

```typescript
describe('storeMemory', () => {
  it('should store a memory using the provider', async () => {
    // Arrange
    const memory = { id: '123', content: 'Test memory' };

    // Act
    await memoryService.storeMemory(memory);

    // Assert
    expect(mockProvider.storeMemory).toHaveBeenCalledWith(memory);
  });
});
```

### Component Test Example

```typescript
it('shows copy button and copies text when clicked', async () => {
  // Arrange
  render(<CodeBlock code="test code" language="js" />);
  
  // Act
  const copyButton = screen.getByRole('button', { name: /copy code/i });
  fireEvent.click(copyButton);
  
  // Assert
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test code');
  expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument();
});
```

### Integration Test Example

```typescript
it('routes message to the correct provider based on configuration', async () => {
  // Arrange
  modelRouter.setActiveProvider('Claude');
  
  // Act
  const result = await modelRouter.sendMessage('Test message');
  
  // Assert
  expect(mockClaudeProvider.sendMessage).toHaveBeenCalled();
  expect(mockOpenAIProvider.sendMessage).not.toHaveBeenCalled();
});