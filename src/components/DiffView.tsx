import React, { useMemo } from 'react';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { diffLines, Change } from 'diff';

interface DiffViewProps {
  original: string;
  updated: string;
  language: string;
  fileName?: string;
}

/**
 * DiffView component to display differences between two code versions
 */
export const DiffView: React.FC<DiffViewProps> = ({
  original,
  updated,
  language,
  fileName
}) => {
  // Compute the diff between original and updated code
  const changes: Change[] = useMemo(() => {
    return diffLines(original, updated);
  }, [original, updated]);

  // Get a display name for the language
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

  // Render the diff view with added/removed highlighting
  const renderDiff = () => {
    return (
      <pre className="p-4 overflow-auto text-sm font-mono whitespace-pre bg-cyber-black rounded-md cyberborder">
        {changes.map((change, index) => {
          // Determine the styling based on whether text was added, removed, or unchanged
          let className = "text-cyber-ice-blue";
          let prefix = "  ";
          
          if (change.added) {
            className = "text-cyber-bright-blue bg-cyber-bright-blue/20";
            prefix = "+ ";
          } else if (change.removed) {
            className = "text-red-400 bg-red-900/30";
            prefix = "- ";
          }
          
          // Split the change into lines and add the appropriate prefix and styling
          return change.value.split('\n').map((line, lineIndex, array) => {
            // Skip the last empty line that often comes from string splitting
            if (lineIndex === array.length - 1 && line === '') return null;
            
            return (
              <div key={`${index}-${lineIndex}`} className={className}>
                <span className="select-none text-cyber-sky-blue w-8 inline-block">{prefix}</span>
                {line}
              </div>
            );
          });
        })}
      </pre>
    );
  };

  // Render unified view (showing changes inline)
  const renderUnified = () => renderDiff();

  // Render side-by-side view (original and updated code side by side)
  const renderSideBySide = () => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-2 font-semibold font-orbitron text-cyber-bright-blue">Original</div>
          <pre className="p-4 overflow-auto text-sm font-mono whitespace-pre bg-cyber-black rounded-md cyberborder">
            {original.split('\n').map((line, index) => (
              <div key={`original-${index}`} className="text-cyber-ice-blue">
                {line}
              </div>
            ))}
          </pre>
        </div>
        <div>
          <div className="mb-2 font-semibold text-gray-400">Updated</div>
          <pre className="p-4 overflow-auto text-sm font-mono whitespace-pre bg-gray-900 rounded-md">
            {updated.split('\n').map((line, index) => (
              <div key={`updated-${index}`} className="text-gray-300">
                {line}
              </div>
            ))}
          </pre>
        </div>
      </div>
    );
  };

  // Calculate a summary of changes
  const changeSummary = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    
    changes.forEach(change => {
      const lines = change.value.split('\n').length - 1; // -1 for the last empty line
      if (change.added) additions += lines;
      if (change.removed) deletions += lines;
    });
    
    return { additions, deletions };
  }, [changes]);

  return (
    <Card className="overflow-hidden shadow-lg bg-gray-900">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-mono text-gray-300">{displayFileName}</span>
          <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
            {displayName}
          </span>
          
          <span className="flex items-center space-x-2 ml-4 text-xs">
            <span className="text-green-400">+{changeSummary.additions}</span>
            <span className="text-red-400">-{changeSummary.deletions}</span>
          </span>
        </div>
      </div>
      
      <Tabs defaultValue="unified" className="p-4">
        <TabsList className="mb-4">
          <TabsTrigger value="unified">Unified</TabsTrigger>
          <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
        </TabsList>
        
        <TabsContent value="unified">
          {renderUnified()}
        </TabsContent>
        
        <TabsContent value="side-by-side">
          {renderSideBySide()}
        </TabsContent>
      </Tabs>
    </Card>
  );
};