import { http, HttpResponse } from 'msw';

// Mock API response data
const mockClaudeCompletion = {
  id: 'mock-claude-response-id',
  model: 'claude-3-opus-20240229',
  content: [
    {
      type: 'text',
      text: 'This is a mock Claude response for testing purposes.'
    }
  ]
};

const mockOpenAICompletion = {
  id: 'mock-openai-response-id',
  model: 'gpt-4-turbo',
  choices: [
    {
      message: {
        role: 'assistant',
        content: 'This is a mock OpenAI response for testing purposes.'
      },
      finish_reason: 'stop',
      index: 0
    }
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30
  }
};

const mockGeminiCompletion = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: 'This is a mock Gemini response for testing purposes.'
          }
        ]
      },
      finishReason: 'STOP',
      index: 0,
      safetyRatings: []
    }
  ],
  promptFeedback: {
    safetyRatings: []
  }
};

// Handler definitions for different API endpoints
export const handlers = [
  // Claude API
  http.post('https://api.anthropic.com/v1/messages', () => {
    return HttpResponse.json(mockClaudeCompletion);
  }),

  // OpenAI API
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json(mockOpenAICompletion);
  }),

  // Gemini API
  http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', () => {
    return HttpResponse.json(mockGeminiCompletion);
  }),

  // Add other API endpoints as needed
];