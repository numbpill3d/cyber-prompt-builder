import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { systemIntegration } from '../services/system-integration';
import EvolutionDashboard from '../components/EvolutionDashboard';
import TtsControls from '../components/TtsControls';

const AgentLab = () => {
  const [activeSession, setActiveSession] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Initialize system integration
  const handleInitialize = async () => {
    try {
      await systemIntegration.initialize();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize system:', error);
    }
  };
  
  // Create test session for experimentation
  const createTestSession = () => {
    // In a real implementation, this would create a session using the conversation service
    const sessionId = `test-session-${Date.now()}`;
    setActiveSession(sessionId);
    return sessionId;
  };
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Lab</h1>
          <p className="text-muted-foreground">
            Explore and experiment with integrated agent capabilities
          </p>
        </div>
        
        {!isInitialized ? (
          <Button onClick={handleInitialize}>Initialize System</Button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-muted-foreground">System initialized</span>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>System Components</CardTitle>
            <CardDescription>
              Components available in this integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(systemIntegration.getServiceRegistry())
                .map(([name, service]) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="font-medium capitalize">{name}</div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${service ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs text-muted-foreground">
                        {service ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
            
            <Button 
              onClick={createTestSession} 
              variant="outline" 
              className="w-full mt-6"
              disabled={!isInitialized}
            >
              Create Test Session
            </Button>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Agent Experimentation</CardTitle>
            <CardDescription>
              Test and explore agent capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="memory">
              <TabsList className="mb-4">
                <TabsTrigger value="memory">Memory</TabsTrigger>
                <TabsTrigger value="evolution">Evolution</TabsTrigger>
                <TabsTrigger value="tts">TTS</TabsTrigger>
              </TabsList>
              
              <TabsContent value="memory">
                <div className="text-sm text-muted-foreground mb-4">
                  Explore and manage agent memory
                </div>
                
                {/* Memory Explorer would go here */}
                <div className="border rounded-md p-8 text-center">
                  Memory Explorer Component Placeholder
                </div>
              </TabsContent>
              
              <TabsContent value="evolution">
                <div className="text-sm text-muted-foreground mb-4">
                  Monitor agent evolution and performance
                </div>
                
                <EvolutionDashboard 
                  sessionId={activeSession} 
                  height="400px"
                />
              </TabsContent>
              
              <TabsContent value="tts">
                <div className="text-sm text-muted-foreground mb-4">
                  Text-to-speech controls and settings
                </div>
                
                <TtsControls 
                  initialText="Welcome to the Agent Lab, where you can experiment with various agent capabilities and integrations."
                  compact={false}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Separator />
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Agent Actions</CardTitle>
          <CardDescription>
            Perform agent actions and view results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              disabled={!isInitialized || !activeSession}
              onClick={() => {
                if (activeSession) {
                  systemIntegration.runImprovementCycle(activeSession);
                }
              }}
            >
              Run Improvement Cycle
            </Button>
            
            <Button 
              variant="outline" 
              disabled={!isInitialized || !activeSession}
              onClick={() => {
                if (activeSession) {
                  systemIntegration.getService('tts').speak(
                    "Running agent diagnostic test. All systems operational."
                  );
                }
              }}
            >
              Run Diagnostic Test
            </Button>
            
            <Button 
              variant="outline" 
              disabled={!isInitialized || !activeSession}
              onClick={() => {
                if (activeSession) {
                  systemIntegration.getCombinedContext(
                    "Agent capabilities test", activeSession
                  );
                }
              }}
            >
              Retrieve Context
            </Button>
            
            <Button 
              variant="outline" 
              disabled={!isInitialized || !activeSession}
              onClick={() => {
                if (activeSession) {
                  // Just a demonstration button
                  console.log("Agent action triggered for session:", activeSession);
                }
              }}
            >
              Process Response
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentLab;