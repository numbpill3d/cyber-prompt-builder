import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { modeService } from '@/services/mode/mode-service';
import { Mode } from '@/services/mode/mode-types';
import { Icons } from '@/components/ui/icons';
import CustomModeEditor from './CustomModeEditor';

// Map of mode IDs to icon components
const modeIcons: Record<string, React.ReactNode> = {
  code: <Code className="h-4 w-4" />,
  architect: <Building2 className="h-4 w-4" />,
  ask: <HelpCircle className="h-4 w-4" />
};

interface ModeSelectorProps {
  className?: string;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ className }) => {
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [availableModes, setAvailableModes] = useState<Mode[]>([]);

  // Load modes on component mount
  useEffect(() => {
    const loadModes = () => {
      const modes = modeService.getAllModes();
      setAvailableModes(modes);

      const activeModeId = modeService.getActiveModeId();
      const currentMode = modeService.getMode(activeModeId);
      if (currentMode) {
        setActiveMode(currentMode);
      }
    };

    loadModes();

    // Subscribe to mode changes
    const handleModeChange = (event: any) => {
      const { currentMode, mode } = event;
      setActiveMode(mode);
    };

    modeService.onModeChange(handleModeChange);

    // Cleanup subscription on unmount
    return () => {
      modeService.offModeChange(handleModeChange);
    };
  }, []);

  // Handle mode selection
  const handleSelectMode = (modeId: string) => {
    try {
      const success = modeService.setActiveMode(modeId);
      if (success) {
        const mode = modeService.getMode(modeId);
        toast({
          title: `Switched to ${mode?.name}`,
          description: mode?.description,
        });
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

  // Handle creating a custom mode
  const handleCreateCustomMode = () => {
    // This would open a modal to create a custom mode
    // For now, just show a toast
    toast({
      title: 'Create Custom Mode',
      description: 'This would open a modal to create a custom mode.',
    });
  };

  // Get the icon for the current mode
  const getActiveIcon = () => {
    if (!activeMode) return <Code className="h-4 w-4" />;

    // Use predefined icon if available, otherwise use the first letter
    return modeIcons[activeMode.id] || (
      <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
        {activeMode.name.charAt(0)}
      </div>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1 h-8 px-2 font-normal", className)}
        >
          {getActiveIcon()}
          <span className="ml-1">{activeMode?.name || 'Code Mode'}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Mode</DropdownMenuLabel>

        {/* Default modes */}
        {availableModes
          .filter(mode => !mode.isCustom)
          .map(mode => (
            <DropdownMenuItem
              key={mode.id}
              onClick={() => handleSelectMode(mode.id)}
              className={cn(
                "gap-2",
                activeMode?.id === mode.id && "bg-accent text-accent-foreground"
              )}
            >
              {modeIcons[mode.id] || (
                <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
                  {mode.name.charAt(0)}
                </div>
              )}
              <span>{mode.name}</span>
            </DropdownMenuItem>
          ))
        }

        {/* Custom modes section */}
        {availableModes.some(mode => mode.isCustom) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Custom Modes</DropdownMenuLabel>

            {availableModes
              .filter(mode => mode.isCustom)
              .map(mode => (
                <DropdownMenuItem
                  key={mode.id}
                  onClick={() => handleSelectMode(mode.id)}
                  className={cn(
                    "gap-2",
                    activeMode?.id === mode.id && "bg-accent text-accent-foreground"
                  )}
                >
                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
                    {mode.name.charAt(0)}
                  </div>
                  <span>{mode.name}</span>
                </DropdownMenuItem>
              ))
            }
          </>
        )}

        <DropdownMenuSeparator />

        {/* Create custom mode option */}
        <DropdownMenuItem onClick={handleCreateCustomMode} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Create Custom Mode</span>
        </DropdownMenuItem>

        {/* Mode settings option */}
        <DropdownMenuItem
          onClick={() => window.location.href = '/settings?tab=modes'}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          <span>Mode Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModeSelector;
