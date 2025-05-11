import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { systemIntegration } from '../services/system-integration';

interface EvolutionDashboardProps {
  sessionId?: string;
  height?: string;
}

const EvolutionDashboard = ({ 
  sessionId,
  height = '500px'
}: EvolutionDashboardProps) => {
  const [activeTab, setActiveTab] = useState<string>('metrics');
  const [reports, setReports] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [improvements, setImprovements] = useState<any[]>([]);
  
  // Get evolution service from system integration
  const evolutionService = systemIntegration.getService<any>('evolution');
  const autoImprovementService = systemIntegration.getService<any>('autoImprovement');
  
  // Load evolution data on mount
  useEffect(() => {
    async function loadEvolutionData() {
      try {
        // Ensure the system is initialized
        await systemIntegration.initialize();
        
        if (sessionId) {
          // Load reports for session
          const sessionReports = await evolutionService.getSessionReports(sessionId);
          setReports(sessionReports);
          
          // Load latest report
          const latestReport = await evolutionService.getLatestReport(sessionId);
          if (latestReport) {
            setMetrics(latestReport.metrics);
            setImprovements(latestReport.improvements);
          }
          
          // Load improvement tasks
          const tasks = await autoImprovementService.getTasksForSession(sessionId);
          // We'll use these later
        }
      } catch (error) {
        console.error('Failed to load evolution data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadEvolutionData();
  }, [sessionId]);
  
  // Generate a new evolution report
  const handleGenerateReport = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const report = await evolutionService.generateReport(sessionId);
      
      // Update state with new report data
      setReports([report, ...reports]);
      setMetrics(report.metrics);
      setImprovements(report.improvements);
    } catch (error) {
      console.error('Failed to generate evolution report:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Run an improvement cycle
  const handleRunImprovement = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      await systemIntegration.runImprovementCycle(sessionId);
      
      // Refresh data after improvement
      const latestReport = await evolutionService.getLatestReport(sessionId);
      if (latestReport) {
        setMetrics(latestReport.metrics);
        setImprovements(latestReport.improvements);
      }
    } catch (error) {
      console.error('Failed to run improvement cycle:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get color for metric value based on thresholds
  const getMetricColor = (value: number): string => {
    if (value >= 0.8) return 'text-green-600';
    if (value >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Get priority badge variant
  const getPriorityBadge = (priority: number): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 3: return 'destructive'; // High priority
      case 2: return 'secondary';   // Medium priority
      default: return 'outline';    // Low priority
    }
  };
  
  // Get priority label
  const getPriorityLabel = (priority: number): string => {
    switch (priority) {
      case 3: return 'High';
      case 2: return 'Medium';
      default: return 'Low';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Evolution Dashboard</CardTitle>
        <CardDescription>
          Monitor agent performance metrics and improvement suggestions
        </CardDescription>
        <div className="flex justify-between mt-2">
          <Button 
            onClick={handleGenerateReport} 
            variant="outline" 
            disabled={loading || !sessionId}
          >
            Generate Report
          </Button>
          <Button 
            onClick={handleRunImprovement} 
            variant="secondary" 
            disabled={loading || !sessionId}
          >
            Run Improvement Cycle
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pb-0 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
            <TabsTrigger value="improvements">Improvements</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-muted-foreground">Loading metrics...</div>
              </div>
            ) : Object.keys(metrics).length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-muted-foreground">No metrics available</div>
              </div>
            ) : (
              <ScrollArea style={{ height }} className="pr-4">
                <div className="space-y-4">
                  {Object.entries(metrics)
                    .filter(([key, value]) => typeof value === 'number' && key !== 'timestamp')
                    .map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="font-medium capitalize">{key}</div>
                          <div className={getMetricColor(value as number)}>
                            {(value as number).toFixed(2)}
                          </div>
                        </div>
                        <Progress value={(value as number) * 100} />
                      </div>
                    ))
                  }
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="improvements">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-muted-foreground">Loading improvements...</div>
              </div>
            ) : improvements.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-muted-foreground">No improvements suggested</div>
              </div>
            ) : (
              <ScrollArea style={{ height }} className="pr-4">
                <div className="space-y-4">
                  {improvements.map((improvement, index) => (
                    <Card key={index} className="shadow-sm">
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium capitalize">{improvement.dimension}</div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getPriorityBadge(improvement.priority) === 'destructive' ? 'bg-red-100 text-red-800' :
                            getPriorityBadge(improvement.priority) === 'secondary' ? 'bg-purple-100 text-purple-800' :
                            getPriorityBadge(improvement.priority) === 'default' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getPriorityLabel(improvement.priority)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2 px-4 space-y-2">
                        <div className="text-sm flex justify-between">
                          <span>Current: {improvement.currentValue.toFixed(2)}</span>
                          <span>Target: {improvement.targetValue.toFixed(2)}</span>
                        </div>
                        <Progress 
                          value={(improvement.currentValue / improvement.targetValue) * 100} 
                          max={100}
                        />
                        <div className="text-sm mt-2">
                          <strong>Suggestion:</strong> {improvement.suggestions[0]}
                        </div>
                      </CardContent>
                      <CardFooter className="py-2 px-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          disabled={improvement.implemented}
                        >
                          {improvement.implemented ? 'Implemented' : 'Implement'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-muted-foreground">Loading history...</div>
              </div>
            ) : reports.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-muted-foreground">No historical reports available</div>
              </div>
            ) : (
              <ScrollArea style={{ height }} className="pr-4">
                <div className="space-y-4">
                  {reports.map((report, index) => (
                    <Card key={index} className="shadow-sm">
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            Report {new Date(report.timestamp).toLocaleDateString()}
                          </div>
                          <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Score: {report.score.toFixed(2)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2 px-4">
                        <div className="text-sm whitespace-pre-line">
                          {report.summary}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EvolutionDashboard;