# AI Coding Assistant Architecture

This document outlines the complete backend architecture for an AI coding assistant tool that accepts natural language prompts and returns structured code, with support for multiple AI providers, agentic features, and deployment functionality.

## Architecture Overview

```ascii
+------------------------------------------+
|                Frontend UI               |
+----------------+-------------------------+
                 |
                 v
+----------------+-------------------------+
|             API Gateway                  |
+----------------+-------------------------+
                 |
       +---------+---------+
       |                   |
       v                   v
+---------------+    +---------------+
| Auth Service  |    |  Model Router |
+---------------+    +---------------+
                           |
         +----------------+----------------+
         |                |                |
         v                v                v
+----------------+ +---------------+ +----------------+
| Claude Provider| | OpenAI Prov.  | | Gemini Prov.   |
+----------------+ +---------------+ +----------------+
         |                |                |
         v                v                v
+----------------+ +---------------+ +----------------+
| Claude API     | | OpenAI API    | | Gemini API     |
+----------------+ +---------------+ +----------------+
         |                |                |
         +----------------+----------------+
                          |
                          v
+------------------------------------------+
|              Task Manager                |
+------------------------------------------+
                  |
      +-----------+-----------+
      |           |           |
      v           v           v
+-----------+ +----------+ +-----------+
|Task Break.| |Iteration | |Context Mem.|
+-----------+ +----------+ +-----------+
                  |
                  v
+------------------------------------------+
|              Code Output                 |
+------------------------------------------+
                  |
                  v
+------------------------------------------+
|        Export/Deploy Manager             |
+------------------------------------------+
```

## Core Components

### 1. Provider Abstraction Layer

The provider abstraction layer defines a common interface that all AI providers must implement, allowing for consistent interaction regardless of the underlying API.

Key files:
- `src/services/providers/index.ts` - Defines the common interfaces
- `src/services/providers/claude.ts` - Anthropic Claude implementation
- `src/services/providers/openai.ts` - OpenAI GPT implementation
- `src/services/providers/gemini.ts` - Google Gemini implementation
- `src/services/providers/providers.ts` - Factory and provider management

### 2. Model Router

The model router determines which AI provider to use based on user selection or automatic routing criteria.

Key files:
- `src/services/model-router.ts` - Implements routing strategies

Routing strategies:
- `user-selected` - Use the provider selected by the user
- `cost-optimized` - Choose the most cost-effective provider
- `performance-optimized` - Choose the most accurate provider
- `balanced` - Balance cost and performance based on prompt complexity

### 3. Task Manager

The task manager handles the agentic features, including task breakdown, iteration, and context memory.

Key files:
- `src/services/agent/task-manager.ts` - Task management and agentic features

Features:
- Task Breakdown: Splits complex tasks into smaller steps
- Iteration: Refines code through multiple iterations
- Context Memory: Maintains context from previous interactions

### 4. Settings Manager

The settings manager handles user preferences and API key storage.

Key files:
- `src/services/settings-manager.ts` - Settings storage and management

Settings include:
- API keys for each provider
- Preferred model for each provider
- Active provider selection
- Agentic feature toggles

### 5. Export/Deploy Manager

The export/deploy manager handles code export and deployment.

Key files:
- `src/services/export-manager.ts` - Export and deployment functionality

Features:
- Export formats: file, zip, gist
- Deploy targets: local, github-pages, netlify

### 6. AI Service

The AI service integrates all the components into a cohesive API for generating code.

Key files:
- `src/services/aiService.ts` - Main service API

## Data Flow

1. User enters a natural language prompt in the UI
2. UI sends the prompt to the AI Service
3. AI Service authenticates the request
4. Model Router determines which provider to use
5. Task Manager creates a task and breaks it down if enabled
6. Selected AI Provider generates code
7. Task Manager processes the code through iterations if enabled
8. AI Service returns the final code to the UI
9. UI displays the code to the user
10. Export/Deploy Manager handles export or deployment if requested

## Authentication

Simple API key authentication is used for accessing the AI providers. API keys are stored in the Settings Manager and provided to the appropriate provider when making API requests.

## State Management

- React Context for UI state
- Settings Manager for persistent user preferences
- Task Manager for task state during code generation

## Extension Points

The architecture is designed to be extensible in several ways:

1. New AI Providers: Implement the `AIProvider` interface
2. New Routing Strategies: Add to the Model Router
3. New Export Formats: Add to the Export Manager
4. New Deploy Targets: Add to the Export Manager

## Implementation Notes

- TypeScript is used throughout for type safety
- React for the frontend UI
- Local Storage for simple persistence
- Modular design for easy extension and maintenance

## Future Enhancements

- Database integration for persistent storage
- User authentication and multi-user support
- Collaborative features
- More sophisticated agentic features
- Advanced code analysis and optimization
- Integration with IDEs and code editors