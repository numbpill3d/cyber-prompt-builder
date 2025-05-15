# Prompt to Code Generation Flow

This document outlines the complete flow from user prompt input to code generation in the Cyber Prompt Builder application.

## Overview

The Cyber Prompt Builder application follows a well-defined path from user input to code generation:

1. **User Input**: User enters a prompt in the PromptInput component
2. **Prompt Processing**: The prompt is processed and enhanced
3. **Provider Selection**: An AI provider is selected based on routing strategy
4. **API Request**: The enhanced prompt is sent to the selected AI provider
5. **Response Processing**: The AI response is processed and formatted
6. **Code Display**: The generated code is displayed to the user

## Detailed Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │     │                 │
│  User Interface │────▶│  Prompt Builder │────▶│  Model Router   │────▶│  AI Provider    │
│                 │     │                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                                                      │
         │                                                                      │
         │                                                                      ▼
┌─────────────────┐                                               ┌─────────────────┐
│                 │                                               │                 │
│  Code Display   │◀───────────────────────────────────────────────│  Response Parser│
│                 │                                               │                 │
└─────────────────┘                                               └─────────────────┘
```

### 1. User Interface (PromptInput Component)

**File**: `frontend/components/PromptInput.tsx`

The user enters their prompt in the PromptInput component, which provides a textarea for input and a "Generate Code" button.

When the user submits the form:
- The `handleSubmit` function is called
- The prompt is validated (not empty and not currently loading)
- The `onGenerate` callback is called with the prompt text

### 2. Prompt Processing (CyberLayout Component)

**File**: `frontend/components/CyberLayout.tsx`

The CyberLayout component contains the `handleGenerateCode` function which:
- Sets loading state
- Stores the prompt for reference
- Gets current settings (provider, model, etc.)
- Calls the `generateCode` function from the AI service

### 3. AI Service (generateCode Function)

**File**: `backend/services/aiService.ts`

The `generateCode` function:
- Creates a task for tracking
- Determines which provider to use (explicit or via router)
- Validates API keys
- Prepares the prompt with context if needed
- Optimizes the prompt for the selected provider
- Sends the request to the provider
- Processes and returns the response

### 4. Model Router (routePrompt Function)

**File**: `backend/services/model-router.ts`

The Model Router determines which AI provider to use based on:
- User-selected provider (from settings)
- Prompt complexity
- Cost optimization
- Performance optimization
- Language-specific preferences
- Context length requirements

Routing strategies include:
- `user-selected`: Uses the provider selected in settings
- `cost-optimized`: Selects the most cost-effective provider
- `performance-optimized`: Selects the provider with best performance for the task
- `balanced`: Balances cost and performance
- `auto`: Automatically selects the best strategy based on prompt analysis

### 5. Provider Integration

**Files**: 
- `backend/core/providers/openai-provider.ts`
- `backend/core/providers/claude-provider.ts`
- `backend/core/providers/gemini-provider.ts`

Each provider has a specific implementation that:
- Formats the prompt according to the provider's requirements
- Sends the API request with the appropriate parameters
- Processes the response
- Handles errors and retries if needed

### 6. Response Processing

**File**: `backend/services/response-handler.ts`

The response handler:
- Parses the raw response from the AI provider
- Extracts code blocks and explanations
- Formats the response for display
- Adds metadata (provider, model, tokens, cost, etc.)

### 7. Code Display (CodeEditor Component)

**File**: `frontend/components/CodeEditor.tsx`

The CodeEditor component:
- Displays the generated code with syntax highlighting
- Allows the user to edit the code
- Provides copy functionality

## Environment Variables and Configuration

The application uses environment variables for configuration:

- API keys for different providers
- Default provider selection
- Agent settings (iterations, task breakdown, etc.)
- Prompt builder settings (tokens, temperature)

These are loaded from:
1. `.env` files
2. Render environment variables (in production)
3. User settings (stored in the application)

## Deployment Flow

When deployed on Render:

1. The application is built using `npm run build`
2. The Express server (`server.js`) serves the static files
3. Environment variables are loaded from Render configuration
4. API requests are made directly from the client to the AI providers

## Error Handling

The application includes comprehensive error handling:
- API key validation
- Provider availability checks
- Request/response error handling
- Fallback mechanisms when a provider fails

## Extending with New Providers

To add a new AI provider:
1. Create a new provider implementation in `backend/core/providers/`
2. Add the provider to the available providers list
3. Update the model router with provider-specific optimizations
4. Add provider settings to the settings manager

## Testing the Flow

You can test the complete flow by:
1. Setting up API keys in the settings
2. Entering a prompt in the PromptInput component
3. Clicking "Generate Code"
4. Observing the generated code in the CodeEditor
