import React, { useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { Copy, Check, Download, RotateCcw } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  fileName?: string;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onDownload?: () => void;
}

/**
 * CodeBlock component displays code with syntax highlighting and actions
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  fileName,
  onCopy,
  onRegenerate,
  onDownload
}) => {
  const [copied, setCopied] = React.useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  // Map language aliases to their proper names for syntax highlighting
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'md': 'markdown'
  };

  // Get the proper language name for syntax highlighting
  const highlightLanguage = languageMap[language] || language;

  // Handle copy action
  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        
        if (onCopy) {
          onCopy();
        }
      });
    }
  };

  // Reset copied state when code changes
  useEffect(() => {
    setCopied(false);
  }, [code]);
  
  // Convert language to display name
  const getLanguageDisplayName = (lang: string): string => {
    const displayMap: Record<string, string> = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'html': 'HTML',
      'css': 'CSS',
      'python': 'Python',
      'py': 'Python',
      'java': 'Java',
      'c': 'C',
      'cpp': 'C++',
      'csharp': 'C#',
      'c#': 'C#',
      'go': 'Go',
      'rust': 'Rust',
      'ruby': 'Ruby',
      'php': 'PHP',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'markdown': 'Markdown',
      'md': 'Markdown',
      'json': 'JSON',
      'yaml': 'YAML',
      'bash': 'Bash',
      'sql': 'SQL'
    };
    return displayMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const displayName = getLanguageDisplayName(language);
  const displayFileName = fileName || `${language === 'md' ? 'README.md' : `code.${language}`}`;

  return (
    <div className="rounded-md overflow-hidden shadow-lg bg-gray-900">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-mono text-gray-300">{displayFileName}</span>
          <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
            {displayName}
          </span>
        </div>
        
        <div className="flex space-x-2">
          {onRegenerate && (
            <Tooltip content="Regenerate code">
              <Button
                size="sm"
                variant="ghost"
                onClick={onRegenerate}
                className="text-gray-400 hover:text-gray-200"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </Tooltip>
          )}
          
          {onDownload && (
            <Tooltip content="Download file">
              <Button
                size="sm"
                variant="ghost"
                onClick={onDownload}
                className="text-gray-400 hover:text-gray-200"
              >
                <Download className="h-4 w-4" />
              </Button>
            </Tooltip>
          )}
          
          <Tooltip content={copied ? "Copied!" : "Copy code"}>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-200"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </Tooltip>
        </div>
      </div>
      
      <div className="relative max-h-[500px] overflow-auto">
        <SyntaxHighlighter
          language={highlightLanguage}
          style={coldarkDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
          showLineNumbers
          ref={codeRef}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};