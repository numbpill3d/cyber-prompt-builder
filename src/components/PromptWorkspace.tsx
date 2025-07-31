import React, { useState, useEffect } from 'react';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Code, 
  History, 
  Settings, 
  Layers, 
  Tag, 
  Save,
  Download,
  Upload,
  Plus,
  Trash,
  Search,
  Database,
  BarChart3
} from 'lucide-react';

import PromptEditor from '@/components/PromptEditor';
import VersionDiff from '@/components/VersionDiff';
import AutomationPanel from '@/components/AutomationPanel';
import FloatingDock, { OutputItem } from '@/components/FloatingDock';
import TokenMetrics from '@/components/TokenMetrics';

import { promptMemoryStore, PromptSession } from '@/services/memory/prompt-memory-store';
import { promptAnalyzer } from '@/services/analysis/prompt-analyzer';
import { autoTagger } from '@/services/tagging/auto-tagger';
import { v4 as uuidv4 } from 'uuid';

const PromptWorkspace: React.FC = () => {
  // State for the prompt editor
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [apiKey, setApiKey] = useState('');
  
  // State for sessions and snapshots
  const [sessions, setSessions] = useState<PromptSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  
  // State for analysis
  const [analysis, setAnalysis] = useState<{
    tokenEstimation: {
      count: number;
      model: string;
      costEstimate?: number;
    };
    confidenceScore: number;
    complexity: string;
    suggestedImprovements: string[];
    promptType: string[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for output history
  const [outputHistory, setOutputHistory] = useState<OutputItem[]>([]);
  
  // State for system logs
  const [systemLogs, setSystemLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] System initialized`,
    `[${new Date().toLocaleTimeString()}] Ready`
  ]);
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<PromptSession[]>([]);
  
  // Load API key from localStorage (migrate from old key if present)
  useEffect(() => {
    const newKey = localStorage.getItem('openai_api_key');
    const oldKey = localStorage.getItem('openai-api-key');
    const storedApiKey = newKey || oldKey;

    if (storedApiKey) {
      setApiKey(storedApiKey);
      // migrate to new key if needed
      if (oldKey && !newKey) {
        localStorage.setItem('openai_api_key', oldKey);
        localStorage.removeItem('openai-api-key');
      }
    }
  }, []);
  
  // Load sessions from memory store
  useEffect(() => {
    const allSessions = promptMemoryStore.getAllSessions();
    setSessions(allSessions);
    setFilteredSessions(allSessions);
    
    if (allSessions.length > 0 && !currentSessionId) {
      const latestSession = allSessions.reduce((latest, session) => {
        return session.updatedAt > latest.updatedAt ? session : latest;
      }, allSessions[0]);
      
      setSelectedSessionId(latestSession.id);
    }
  }, [currentSessionId]);
  
  // Filter sessions when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSessions(sessions);
    } else {
      const filtered = promptMemoryStore.searchSessions(searchQuery);
      setFilteredSessions(filtered);
    }
  }, [searchQuery, sessions]);
  
  // Add a system log
  const addSystemLog = (message: string) => {
    setSystemLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };
  
  // Handle prompt execution
  const handleExecute = (result: {
    error?: string;
    code?: string;
    usage?: {
      total_tokens: number;
    };
  }) => {
    setIsProcessing(true);
    
    // Add to output history
    const outputItem: OutputItem = {
      id: uuidv4(),
      content: result.error ? result.error : (result.code ?? ''),
      timestamp: Date.now(),
      type: result.error ? 'error' : 'code',
      metadata: result.usage ? {
        tokens: result.usage.total_tokens,
        model: 'gpt-4'
      } : undefined
    };
    
    setOutputHistory(prev => [...prev, outputItem]);
    addSystemLog(`Execution completed: ${result.error ? 'Error' : 'Success'}`);
    
    // Analyze the prompt
const promptAnalysis = promptAnalyzer.analyzePrompt(currentPrompt);
const someVar = someCondition
  ? { model: 'gpt-4' }
  : undefined;

    };
    
    setOutputHistory(prev => [...prev, outputItem]);
    addSystemLog(`Execution completed: ${result.error ? 'Error' : 'Success'}`);
    
    // Analyze the prompt
    try {
      const promptAnalysis = promptAnalyzer.analyzePrompt(currentPrompt);
      setAnalysis(promptAnalysis);
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      addSystemLog(`Error analyzing prompt: ${error.message}`);
    }
    
    setIsProcessing(false);
  };
  
  // Handle session selection
  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    
    const session = promptMemoryStore.getSession(sessionId);
    if (session && session.currentSnapshotId) {
      const currentSnapshot = session.snapshots.find(s => s.id === session.currentSnapshotId);
      if (currentSnapshot) {
        setCurrentPrompt(currentSnapshot.content);
        
        // Analyze the prompt
        try {
          const promptAnalysis = promptAnalyzer.analyzePrompt(currentSnapshot.content);
          setAnalysis(promptAnalysis);
        } catch (error) {
          console.error('Error analyzing prompt:', error);
          addSystemLog(`Error analyzing prompt: ${error.message}`);
        }
        
        addSystemLog(`Loaded session: ${session.name}`);
      }
    
    setIsProcessing(false);
  };
  
  // Handle session selection
  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    
    const session = promptMemoryStore.getSession(sessionId);
    const currentSnapshot = session?.currentSnapshotId 
      ? session.snapshots.find(s => s.id === session.currentSnapshotId)
      : undefined;
      
    if (currentSnapshot) {
      setCurrentPrompt(currentSnapshot.content);
      
      // Analyze the prompt
      const promptAnalysis = promptAnalyzer.analyzePrompt(currentSnapshot.content);
      setAnalysis(promptAnalysis);
      
      addSystemLog(`Loaded session: ${session.name}`);
    }
  };
  
  // Handle saving a prompt
  const handleSavePrompt = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    addSystemLog(`Saved prompt to session: ${sessionId}`);
    
    // Refresh sessions
    const allSessions = promptMemoryStore.getAllSessions();
    setSessions(allSessions);
  };
  
  // Handle creating a new session
  const handleCreateSession = () => {
    const newSession = promptMemoryStore.createSession(
      `Session ${new Date().toLocaleString()}`,
      '',
      []
    );
    
    setSessions(prev => [...prev, newSession]);
    setSelectedSessionId(newSession.id);
    addSystemLog(`Created new session: ${newSession.id}`);
  };
  
  // Handle deleting a session
  const handleDeleteSession = (sessionId: string) => {
    promptMemoryStore.deleteSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(undefined);
      setCurrentPrompt('');
    }
    
    addSystemLog(`Deleted session: ${sessionId}`);
  };
  
  // Handle rollback to a snapshot
  const handleRollback = (snapshotId: string) => {
    if (selectedSessionId) {
      promptMemoryStore.rollbackToSnapshot(selectedSessionId, snapshotId);
      
      const session = promptMemoryStore.getSession(selectedSessionId);
      if (session) {
        const snapshot = session.snapshots.find(s => s.id === snapshotId);
        if (snapshot) {
          setCurrentPrompt(snapshot.content);
          addSystemLog(`Rolled back to snapshot: ${snapshotId}`);
        }
      }
    }
  };
  
  // Handle clearing output history
  const handleClearOutputHistory = () => {
    setOutputHistory([]);
    addSystemLog('Cleared output history');
  };
  
  // Handle copying an output item
  const handleCopyOutput = (item: OutputItem) => {
    addSystemLog(`Copied output: ${item.id}`);
  };
  
  // Handle removing an output item
  const handleRemoveOutput = (id: string) => {
    setOutputHistory(prev => prev.filter(item => item.id !== id));
    addSystemLog(`Removed output: ${id}`);
  };
  
  // Handle saving API key
  const handleSaveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.removeItem('openai-api-key');
    addSystemLog('Saved API key');
// Handle clearing output history
  const handleClearOutputHistory = () => {
    setOutputHistory([]);
    addSystemLog('Cleared output history');
  };
  
  // Handle copying an output item
  const handleCopyOutput = (item: OutputItem) => {
    navigator.clipboard.writeText(item.content).then(() => {
      addSystemLog(`Copied output: ${item.id}`);
    }).catch(err => {
      addSystemLog(`Failed to copy output: ${item.id}. Error: ${err}`);
    });
  };
  
  // Handle removing an output item
  const handleRemoveOutput = (id: string) => {
    setOutputHistory(prev => prev.filter(item => item.id !== id));
    addSystemLog(`Removed output: ${id}`);
  };
  
  // Handle saving API key
  const handleSaveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.removeItem('openai-api-key');
    addSystemLog('Saved API key');
  };

  // Format date for display
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full flex flex-col bg-black/20 backdrop-blur-sm border-r border-purple-500/20 p-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Sessions
                </h2>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateSession}
                  className="h-8 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    placeholder="Search sessions..."
                    className="pl-8 bg-black/30 border-purple-500/30 focus:border-purple-500/50 text-white"
                  />
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {filteredSessions.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400">No sessions found</p>
                    </div>
                  ) : (
                    filteredSessions.map((session) => (
                      <Card
                        key={session.id}
                        className={`bg-black/30 border-purple-500/10 p-3 hover:border-purple-500/30 transition-colors cursor-pointer ${
                          selectedSessionId === session.id ? 'border-purple-500/50 bg-purple-500/10' : ''
                        }`}
                        onClick={() => {
                          handleSelectSession(session.id);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-white">{session.name}</h3>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {formatDate(session.updatedAt)}
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs">
                              {session.snapshots.length} snapshots
                            </Badge>
                          </div>
                        </div>
                        
                        {session.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {session.tags.map(tag => (
                              <Badge 
                                key={tag} 
                                variant="outline"
                                className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              <div className="mt-4 pt-4 border-t border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-white">Storage</h3>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Import
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <Card className="bg-black/30 border-purple-500/10 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <Database className="h-3 w-3 text-purple-400 mr-1" />
                      <span className="text-xs text-gray-400">Cloud Storage</span>
                    </div>
                    
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-red-500/10 text-red-300 border-red-500/30"
                    >
                      Offline
                    </Badge>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1 h-7 bg-black/20 border-purple-500/30 hover:bg-purple-500/20 text-xs"
                  >
                    Connect
                  </Button>
                </Card>
              </div>
            </div>
          </ResizablePanel>
          
          <ResizablePanel defaultSize={55}>
            <div className="h-full flex flex-col p-4">
              <Tabs defaultValue="editor" className="flex-1 flex flex-col">
                <TabsList className="bg-black/20 mb-4">
                  <TabsTrigger value="editor" className="data-[state=active]:bg-purple-500/20">
                    <Code className="h-4 w-4 mr-2" />
                    Prompt Editor
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-purple-500/20">
                    <History className="h-4 w-4 mr-2" />
                    Version History
                  </TabsTrigger>
                  <TabsTrigger value="automation" className="data-[state=active]:bg-purple-500/20">
                    <Zap className="h-4 w-4 mr-2" />
                    Automation
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:bg-purple-500/20">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="flex-1 flex flex-col">
                  <PromptEditor
                    initialPrompt={currentPrompt}
                    sessionId={selectedSessionId}
                    onSave={handleSavePrompt}
                    onExecute={handleExecute}
                  />
                </TabsContent>
                
                <TabsContent value="history" className="flex-1">
                  {selectedSessionId ? (
                    <VersionDiff
                      sessionId={selectedSessionId}
                      onRollback={handleRollback}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">Select a session to view version history</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="automation" className="flex-1">
                  <AutomationPanel
                    prompt={currentPrompt}
                    apiKey={apiKey}
                  />
                </TabsContent>
                
                <TabsContent value="settings" className="flex-1">
                  <Card className="bg-black/40 border-purple-500/20 p-4">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <Settings className="h-5 w-5 text-purple-400 mr-2" />
                      Settings
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">API Keys</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">OpenAI API Key</label>
                            <div className="flex space-x-2">
                              <Input
                                type="password"
                                value={apiKey}
                                onChange={(e) => {
                                  setApiKey(e.target.value);
                                }}
                                placeholder="sk-..."
                                className="flex-1 bg-black/30 border-purple-500/30"
                              />
                              <Button
                                variant="outline"
                                onClick={handleSaveApiKey}
                                className="bg-black/20 border-purple-500/30 hover:bg-purple-500/20"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">UI Settings</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-gray-400">Theme</label>
                            <select
                              className="bg-black/30 border border-purple-500/30 rounded-md px-3 py-1 text-sm text-white"
                            >
                              <option value="cyberpunk">Cyberpunk</option>
                              <option value="neon">Neon</option>
                              <option value="midnight">Midnight</option>
                              <option value="matrix">Matrix</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-gray-400">Font Size</label>
                            <select
                              className="bg-black/30 border border-purple-500/30 rounded-md px-3 py-1 text-sm text-white"
                            >
                              <option value="small">Small</option>
                              <option value="medium">Medium</option>
                              <option value="large">Large</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">Storage</h4>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full bg-black/20 border-purple-500/30 hover:bg-purple-500/20"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Clear Local Storage
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
          
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <div className="h-full flex flex-col bg-black/20 backdrop-blur-sm border-l border-purple-500/20 p-2">
              <Tabs defaultValue="analysis" className="flex-1 flex flex-col">
                <TabsList className="bg-black/20 mb-4">
                  <TabsTrigger value="analysis" className="data-[state=active]:bg-purple-500/20">
                    <Layers className="h-4 w-4 mr-2" />
                    Analysis
                  </TabsTrigger>
                  <TabsTrigger value="tags" className="data-[state=active]:bg-purple-500/20">
                    <Tag className="h-4 w-4 mr-2" />
                    Auto-Tags
                  </TabsTrigger>
                  <TabsTrigger value="metrics" className="data-[state=active]:bg-purple-500/20">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Metrics
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="analysis" className="flex-1 overflow-auto">
                  {analysis ? (
                    <div className="space-y-4">
                      <Card className="bg-black/30 border-purple-500/10 p-3">
                        <h3 className="text-sm font-medium mb-2 flex items-center">
                          <Layers className="h-4 w-4 text-purple-400 mr-2" />
                          Token Estimation
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Count:</span>
                            <span className="text-xs font-medium">{analysis.tokenEstimation.count}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Model:</span>
                            <span className="text-xs font-medium">{analysis.tokenEstimation.model}</span>
                          </div>
                          
                          {analysis.tokenEstimation.costEstimate && (
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-400">Est. Cost:</span>
                              <span className="text-xs font-medium">${analysis.tokenEstimation.costEstimate.toFixed(4)}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                      
                      <Card className="bg-black/30 border-purple-500/10 p-3">
                        <h3 className="text-sm font-medium mb-2 flex items-center">
                          <BarChart3 className="h-4 w-4 text-purple-400 mr-2" />
                          Confidence Score
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="w-full bg-black/40 rounded-full h-2.5">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" 
                              style={{ width: `${analysis.confidenceScore}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Score:</span>
                            <span className="text-xs font-medium">{analysis.confidenceScore}%</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Complexity:</span>
                            <Badge 
                              variant="outline"
                              className={`
                                text-xs 
                                ${analysis.complexity === 'simple' ? 'bg-green-500/10 text-green-300 border-green-500/30' : 
                                  analysis.complexity === 'moderate' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' : 
                                  'bg-red-500/10 text-red-300 border-red-500/30'}
                              `}
                            >
                              {analysis.complexity}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="bg-black/30 border-purple-500/10 p-3">
                        <h3 className="text-sm font-medium mb-2 flex items-center">
                          <Zap className="h-4 w-4 text-purple-400 mr-2" />
                          Suggested Improvements
                        </h3>
                        
                        {analysis.suggestedImprovements.length > 0 ? (
                          <ul className="space-y-1">
                            {analysis.suggestedImprovements.map((suggestion: string, index: number) => (
                              <li key={index} className="text-xs text-gray-300 flex items-start">
                                <span className="text-purple-400 mr-2">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-400">No suggestions available.</p>
                        )}
                      </Card>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No analysis available</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="tags" className="flex-1 overflow-auto">
                  <div className="space-y-4">
                    <Card className="bg-black/30 border-purple-500/10 p-3">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Tag className="h-4 w-4 text-purple-400 mr-2" />
                        Auto-Detected Tags
                      </h3>
                      
                      {analysis && analysis.promptType.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {analysis.promptType.map((type: string) => (
                            <Badge 
                              key={type} 
                              variant="outline"
                              className="bg-purple-500/10 text-purple-300 border-purple-500/30"
                            >
                              {type}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">No tags detected</p>
                      )}
                    </Card>
                    
                    <Card className="bg-black/30 border-purple-500/10 p-3">
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Tag className="h-4 w-4 text-purple-400 mr-2" />
                        Available Categories
                      </h3>
                      
                      <div className="flex flex-wrap gap-2">
                        {autoTagger.getAllCategories().map((category) => (
                          <Badge 
                            key={category} 
                            variant="outline"
                            className="bg-black/40 text-gray-300 border-gray-500/30 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30 cursor-pointer transition-colors"
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="metrics" className="flex-1 overflow-auto">
                  <TokenMetrics 
                    tokenCount={analysis?.tokenEstimation.count ?? 0}
                    confidenceScore={analysis?.confidenceScore ?? 0}
                    modelName="GPT-4"
                    isProcessing={isProcessing}
                    logs={systemLogs}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Floating components */}
      <FloatingDock
        items={outputHistory}
        onClear={handleClearOutputHistory}
        onCopy={handleCopyOutput}
        onRemove={handleRemoveOutput}
      />
    </div>
  );
// Import statements remain unchanged

const PromptWorkspace: React.FC = () => {
  // State management remains unchanged

  // Helper functions remain unchanged

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <SessionPanel
            sessions={filteredSessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            onDeleteSession={handleDeleteSession}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          <EditorPanel
            currentPrompt={currentPrompt}
            selectedSessionId={selectedSessionId}
            onSavePrompt={handleSavePrompt}
            onExecute={handleExecute}
            apiKey={apiKey}
            setApiKey={setApiKey}
            onSaveApiKey={handleSaveApiKey}
          />
          <AnalysisPanel
            analysis={analysis}
            isProcessing={isProcessing}
            systemLogs={systemLogs}
          />
        </ResizablePanelGroup>
      </div>
      <FloatingDock
        items={outputHistory}
        onClear={handleClearOutputHistory}
        onCopy={handleCopyOutput}
        onRemove={handleRemoveOutput}
      />
    </div>
  );
};

// TODO: Implement SessionPanel component
// TODO: Implement EditorPanel component
// TODO: Implement AnalysisPanel component

export default PromptWorkspace;

export default PromptWorkspace;