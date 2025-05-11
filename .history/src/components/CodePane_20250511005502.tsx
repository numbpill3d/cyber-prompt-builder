import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { CodeBlock } from './CodeBlock';
import { StructuredResponse } from '../services/response-handler';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Play, Download, RotateCcw, FileCode } from 'lucide-react';

interface CodePaneProps {
  response: StructuredResponse;
  onRegenerate?: (language?: string) => void;
  onDownload?: (language?: string) => void;
  onRunPreview?: () => void;
}

/**
 * CodePane displays multiple code blocks in a tabbed interface
 */
export const CodePane: React.FC<CodePaneProps> = ({
  response,
  onRegenerate,
  onDownload,
  onRunPreview
}) => {
  const { codeBlocks, explanation, meta } = response;
  const languages = Object.keys(codeBlocks);
  const [activeTab, setActiveTab] = useState(languages[0] || 'explanation');

  // Returns true if the response contains HTML, CSS, and/or JS code
  const hasWebPreview = (): boolean => {
    return Boolean(
      codeBlocks['html'] || 
      (codeBlocks['js'] && codeBlocks['html']) || 
      (codeBlocks['css'] && codeBlocks['html'])
    );
  };

  // Get display name for language
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
      'sql': 'SQL',
      'explanation': 'Explanation'
    };
    return displayMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center p-2">
        <div className="text-sm text-gray-500">
          <span className="font-semibold">{meta.provider}</span> / {meta.model}
          {meta.cost > 0 && (
            <span className="ml-2 text-xs">
              (Cost: ${meta.cost.toFixed(4)})
            </span>
          )}
          {meta.tokens.total > 0 && (
            <span className="ml-2 text-xs">
              ({meta.tokens.total} tokens)
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          {hasWebPreview() && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onRunPreview}
              className="flex items-center space-x-1"
            >
              <Play className="h-4 w-4" />
              <span>Preview</span>
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onDownload && onDownload()}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Download All</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onRegenerate && onRegenerate()}
            className="flex items-center space-x-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Regenerate</span>
          </Button>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-flow-col auto-cols-max gap-2">
          {languages.map(lang => (
            <TabsTrigger 
              key={lang} 
              value={lang}
              className="flex items-center space-x-1 px-3 py-1"
            >
              <FileCode className="h-4 w-4" />
              <span>{getLanguageDisplayName(lang)}</span>
            </TabsTrigger>
          ))}
          
          {explanation && (
            <TabsTrigger 
              value="explanation"
              className="flex items-center space-x-1 px-3 py-1"
            >
              <span>Explanation</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        {languages.map(lang => (
          <TabsContent key={lang} value={lang} className="mt-4">
            <CodeBlock 
              code={codeBlocks[lang]} 
              language={lang}
              onCopy={() => {}}
              onRegenerate={() => onRegenerate && onRegenerate(lang)}
              onDownload={() => onDownload && onDownload(lang)}
            />
          </TabsContent>
        ))}
        
        {explanation && (
          <TabsContent value="explanation" className="mt-4">
            <Card className="p-4 prose prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: explanation }} />
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};