import { useState, useEffect } from 'react';
import { useMemoryService } from '@frontend/hooks/use-memory-service';
import { useTTSService } from '@frontend/hooks/use-tts-service';
import { useEvolutionService } from '@frontend/hooks/use-evolution-service';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@frontend/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';
import { Button } from '@frontend/components/ui/button';
import { Separator } from '@frontend/components/ui/separator';
import { Input } from '@frontend/components/ui/input';
import { Textarea } from '@frontend/components/ui/textarea';
import { Switch } from '@frontend/components/ui/switch';
import { Label } from '@frontend/components/ui/label';
import {
  MemoryType,
  MemoryEntry
} from '@shared/interfaces/memory-engine';
import {
  EvolutionMetrics,
  ImprovementSuggestion
} from '@shared/interfaces/evolution-engine';
import MemoryExplorer from '@frontend/components/MemoryExplorer';
import TtsControls from '@frontend/components/TtsControls';
import { LoadingSpinner } from '@frontend/components/ui/loading-spinner';
import { 
  Play, 
  Terminal, 
  Brain, 
  Database, 
  RefreshCcw,
  Puzzle,
  Settings2,
  Rocket
} from 'lucide-react';

export default function AgentLab() {
  // Service hooks
  const { memoryService, isLoading: isMemoryLoading } = useMemoryService();
  const { ttsService, isLoading: isTTSLoading } = useTTSService();
  const { evolutionService, isLoading: isEvolutionLoading } = useEvolutionService();
  
  // State
  const [activeTab, setActiveTab] = useState('workspace');
  const [agentTask, setAgentTask] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoImproveEnabled, setAutoImproveEnabled] = useState(false);
  const [taskLog, setTaskLog] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<ImprovementSuggestion[]>([]);
  const [agentMemories, setAgentMemories] = useState<MemoryEntry[]>([]);
  const [metrics, setMetrics] = useState<EvolutionMetrics | null>(null);
  
  // Initialize component
  useEffect(() => {
    if (memoryService && evolutionService) {
      loadAgentData();
    }
  }, [memoryService, evolutionService]);
  
  // Functions
  const loadAgentData = async () => {
    if (!memoryService || !evolutionService) return;
    
    try {
      // Load recent agent memories
      const memories = await memoryService.searchMemories('agent', {
        maxResults: 10,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      });
      
      setAgentMemories(memories.entries);
      
      // Load metrics if we have reports
      const latestReport = await evolutionService.getLatestReport('current-session');
      if (latestReport) {
        setMetrics(latestReport.metrics);
        setImprovements(latestReport.improvements);
      }
    } catch (error) {
      console.error('Failed to load agent data:', error);
    }
  };
  
  const runAgentTask = async () => {
    if (!agentTask.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setTaskLog(prevLog => [...prevLog, `[${new Date().toLocaleTimeString()}] Starting task: ${agentTask}`]);
    
    try {
      // Simulated processing steps
      await simulateAgentProcessing();
      
      // After task completion, log the memory
      if (memoryService) {
        await memoryService.addMemory('agent', agentTask, {
          type: MemoryType.USER_INPUT,
          source: 'agent-lab',
          tags: ['task', 'user-input']
        });
        
        // Reload memories
        loadAgentData();
      }
      
      // If auto-improvement is enabled, generate improvement suggestions
      if (autoImproveEnabled && evolutionService) {
        setTaskLog(prevLog => [...prevLog, `[${new Date().toLocaleTimeString()}] Generating improvement suggestions...`]);
        
        // Generate new evolution report
        const report = await evolutionService.generateReport('current-session');
        setMetrics(report.metrics);
        setImprovements(report.improvements);
        
        setTaskLog(prevLog => [...prevLog, `[${new Date().toLocaleTimeString()}] Improvement analysis complete`]);
      }
    } catch (error) {
      console.error('Error executing agent task:', error);
      setTaskLog(prevLog => [...prevLog, `[${new Date().toLocaleTimeString()}] Error: Task execution failed`]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Simulated async processing for demonstration purposes
  const simulateAgentProcessing = async () => {
    // Simulate task planning
    setTaskLog(prevLog => [...prevLog, `[${new Date().toLocaleTimeString()}] Planning task execution...`]);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate subtasks
    setTaskLog(prevLog => [...prevLog, `[${new Date().toLocaleTimeString()}] Breaking down into subtasks...`]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate execution
    setTaskLog(prevLog => [...prevLog, `[${new Date().toLocaleTimeString()}] Executing subtasks...`]);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate completion
    setTaskLog(prevLog => [...prevLog, `[${new Date().toLocaleTimeString()}] Task completed successfully`]);
  };
  
  const clearTaskLog = () => {
    setTaskLog([]);
  };
  
  const toggleAutoImprovement = (enabled: boolean) => {
    setAutoImproveEnabled(enabled);
  };
  
  // Loading state
  const isLoading = isMemoryLoading || isTTSLoading || isEvolutionLoading;
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <div className="flex flex-col items-center gap-4 py-12">
              <LoadingSpinner size="lg" />
              <p>Loading Agent Lab services...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card className="cyberborder ice-card hover-glow">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
            <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
            Agent Lab
          </CardTitle>
          <CardDescription>
            Experimental workspace for agent development and improvement
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-8">
              <TabsTrigger value="workspace" className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Workspace
              </TabsTrigger>
              <TabsTrigger value="memory" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Memory
              </TabsTrigger>
              <TabsTrigger value="improvements" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Auto-Improvement
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Voice
              </TabsTrigger>
            </TabsList>
            
            {/* Workspace Tab */}
            <TabsContent value="workspace">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="agent-task" className="text-base font-medium">
                    Task Description
                  </Label>
                  <Textarea
                    id="agent-task"
                    placeholder="Describe the task for your agent to perform..."
                    className="mt-2 h-24"
                    value={agentTask}
                    onChange={(e) => setAgentTask(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-improve"
                      checked={autoImproveEnabled}
                      onCheckedChange={toggleAutoImprovement}
                    />
                    <Label htmlFor="auto-improve">
                      Enable auto-improvement
                    </Label>
                  </div>
                  
                  <Button 
                    onClick={runAgentTask}
                    disabled={!agentTask.trim() || isProcessing}
                    className="gap-2"
                  >
                    <Rocket className="h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Run Task'}
                  </Button>
                </div>
                
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-medium">
                      Task Execution Log
                    </Label>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearTaskLog}
                      disabled={taskLog.length === 0}
                    >
                      Clear Log
                    </Button>
                  </div>
                  
                  <div className="bg-gray-900 text-gray-100 rounded-md p-4 h-60 overflow-auto font-mono text-sm">
                    {taskLog.length > 0 ? (
                      taskLog.map((entry, index) => (
                        <div key={index} className="mb-1">
                          {entry}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 italic">
                        No tasks executed yet. Run a task to see the execution log.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Memory Tab */}
            <TabsContent value="memory">
              <MemoryExplorer />
            </TabsContent>
            
            {/* Improvements Tab */}
            <TabsContent value="improvements">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Agent Performance Metrics</h3>
                  
                  <Button variant="outline" className="gap-2" onClick={loadAgentData}>
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
                
                {metrics ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(metrics).map(([key, metric]) => (
                      <Card key={key} className="cyberborder-sm">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base capitalize">{key}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{metric.value.toFixed(2)}</div>
                          {metric.previousValue && (
                            <div className="text-sm text-muted-foreground">
                              Previous: {metric.previousValue.toFixed(2)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="cyberborder-sm bg-muted/20">
                    <CardContent className="flex flex-col items-center py-12 gap-4">
                      <Brain className="h-12 w-12 text-muted-foreground opacity-30" />
                      <p className="text-center text-muted-foreground">
                        No performance metrics available yet.
                        <br />
                        Execute tasks to generate performance data.
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Improvement Suggestions</h3>
                  
                  {improvements && improvements.length > 0 ? (
                    <div className="space-y-4">
                      {improvements.map((improvement, index) => (
                        <Card key={index} className="cyberborder-sm">
                          <CardHeader className="py-3">
                            <CardTitle className="text-base capitalize">
                              {improvement.dimension}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="list-disc pl-5 space-y-2">
                              {improvement.suggestions.map((suggestion, i) => (
                                <li key={i} className="text-sm">{suggestion}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="cyberborder-sm bg-muted/20">
                      <CardContent className="flex flex-col items-center py-10 gap-4">
                        <Settings2 className="h-12 w-12 text-muted-foreground opacity-30" />
                        <p className="text-center text-muted-foreground">
                          No improvement suggestions available.
                          <br />
                          Enable auto-improvement and run tasks to generate suggestions.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Voice Tab */}
            <TabsContent value="voice">
              <TtsControls />
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="justify-between border-t pt-4">
          <div className="text-sm text-cyber-black font-mono">
            {agentMemories.length} agent memories stored
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${autoImproveEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-sm">
              Auto-Improvement: {autoImproveEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}