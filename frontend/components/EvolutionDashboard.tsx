import { useState, useEffect } from 'react';
import { useEvolutionService } from '@/hooks/use-evolution-service';
import { EvolutionMetrics, EvolutionReport } from '@/core/interfaces/evolution-engine';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart4, 
  Lightbulb,
  RefreshCcw
} from 'lucide-react';
import { LoadingSpinner } from './ui/loading-spinner';

export default function EvolutionDashboard() {
  // Service hook
  const { evolutionService, isLoading: isServiceLoading, error: serviceError } = useEvolutionService();
  
  // State
  const [report, setReport] = useState<EvolutionReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics');
  
  // Load data on mount
  useEffect(() => {
    if (evolutionService) {
      loadReport();
    }
  }, [evolutionService]);
  
  // Load report
  const loadReport = async () => {
    if (!evolutionService) return;
    
    try {
      setIsLoading(true);
      const latestReport = await evolutionService.getLatestReport('current-session');
      setReport(latestReport);
    } catch (err) {
      console.error('Failed to load evolution report:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate new report
  const handleGenerateReport = async () => {
    if (!evolutionService) return;
    
    try {
      setIsLoading(true);
      const newReport = await evolutionService.generateReport('current-session');
      setReport(newReport);
    } catch (err) {
      console.error('Failed to generate evolution report:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format metric value
  const formatMetricValue = (value: number) => {
    return value.toFixed(2);
  };
  
  // Get trend icon
  const getTrendIcon = (trend?: string) => {
    if (!trend) return <Minus className="h-4 w-4 text-gray-500" />;
    
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Loading state
  if (isServiceLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p>Loading Evolution Service...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (serviceError) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Evolution Service Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to initialize the Evolution Service. Check console for details.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full cyberborder ice-card hover-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-orbitron text-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
              Evolution Dashboard
            </CardTitle>
            <CardDescription>
              Monitor performance and track improvements
            </CardDescription>
          </div>
          
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-60 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : report ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="metrics" className="flex-1">
                <BarChart4 className="h-4 w-4 mr-2" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="improvements" className="flex-1">
                <Lightbulb className="h-4 w-4 mr-2" />
                Improvements
              </TabsTrigger>
            </TabsList>
            
            {/* Metrics Tab */}
            <TabsContent value="metrics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {Object.entries(report.metrics).map(([key, metric]) => (
                  <div key={key} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium capitalize">{key}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{formatMetricValue(metric.value)}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                    </div>
                    
                    <Progress value={metric.value * 20} className="h-2 mb-2" />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Previous: {metric.previousValue ? formatMetricValue(metric.previousValue) : 'N/A'}</span>
                      <span>Target: {metric.target ? formatMetricValue(metric.target) : 'N/A'}</span>
                    </div>
                  </div>
                ))}
                
                {/* Overall Score */}
                <div className="border rounded-md p-4 col-span-1 md:col-span-2 bg-muted/20">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">Overall Performance</div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold">{formatMetricValue(report.overallScore)}</span>
                      {report.previousScore && (
                        report.overallScore > report.previousScore 
                          ? <TrendingUp className="h-4 w-4 text-green-500" />
                          : report.overallScore < report.previousScore
                            ? <TrendingDown className="h-4 w-4 text-red-500" />
                            : <Minus className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                  
                  <Progress 
                    value={report.overallScore * 20} 
                    className="h-3 mb-2"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Previous: {report.previousScore ? formatMetricValue(report.previousScore) : 'N/A'}</span>
                    <span>Last Updated: {new Date(report.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Improvements Tab */}
            <TabsContent value="improvements">
              <div className="space-y-4 mt-4">
                {report.improvements.length > 0 ? (
                  report.improvements
                    .sort((a, b) => b.priority - a.priority)
                    .map((improvement, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-medium capitalize">
                              {improvement.dimension}
                            </CardTitle>
                            <Badge>
                              Priority: {improvement.priority}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="space-y-2">
                            {improvement.suggestions.map((suggestion, i) => (
                              <div key={i} className="text-sm">
                                • {suggestion}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                ) : (
                  <div className="h-40 flex items-center justify-center flex-col gap-2">
                    <Lightbulb className="h-12 w-12 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">No improvement suggestions available</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="h-60 flex items-center justify-center flex-col gap-2">
            <BarChart4 className="h-12 w-12 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No evolution data available</p>
            <Button onClick={handleGenerateReport} size="sm" className="mt-2">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Generate First Report
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="justify-between border-t pt-4">
        <div className="text-sm text-cyber-black font-mono">
          {report ? '1 report available' : 'No reports available'}
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {report ? new Date(report.timestamp).toLocaleString() : 'Never'}
        </div>
      </CardFooter>
    </Card>
  );
}