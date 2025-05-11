# PromptBuilder Architecture

The PromptBuilder is a modular system for composing structured AI prompts through layered components. It enables precise control over prompt construction across different AI providers while maintaining a clean separation of concerns.

## Core Concepts

### Prompt Layers

The system uses a layered architecture where each layer represents a different aspect of the prompt:

- **System Prompt Layer** (`SystemPromptLayer`): Defines the AI's core capabilities, personality, and constraints.
- **Task Instruction Layer** (`TaskInstructionLayer`): Contains specific instructions and examples for the current task.
- **Memory Layer** (`MemoryLayer`): Provides context from previous interactions and relevant information.
- **User Preferences Layer** (`UserPreferencesLayer`): Customizes response format, tone, and style.

Each layer has its own priority level which determines its importance during composition.

### Composition Process

The prompt building process follows these steps:

1. Create and configure individual layers
2. Assign priorities to each layer (CRITICAL, HIGH, MEDIUM, LOW)
3. Compose the final prompt based on layer priorities
4. Apply optional filters to create context-specific prompts
5. Feed the composed prompt to AI providers

### Key Components

- `PromptBuilder`: Central service that manages layers and composition
- `PromptLayer`: Interface for all layer types
- `MutablePromptLayer`: Interface for layers that support dynamic updates
- `CompositionStrategy`: Strategy pattern for different composition approaches
- `LayerFilter`: Filter pattern for selective layer inclusion

## Usage Patterns

### Basic Usage

```typescript
import { builder, createSystemPrompt, createTaskInstruction } from './services/prompt-builder';

// Create system prompt
const systemId = createSystemPrompt('You are an expert TypeScript developer.');

// Create task instruction
const taskId = createTaskInstruction('Create a utility function that formats dates.');

// Compose the prompt
const prompt = builder.compose();
```

### Advanced Layer Configuration

```typescript
// Create a task layer with examples
const taskId = createTaskInstruction('Convert strings to camelCase');
const taskLayer = builder.getLayer(taskId);
if (taskLayer && 'addExample' in taskLayer) {
  (taskLayer as TaskInstructionLayer).addExample('Input: "hello world" → Output: "helloWorld"');
  (taskLayer as TaskInstructionLayer).addExample('Input: "user-profile-data" → Output: "userProfileData"');
}

// Create a system layer with constraints
const systemId = createSystemPrompt();
const systemLayer = builder.getLayer(systemId);
if (systemLayer && systemLayer instanceof SystemPromptLayer) {
  systemLayer.addCapability('Write clean, efficient TypeScript code');
  systemLayer.addConstraint('Generate any code that could cause security vulnerabilities');
}
```

### Memory and Context

```typescript
// Add code context from the project
const memoryId = createMemoryLayer();
const memoryLayer = builder.getLayer(memoryId);
if (memoryLayer && 'addEntry' in memoryLayer) {
  (memoryLayer as MemoryLayer).addEntry({
    type: MemoryEntryType.CODE,
    content: 'function existingHelper() { /* ... */ }',
    source: 'project_code',
    timestamp: new Date()
  });
}
```

### Filtered Prompts

```typescript
// Create a filter for only system and task layers
const filter = new SimpleLayerFilter(layer => 
  layer.type === 'system' || layer.type === 'task'
);

// Compose with the filter
const filteredPrompt = builder.compose(filter);
```

### Complete Prompt Configuration

```typescript
const prompt = createCompletePrompt({
  systemPrompt: 'You are an expert developer',
  systemPreset: 'CODING',
  taskInstruction: 'Implement a date formatting function',
  userPreferences: {
    tone: ResponseTone.TECHNICAL,
    format: ResponseFormat.CODE_FOCUSED,
    includeExplanations: true
  },
  memoryEntries: [
    {
      type: MemoryEntryType.CODE,
      content: '// Existing project code...',
      source: 'project'
    }
  ]
});
```

## Integration with AI Providers

The PromptBuilder can be integrated with any AI provider:

```typescript
// Create a prompt with the builder
const composedPrompt = builder.compose();

// Send to an AI provider
const aiResult = await aiService.generateWithProvider(
  'openai', 
  { content: composedPrompt.text }
);
```

## Best Practices

### 1. Layer Prioritization

Define clear priorities for layers based on their importance:
- System prompts should usually have HIGH priority
- Task instructions with MEDIUM or HIGH priority
- Contextual information with MEDIUM priority
- Preferences with LOW or MEDIUM priority

### 2. Layer Content

- **System prompts**: Keep concise but clear about capabilities
- **Task instructions**: Be specific and include examples
- **Memory entries**: Include only relevant context
- **User preferences**: Define response format clearly

### 3. Token Management

- Monitor token usage with `tokenEstimate` property
- Use filters for different contexts to manage token limits
- Consider layer priority when token limits are reached

### 4. Debugging

Enable debug mode to inspect composition:
```typescript
builder.setDebugMode(true);
console.log(builder.debugPreview());
```

### 5. Provider-Specific Optimization

- Create provider-specific filters or formatters for different AI models
- Use token estimators tailored to specific providers
- Consider model-specific prompt engineering techniques