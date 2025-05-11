import React, { useState, useEffect } from 'react';
import { CodePane } from './CodePane';
import { LivePreview } from './LivePreview';
import { DiffView } from './DiffView';
import { StructuredResponse, parseResponse, generateStandaloneHtml, createCodeArchive } from '../services/response-handler';
import { sessionManager, Session, SessionIteration, EditAction, EditTarget } from '../services/session-manager';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Download, Github, Upload, History, GitBranch, ArrowLeft, ArrowRight } from 'lucide-react';
import { AIResponse } from '../services/providers';

interface CodeViewerProps {
  response?: AIResponse;
  sessionId?: string;
  onRegenerate?: (prompt: string, target?: string) => void;
  meta?: {
    model: string;
    provider: string;
    cost: number;
    tokens: { input: number; output: number; total: number };
    duration: number;
  };
}

/**
 * CodeViewer is the main component for displaying and interacting with generated code
 */
export const CodeViewer: React.FC<CodeViewerProps> = ({
  response,
  sessionId,
  onRegenerate,
  meta = {
    model: 'unknown',
    provider: 'unknown',
    cost: 0,
    tokens: { input: 0, output: 0, total: 0 },
    duration: 0
  }
}) => {
  // Parse the response into a structured format
  const [parsedResponse, setParsedResponse] = useState<StructuredResponse | null>(null);
  
  // Track the current session
  const [session, setSession] = useState<Session | null>(null);
  
  // Track view mode
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'diff'>('code');
  
  // Track state for diff view
  const [diffData, setDiffData] = useState<{
    original: string;
    updated: string;
    language: string;
  } | null>(null);
  
  // Track history navigation
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  
  // Parse the response when it changes
  useEffect(() => {
    if (response) {
      const parsed = parseResponse(response, meta);
      setParsedResponse(parsed);
      
      // If we have a session, add this response to it
      if (sessionId) {
        try {
          const currentSession = sessionManager.getSession(sessionId);
          if (currentSession) {
            setSession(currentSession);
          }
        } catch (error) {
          console.error('Error loading session:', error);
        }
      }
    }
  }, [response, meta, sessionId]);
  
  // Load session when sessionId changes
  useEffect(() => {
    if (sessionId) {
      try {
        const currentSession = sessionManager.getSession(sessionId);
        if (currentSession) {
          setSession(currentSession);
          // Set the history index to the active iteration
          setHistoryIndex(currentSession.activeIterationIndex);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      }
    }
  }, [sessionId]);
  
  // Get the current response to display
  const getCurrentResponse = (): StructuredResponse | null => {
    if (session && session.iterations.length > 0) {
      return session.iterations[historyIndex]?.response || null;
    }
    return parsedResponse;
  };
  
  const currentResponse = getCurrentResponse();
  
  // Handle code regeneration
  const handleRegenerate = (language?: string) => {
    if (!onRegenerate || !session) return;
    
    const lastIteration = session.iterations[session.activeIterationIndex];
    if (!lastIteration) return;
    
    // Create a prompt for regeneration
    const prompt = `Regenerate the ${language || 'code'}`;
    
    // Call the regenerate handler
    onRegenerate(prompt, language);
  };
  
  // Handle download of individual code blocks or all code
  const handleDownload = async (language?: string) => {
    if (!currentResponse) return;
    
    if (language && currentResponse.codeBlocks[language]) {
      // Download specific language file
      const code = currentResponse.codeBlocks[language];
      const fileName = getFileNameForLanguage(language);
      downloadAsFile(code, fileName);
    } else {
      // Download all code as ZIP
      try {
        const archive = await createCodeArchive(currentResponse);
        downloadBlob(archive, 'generated-code.zip');
      } catch (error) {
        console.error('Error creating ZIP archive:', error);
      }
    }
  };
  
  // Get file name based on language
  const getFileNameForLanguage = (language: string): string => {
    const nameMap: Record<string, string> = {
      'html': 'index.html',
      'css': 'styles.css',
      'js': 'script.js',
      'ts': 'script.ts',
      'python': 'main.py',
      'py': 'main.py',
      'java': 'Main.java',
      'c': 'main.c',
      'cpp': 'main.cpp',
      'c#': 'Program.cs',
      'csharp': 'Program.cs',
      'rust': 'main.rs',
      'go': 'main.go',
      'ruby': 'main.rb',
      'php': 'index.php',
      'swift': 'main.swift',
      'kotlin': 'Main.kt',
      'markdown': 'README.md',
      'md': 'README.md',
      'json': 'data.json',
      'yaml': 'config.yaml',
      'bash': 'script.sh',
      'sql': 'query.sql'
    };
    
    return nameMap[language] || `code.${language}`;
  };
  
  // Create and download a text file
  const downloadAsFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    downloadBlob(blob, fileName);
  };
  
  // Download a blob as a file
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle preview mode
  const handleRunPreview = () => {
    setViewMode('preview');
  };
  
  // Show diff view between iterations
  const showDiff = (oldIndex: number, newIndex: number) => {
    if (!session || !session.iterations[oldIndex] || !session.iterations[newIndex]) return;
    
    const oldResponse = session.iterations[oldIndex].response;
    const newResponse = session.iterations[newIndex].response;
    
    // Find a common language to diff
    const languages = Object.keys(newResponse.codeBlocks);
    for (const lang of languages) {
      if (oldResponse.codeBlocks[lang]) {
        setDiffData({
          original: oldResponse.codeBlocks[lang],
          updated: newResponse.codeBlocks[lang],
          language: lang
        });
        setViewMode('diff');
        return;
      }
    }
  };
  
  // Handle history navigation
  const navigateHistory = (direction: 'prev' | 'next') => {
    if (!session) return;
    
    let newIndex = historyIndex;
    if (direction === 'prev' && historyIndex > 0) {
      newIndex = historyIndex - 1;
    } else if (direction === 'next' && historyIndex < session.iterations.length - 1) {
      newIndex = historyIndex + 1;
    }
    
    if (newIndex !== historyIndex) {
      setHistoryIndex(newIndex);
      if (viewMode === 'diff') {
        showDiff(historyIndex, newIndex);
      }
    }
  };
  
  // Render history controls if we have a session with multiple iterations
  const renderHistoryControls = () => {
    if (!session || session.iterations.length <= 1) return null;
    
    return (
      <div className="flex items-center space-x-2 text-sm">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => navigateHistory('prev')}
          disabled={historyIndex <= 0}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Previous</span>
        </Button>
        
        <span className="text-gray-500">
          {historyIndex + 1} / {session.iterations.length}
        </span>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => navigateHistory('next')}
          disabled={historyIndex >= session.iterations.length - 1}
        >
          <span>Next</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
        
        {historyIndex < session.iterations.length - 1 && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => showDiff(historyIndex, historyIndex + 1)}
          >
            <span>Show Changes</span>
          </Button>
        )}
      </div>
    );
  };
  
  // Get HTML, CSS, and JS for preview
  const getPreviewCode = () => {
    if (!currentResponse) return { html: '', css: '', js: '' };
    
    return {
      html: currentResponse.codeBlocks['html'] || '',
      css: currentResponse.codeBlocks['css'] || '',
      js: currentResponse.codeBlocks['js'] || ''
    };
  };
  
  // Render content based on view mode
  const renderContent = () => {
    if (!currentResponse) return null;
    
    switch (viewMode) {
      case 'preview':
        const { html, css, js } = getPreviewCode();
        return (
          <LivePreview 
            html={html} 
            css={css} 
            js={js} 
            autoReload={true}
          />
        );
        
      case 'diff':
        if (!diffData) return null;
        return (
          <DiffView 
            original={diffData.original}
            updated={diffData.updated}
            language={diffData.language}
          />
        );
        
      case 'code':
      default:
        return (
          <CodePane 
            response={currentResponse}
            onRegenerate={handleRegenerate}
            onDownload={handleDownload}
            onRunPreview={handleRunPreview}
          />
        );
    }
  };
  
  // If there's no response, show a placeholder
  if (!currentResponse) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No code generated yet</p>
      </Card>
    );
  }
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="preview" disabled={!getPreviewCode().html}>Preview</TabsTrigger>
            <TabsTrigger value="diff" disabled={!diffData}>Diff</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {renderHistoryControls()}
      </div>
      
      <Separator />
      
      {renderContent()}
    </div>
  );
};