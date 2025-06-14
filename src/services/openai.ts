
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GenerateCodeRequest {
  prompt: string;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateCodeResponse {
  code: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private baseURL = 'https://api.openai.com/v1';

  async generateCode({
    prompt,
    apiKey,
    model = 'gpt-4',
    temperature = 0.7,
    maxTokens = 4000
  }: GenerateCodeRequest): Promise<GenerateCodeResponse> {
    try {
      const messages: OpenAIMessage[] = [
        {
          role: 'system',
          content: 'You are an expert programmer. Generate clean, well-commented code based on the user\'s request. Only return the code, no explanations unless specifically asked.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data: OpenAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI');
      }

      let generatedCode = data.choices[0].message.content;

      // Extract code from markdown blocks if present
      const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
      const matches = [...generatedCode.matchAll(codeBlockRegex)];
      
      if (matches.length > 0) {
        generatedCode = matches.map(match => match[1]).join('\n\n');
      }

      return {
        code: generatedCode,
        usage: data.usage
      };

    } catch (error) {
      console.error('OpenAI API Error:', error);
      return {
        code: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async *generateCodeStream({
    prompt,
    apiKey,
    model = 'gpt-4',
    temperature = 0.7,
    maxTokens = 4000
  }: GenerateCodeRequest): AsyncGenerator<string, void, unknown> {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are an expert programmer. Generate clean, well-commented code based on the user\'s request. Only return the code, no explanations unless specifically asked.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const openAIService = new OpenAIService();
