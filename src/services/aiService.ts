
import { openAIService, GenerateCodeRequest } from './openai';

interface AIServiceRequest {
  prompt: string;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AIServiceResponse {
  code: string;
  error?: string;
  taskId?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ExportOptions {
  format: 'file' | 'zip' | 'github';
  fileName?: string;
  includeMetadata?: boolean;
}

interface DeployOptions {
  target: 'local' | 'vercel' | 'netlify' | 'github';
  projectName?: string;
}

// Mock settings manager for now
const mockSettingsManager = {
  getSettings() {
    return {
      activeProvider: 'openai',
      providers: {
        openai: {
          preferredModel: 'gpt-4',
          apiKey: localStorage.getItem('openai_api_key') || ''
        }
      }
    };
  }
};

export function getSettingsManager() {
  return mockSettingsManager;
}

export async function generateCode(request: AIServiceRequest): Promise<AIServiceResponse> {
  const settings = mockSettingsManager.getSettings();
  const apiKey = settings.providers.openai.apiKey;

  if (!apiKey) {
    return {
      code: '',
      error: 'OpenAI API key not configured. Please add your API key in settings.'
    };
  }

  const openAIRequest: GenerateCodeRequest = {
    prompt: request.prompt,
    apiKey,
    model: request.model || settings.providers.openai.preferredModel,
    temperature: request.temperature || 0.7,
    maxTokens: request.maxTokens || 4000
  };

  const result = await openAIService.generateCode(openAIRequest);
  
  return {
    code: result.code,
    error: result.error,
    taskId: `task_${Date.now()}`,
    usage: result.usage
  };
}

export async function exportCode(code: string, options: ExportOptions): Promise<boolean> {
  try {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.fileName || `generated-code-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
}

export async function deployCode(code: string, options: DeployOptions): Promise<boolean> {
  // For now, just create a downloadable project structure
  try {
    const projectStructure = {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.projectName || 'Generated Project'}</title>
</head>
<body>
    <div id="app"></div>
    <script>
        ${code}
    </script>
</body>
</html>`,
      'README.md': `# ${options.projectName || 'Generated Project'}

This project was generated using Cyber Prompt Builder.

## Setup
1. Open index.html in your browser
2. Or serve with a local server for best results

Generated on: ${new Date().toISOString()}
`
    };

    // Create a simple zip-like structure as text files
    for (const [filename, content] of Object.entries(projectStructure)) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return true;
  } catch (error) {
    console.error('Deploy failed:', error);
    return false;
  }
}
