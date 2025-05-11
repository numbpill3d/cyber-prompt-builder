/**
 * Response Model
 * Defines structured response types for AI-generated content
 */

/**
 * Code block in a structured response
 */
export interface CodeBlock {
  language: string;
  code: string;
  explanation?: string;
  filename?: string;
  lineNumbers?: boolean;
}

/**
 * Metadata about the response
 */
export interface ResponseMeta {
  model: string;
  provider: string;
  cost?: number;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  duration?: number; // milliseconds
  timestamp?: number;
  prompt?: string;
}

/**
 * Structured response from AI providers
 */
export interface StructuredResponse {
  explanation?: string;
  codeBlocks?: CodeBlock[];
  references?: string[];
  reasoning?: string;
  followUpQuestions?: string[];
  metadata?: ResponseMeta;
  raw?: string;
}

/**
 * AI response with potential error
 */
export interface AIResponse {
  code: string;
  error?: string;
}

/**
 * Function to parse a raw response into a structured format
 * @param result The raw response from the AI provider
 * @param meta Metadata about the response
 * @returns A structured response object
 */
export function parseResponse(result: AIResponse, meta?: ResponseMeta): StructuredResponse {
  // If there was an error, return a simple response
  if (result.error) {
    return {
      explanation: `Error: ${result.error}`,
      raw: result.code,
      metadata: meta
    };
  }

  // Store the raw response
  const raw = result.code;
  
  try {
    // Simple parsing logic - can be enhanced to detect code blocks, explanations, etc.
    const codeBlocks: CodeBlock[] = [];
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
    
    let match;
    let lastIndex = 0;
    let explanation = '';
    
    // Extract code blocks
    while ((match = codeBlockRegex.exec(raw)) !== null) {
      // Text before the code block is explanation
      const beforeText = raw.substring(lastIndex, match.index).trim();
      if (beforeText) {
        explanation += beforeText + '\n\n';
      }
      
      // Add code block
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text as explanation
    if (lastIndex < raw.length) {
      explanation += raw.substring(lastIndex).trim();
    }
    
    return {
      explanation: explanation.trim(),
      codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
      raw,
      metadata: meta
    };
  } catch (error) {
    // If parsing fails, return the raw response
    return {
      explanation: 'Failed to parse structured response',
      raw,
      metadata: meta
    };
  }
}

/**
 * Generate a standalone HTML document from a structured response
 * @param response The structured response
 * @returns HTML string
 */
export function generateStandaloneHtml(response: StructuredResponse): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Code</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { font-family: 'Courier New', Courier, monospace; }
    .header { margin-bottom: 30px; }
    .explanation { margin-bottom: 20px; }
    .code-block { margin-bottom: 30px; }
    .code-header { display: flex; justify-content: space-between; background-color: #e0e0e0; padding: 5px 15px; border-radius: 5px 5px 0 0; }
    .metadata { font-size: 12px; color: #666; border-top: 1px solid #eee; margin-top: 40px; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Generated Code</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>`;

  // Add explanation
  if (response.explanation) {
    html += `
  <div class="explanation">
    <h2>Explanation</h2>
    <div>${response.explanation.replace(/\n/g, '<br>')}</div>
  </div>`;
  }

  // Add code blocks
  if (response.codeBlocks && response.codeBlocks.length > 0) {
    html += `
  <div class="code-blocks">
    <h2>Code</h2>`;

    response.codeBlocks.forEach((block, index) => {
      html += `
    <div class="code-block">
      <div class="code-header">
        <span>${block.language || 'code'}</span>
        ${block.filename ? `<span>${block.filename}</span>` : ''}
      </div>
      <pre><code>${block.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      ${block.explanation ? `<div class="block-explanation">${block.explanation.replace(/\n/g, '<br>')}</div>` : ''}
    </div>`;
    });

    html += `
  </div>`;
  }

  // Add metadata
  if (response.metadata) {
    const meta = response.metadata;
    html += `
  <div class="metadata">
    <p>Provider: ${meta.provider}, Model: ${meta.model}</p>
    ${meta.tokens ? `<p>Tokens: ${meta.tokens.total} (Input: ${meta.tokens.input}, Output: ${meta.tokens.output})</p>` : ''}
    ${meta.cost !== undefined ? `<p>Estimated cost: $${meta.cost.toFixed(6)}</p>` : ''}
    ${meta.duration ? `<p>Generation time: ${(meta.duration / 1000).toFixed(2)}s</p>` : ''}
  </div>`;
  }

  html += `
</body>
</html>`;

  return html;
}

/**
 * Create a downloadable code archive from a structured response
 * @param response The structured response
 * @returns A Blob containing the archive
 */
export async function createCodeArchive(response: StructuredResponse): Promise<Blob> {
  // This would typically use a library like JSZip to create a ZIP archive
  // For this example, we'll return a simple text file with all code concatenated
  
  let content = '';
  
  if (response.explanation) {
    content += `# Explanation\n\n${response.explanation}\n\n`;
  }
  
  if (response.codeBlocks && response.codeBlocks.length > 0) {
    content += '# Code Blocks\n\n';
    
    response.codeBlocks.forEach((block, index) => {
      content += `## ${block.filename || `Code Block ${index + 1} (${block.language || 'text'})`}\n\n`;
      content += '```' + (block.language || '') + '\n';
      content += block.code + '\n';
      content += '```\n\n';
      
      if (block.explanation) {
        content += `### Explanation\n\n${block.explanation}\n\n`;
      }
    });
  }
  
  // Add metadata
  if (response.metadata) {
    const meta = response.metadata;
    content += '# Metadata\n\n';
    content += `- Provider: ${meta.provider}\n`;
    content += `- Model: ${meta.model}\n`;
    
    if (meta.tokens) {
      content += `- Tokens: ${meta.tokens.total} (Input: ${meta.tokens.input}, Output: ${meta.tokens.output})\n`;
    }
    
    if (meta.cost !== undefined) {
      content += `- Estimated cost: $${meta.cost.toFixed(6)}\n`;
    }
    
    if (meta.duration) {
      content += `- Generation time: ${(meta.duration / 1000).toFixed(2)}s\n`;
    }
  }
  
  return new Blob([content], { type: 'text/plain' });
}