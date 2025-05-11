/**
 * Response Handler Service
 * Processes raw AI responses into structured format for the frontend
 */

import { AIResponse } from './providers/index';

// Language tags supported by the system
export type SupportedLanguage = 
  'html' | 'css' | 'js' | 'javascript' | 'typescript' | 'ts' | 
  'python' | 'py' | 'java' | 'c' | 'cpp' | 'c#' | 'csharp' | 
  'go' | 'rust' | 'ruby' | 'php' | 'swift' | 'kotlin' | 'shell' | 
  'bash' | 'sql' | 'json' | 'yaml' | 'markdown' | 'md';

// Normalized language mapping
const languageNormalization: Record<string, string> = {
  'javascript': 'js',
  'typescript': 'ts',
  'python': 'py',
  'py': 'python',
  'csharp': 'c#',
  'shell': 'bash',
  'md': 'markdown'
};

// Metadata about the response
export interface ResponseMeta {
  model: string;
  provider: string;
  cost: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  timestamp: number;
  duration: number;
}

// Structured response format
export interface StructuredResponse {
  codeBlocks: Record<string, string>;
  explanation?: string;
  meta: ResponseMeta;
  rawResponse?: string;
}

/**
 * Parse an AI response to extract code blocks and explanations
 */
export const parseResponse = (
  response: AIResponse, 
  meta: Partial<ResponseMeta>
): StructuredResponse => {
  const result: StructuredResponse = {
    codeBlocks: {},
    meta: {
      model: meta.model || 'unknown',
      provider: meta.provider || 'unknown',
      cost: meta.cost || 0,
      tokens: meta.tokens || { input: 0, output: 0, total: 0 },
      timestamp: Date.now(),
      duration: meta.duration || 0
    }
  };
  
  // Store raw response for debugging
  result.rawResponse = response.code;
  
  // Extract code blocks using markdown code block format
  const codeBlockRegex = /```([\w#]+)?\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let explanationParts = [];
  let match;
  
  while ((match = codeBlockRegex.exec(response.code)) !== null) {
    // Add text before this code block to explanation
    if (match.index > lastIndex) {
      explanationParts.push(response.code.substring(lastIndex, match.index).trim());
    }
    
    // Extract language and code
    const language = (match[1] || '').trim().toLowerCase();
    const code = match[2].trim();
    
    // Skip empty code blocks
    if (!code) continue;
    
    // Normalize language name
    const normalizedLanguage = languageNormalization[language] || language || 'text';
    
    // Store code block
    result.codeBlocks[normalizedLanguage] = code;
    
    // Update lastIndex
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text to explanation
  if (lastIndex < response.code.length) {
    explanationParts.push(response.code.substring(lastIndex).trim());
  }
  
  // Combine explanation parts
  if (explanationParts.length > 0) {
    result.explanation = explanationParts.join('\n\n').trim();
  }
  
  // Handle case where no code blocks were found
  if (Object.keys(result.codeBlocks).length === 0 && response.code) {
    // Try to determine language from context or default to text
    let language = 'text';
    
    // Simple heuristics to guess language
    if (response.code.includes('<html') || response.code.includes('<!DOCTYPE')) {
      language = 'html';
    } else if (response.code.includes('function') || response.code.includes('const')) {
      language = 'js';
    } else if (response.code.includes('import ') && response.code.includes('from ')) {
      language = 'ts';
    } else if (response.code.includes('def ') && response.code.includes(':')) {
      language = 'python';
    }
    
    result.codeBlocks[language] = response.code;
  }
  
  return result;
};

/**
 * Extract human-readable explanations from a structured response
 */
export const extractExplanation = (response: StructuredResponse): string => {
  if (response.explanation) {
    return response.explanation;
  }
  
  // If no explicit explanation, try to construct one from the code blocks
  const languages = Object.keys(response.codeBlocks);
  if (languages.length === 0) {
    return 'No code or explanation provided.';
  }
  
  return `Generated code includes: ${languages.join(', ')}`;
};

/**
 * Estimate token counts from response text
 * This is a rough approximation and will vary by model
 */
export const estimateTokenCount = (text: string): number => {
  // Simple approximation: ~4 chars per token
  return Math.ceil(text.length / 4);
};

/**
 * Helper to determine if a response contains full-stack web code
 */
export const isFullStackWebResponse = (response: StructuredResponse): boolean => {
  const languages = Object.keys(response.codeBlocks);
  return (
    languages.includes('html') && 
    (languages.includes('css') || languages.includes('js'))
  );
};

/**
 * Helper to determine the primary language of a response
 */
export const getPrimaryLanguage = (response: StructuredResponse): string => {
  const languages = Object.keys(response.codeBlocks);
  if (languages.length === 0) return 'text';
  
  // Priority order for primary language
  const languagePriority = ['html', 'js', 'ts', 'python', 'java', 'c#', 'css'];
  
  for (const lang of languagePriority) {
    if (languages.includes(lang)) {
      return lang;
    }
  }
  
  // Default to first language
  return languages[0];
};

/**
 * Apply an update to an existing response (for follow-up prompts)
 */
export const updateResponseWithChanges = (
  original: StructuredResponse,
  update: StructuredResponse,
  targetLanguage?: string
): StructuredResponse => {
  const result = { ...original };
  result.codeBlocks = { ...original.codeBlocks };
  
  // If a specific language was targeted, only update that language
  if (targetLanguage && update.codeBlocks[targetLanguage]) {
    result.codeBlocks[targetLanguage] = update.codeBlocks[targetLanguage];
  } else {
    // Otherwise update all code blocks
    result.codeBlocks = {
      ...result.codeBlocks,
      ...update.codeBlocks
    };
  }
  
  // Add new explanation if provided
  if (update.explanation) {
    result.explanation = update.explanation;
  }
  
  // Update metadata
  result.meta = {
    ...result.meta,
    timestamp: Date.now(),
    cost: (result.meta.cost || 0) + (update.meta.cost || 0),
    tokens: {
      input: (result.meta.tokens?.input || 0) + (update.meta.tokens?.input || 0),
      output: (result.meta.tokens?.output || 0) + (update.meta.tokens?.output || 0),
      total: (result.meta.tokens?.total || 0) + (update.meta.tokens?.total || 0)
    }
  };
  
  return result;
};

/**
 * Generate standalone HTML file from a structured response
 */
export const generateStandaloneHtml = (response: StructuredResponse): string => {
  let html = response.codeBlocks['html'] || '';
  const css = response.codeBlocks['css'] || '';
  const js = response.codeBlocks['js'] || '';
  
  // If HTML doesn't have a basic structure, wrap it
  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Code</title>
  ${css ? '<style>\n' + css + '\n</style>' : ''}
</head>
<body>
  ${html}
  ${js ? '<script>\n' + js + '\n</script>' : ''}
</body>
</html>`;
  } else {
    // If HTML already has structure, try to insert CSS and JS
    if (css && !html.includes('<style')) {
      html = html.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
    }
    
    if (js && !html.includes('<script')) {
      html = html.replace('</body>', `<script>\n${js}\n</script>\n</body>`);
    }
  }
  
  return html;
};

/**
 * Create a ZIP archive of all code files
 */
export const createCodeArchive = async (response: StructuredResponse): Promise<Blob> => {
  // This would use a library like JSZip
  // For now, this is a placeholder
  const fileContents = new Map<string, string>();
  
  // Add files based on language
  if (response.codeBlocks['html']) {
    fileContents.set('index.html', response.codeBlocks['html']);
  }
  
  if (response.codeBlocks['css']) {
    fileContents.set('styles.css', response.codeBlocks['css']);
  }
  
  if (response.codeBlocks['js']) {
    fileContents.set('script.js', response.codeBlocks['js']);
  }
  
  // Add other languages
  for (const [lang, code] of Object.entries(response.codeBlocks)) {
    if (['html', 'css', 'js'].includes(lang)) continue;
    
    // Generate appropriate filename
    let filename: string;
    switch (lang) {
      case 'python':
        filename = 'main.py';
        break;
      case 'ts':
        filename = 'main.ts';
        break;
      case 'java':
        filename = 'Main.java';
        break;
      default:
        filename = `main.${lang}`;
    }
    
    fileContents.set(filename, code);
  }
  
  // In a real implementation, this would create a ZIP file
  // For now, just return placeholder
  return new Blob(['ZIP placeholder'], { type: 'application/zip' });
};