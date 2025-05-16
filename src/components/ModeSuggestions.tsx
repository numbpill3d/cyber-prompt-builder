import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { toast } from '@/hooks/use-toast';
import { modeSuggestionsService, ModeSuggestion } from '@/services/mode/mode-suggestions';
import { modeService } from '@/services/mode/mode-service';
import { cn } from '@/lib/utils';

interface ModeSuggestionsProps {
  input?: string;
  fileExtension?: string;
  className?: string;
  onSelectMode?: (modeId: string) => void;
}

const ModeSuggestions: React.FC<ModeSuggestionsProps> = ({ 
  input = '',
  fileExtension,
  className,
  onSelectMode
}) => {
  const [suggestions, setSuggestions] = useState<ModeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Update suggestions when input or file extension changes
  useEffect(() => {
    const getSuggestions = () => {
      setIsLoading(true);
      
      try {
        let newSuggestions: ModeSuggestion[] = [];
        
        // Get suggestions from input if available
        if (input && input.length > 5) {
          const inputSuggestions = modeSuggestionsService.getSuggestionsFromInput(input, 2);
          newSuggestions.push(...inputSuggestions);
        }
        
        // Get suggestion from file extension if available
        if (fileExtension) {
          const extSuggestion = modeSuggestionsService.getSuggestionFromFileExtension(fileExtension);
          if (extSuggestion) {
            newSuggestions.push(extSuggestion);
          }
        }
        
        // If we don't have enough suggestions, get some from history
        if (newSuggestions.length < 3) {
          const historySuggestions = modeSuggestionsService.getSuggestionsFromHistory(3 - newSuggestions.length);
          newSuggestions.push(...historySuggestions);
        }
        
        // Remove duplicates
        const uniqueSuggestions: ModeSuggestion[] = [];
        const seenModeIds = new Set<string>();
        
        for (const suggestion of newSuggestions) {
          if (!seenModeIds.has(suggestion.mode.id)) {
            seenModeIds.add(suggestion.mode.id);
            uniqueSuggestions.push(suggestion);
          }
        }
        
        setSuggestions(uniqueSuggestions);
      } catch (error) {
        console.error('Failed to get mode suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getSuggestions();
  }, [input, fileExtension]);
  
  // Handle selecting a mode
  const handleSelectMode = (modeId: string) => {
    try {
      // Switch to the selected mode
      const success = modeService.setActiveMode(modeId);
      
      if (success) {
        const mode = modeService.getMode(modeId);
        toast({
          title: `Switched to ${mode?.name}`,
          description: mode?.description,
        });
        
        // Call the onSelectMode callback if provided
        if (onSelectMode) {
          onSelectMode(modeId);
        }
      }
    } catch (error) {
      console.error('Failed to switch mode:', error);
      toast({
        title: 'Failed to switch mode',
        description: 'An error occurred while switching modes.',
        variant: 'destructive',
      });
    }
  };
  
  // Get icon for a mode
  const getIconForMode = (modeId: string): React.ReactNode => {
    switch (modeId) {
      case 'code':
        return <Icons.Code className="h-4 w-4" />;
      case 'architect':
        return <Icons.Building2 className="h-4 w-4" />;
      case 'ask':
        return <Icons.HelpCircle className="h-4 w-4" />;
      case 'devops':
        return <Icons.Server className="h-4 w-4" />;
      case 'debug':
        return <Icons.Bug className="h-4 w-4" />;
      case 'test':
        return <Icons.TestTube className="h-4 w-4" />;
      default:
        return <Icons.Settings className="h-4 w-4" />;
    }
  };
  
  // If no suggestions, don't render anything
  if (suggestions.length === 0 && !isLoading) {
    return null;
  }
  
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Icons.Lightbulb className="h-4 w-4 text-yellow-500" />
            <span>Suggested Modes</span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-2">
              <Icons.Spinner className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.mode.id}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={() => handleSelectMode(suggestion.mode.id)}
                  title={suggestion.reason}
                >
                  {getIconForMode(suggestion.mode.id)}
                  <span>{suggestion.mode.name}</span>
                  {suggestion.confidence > 0.7 && (
                    <span className="ml-1 text-xs bg-primary/10 text-primary px-1 rounded">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  )}
                </Button>
              ))}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Suggestions based on your input and usage patterns.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModeSuggestions;
