import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { modeAnalyticsService, ModeUsageStats } from '@/services/mode/mode-analytics';
import { modeService } from '@/services/mode/mode-service';
import { Mode } from '@/services/mode/mode-types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ModeAnalyticsDashboardProps {
  className?: string;
}

const ModeAnalyticsDashboard: React.FC<ModeAnalyticsDashboardProps> = ({ className }) => {
  const [modeStats, setModeStats] = useState<ModeUsageStats[]>([]);
  const [summary, setSummary] = useState<{
    totalUsageCount: number;
    mostUsedMode: Mode | null;
    lastActiveMode: Mode | null;
    lastModeSwitch: Date | null;
  }>({
    totalUsageCount: 0,
    mostUsedMode: null,
    lastActiveMode: null,
    lastModeSwitch: null
  });
  
  // Load analytics data
  useEffect(() => {
    const loadAnalytics = () => {
      const stats = modeAnalyticsService.getAllModeStats();
      const summary = modeAnalyticsService.getAnalyticsSummary();
      
      setModeStats(stats);
      setSummary(summary);
    };
    
    loadAnalytics();
    
    // Subscribe to mode changes to refresh data
    const handleModeChange = () => {
      loadAnalytics();
    };
    
    modeService.onModeChange(handleModeChange);
    
    return () => {
      modeService.offModeChange(handleModeChange);
    };
  }, []);
  
  // Handle resetting analytics
  const handleResetAnalytics = () => {
    if (confirm('Are you sure you want to reset all mode analytics data? This action cannot be undone.')) {
      modeAnalyticsService.resetAnalytics();
      
      // Refresh data
      setModeStats(modeAnalyticsService.getAllModeStats());
      setSummary(modeAnalyticsService.getAnalyticsSummary());
      
      toast({
        title: 'Analytics Reset',
        description: 'All mode analytics data has been reset.',
      });
    }
  };
  
  // Format duration in seconds to a readable format
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`;
    } else {
      return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
    }
  };
  
  // Format date to a readable format
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    
    // If today, show time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If this year, show month and day
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString();
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Mode Analytics</h2>
        <Button variant="outline" onClick={handleResetAnalytics}>
          <Icons.RefreshCw className="h-4 w-4 mr-2" />
          Reset Analytics
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Mode Switches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalUsageCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Used Mode</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.mostUsedMode ? (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{summary.mostUsedMode.name}</div>
              </div>
            ) : (
              <div className="text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Mode Switch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(summary.lastModeSwitch)}</div>
            {summary.lastActiveMode && (
              <div className="text-sm text-muted-foreground">
                Switched to {summary.lastActiveMode.name}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Mode Usage Stats */}
      <h3 className="text-xl font-bold tracking-tight mt-8">Mode Usage Statistics</h3>
      
      {modeStats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modeStats
            .sort((a, b) => b.usageCount - a.usageCount)
            .map(stats => {
              const mode = modeService.getMode(stats.modeId);
              if (!mode) return null;
              
              const mostCommonTask = modeAnalyticsService.getMostCommonTaskType(stats.modeId);
              
              return (
                <Card key={stats.modeId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {getIconForMode(mode)}
                      {mode.name}
                    </CardTitle>
                    <CardDescription>{mode.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Usage Count:</span>
                        <span className="font-medium">{stats.usageCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average Duration:</span>
                        <span className="font-medium">{formatDuration(stats.averageDuration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last Used:</span>
                        <span className="font-medium">{formatDate(stats.lastUsed)}</span>
                      </div>
                      {mostCommonTask && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Most Common Task:</span>
                          <span className="font-medium">{mostCommonTask}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <Icons.BarChart className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No mode usage data available yet. Start using different modes to collect analytics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function to get icon for a mode
const getIconForMode = (mode: Mode): React.ReactNode => {
  if (mode.icon && Icons[mode.icon as keyof typeof Icons]) {
    const IconComponent = Icons[mode.icon as keyof typeof Icons];
    return <IconComponent className="h-5 w-5" />;
  }
  
  // Default icons based on mode ID
  if (mode.id === 'code') return <Icons.Code className="h-5 w-5" />;
  if (mode.id === 'architect') return <Icons.Building2 className="h-5 w-5" />;
  if (mode.id === 'ask') return <Icons.HelpCircle className="h-5 w-5" />;
  
  // Fallback to first letter
  return (
    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
      {mode.name.charAt(0)}
    </div>
  );
};

export default ModeAnalyticsDashboard;
