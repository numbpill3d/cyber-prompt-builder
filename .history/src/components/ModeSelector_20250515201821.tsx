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
  code: <Icons.Code className="h-4 w-4" />,
  architect: <Icons.Building2 className="h-4 w-4" />,
  ask: <Icons.HelpCircle className="h-4 w-4" />
};

interface ModeSelectorProps {
  className?: string;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ className }) => {
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [availableModes, setAvailableModes] = useState<Mode[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMode, setEditingMode] = useState<Mode | undefined>(undefined);

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

      // Refresh available modes list
      loadModes();
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
    setEditingMode(undefined);
    setIsEditorOpen(true);
  };

  // Handle editing a custom mode
  const handleEditMode = (mode: Mode) => {
    setEditingMode(mode);
    setIsEditorOpen(true);
  };

  // Handle deleting a custom mode
  const handleDeleteMode = (modeId: string) => {
    try {
      if (confirm('Are you sure you want to delete this mode? This action cannot be undone.')) {
        const success = modeService.deleteCustomMode(modeId);
        if (success) {
          toast({
            title: 'Mode deleted',
            description: 'The custom mode has been deleted.',
          });

          // Refresh available modes
          const modes = modeService.getAllModes();
          setAvailableModes(modes);
        }
      }
    } catch (error) {
      console.error('Failed to delete mode:', error);
      toast({
        title: 'Failed to delete mode',
        description: 'An error occurred while deleting the mode.',
        variant: 'destructive',
      });
    }
  };

  // Get the icon for the current mode
  const getActiveIcon = () => {
    if (!activeMode) return <Icons.Code className="h-4 w-4" />;

    // Use predefined icon if available, otherwise use the first letter
    return modeIcons[activeMode.id] || (
      <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
        {activeMode.name.charAt(0)}
      </div>
    );
  };

  // Get icon component for a mode
  const getModeIcon = (mode: Mode) => {
    // Check if we have a predefined icon
    if (mode.icon && Icons[mode.icon as keyof typeof Icons]) {
      const IconComponent = Icons[mode.icon as keyof typeof Icons];
      return <IconComponent className="h-4 w-4" />;
    }

    // Use predefined icon mapping if available
    if (modeIcons[mode.id]) {
      return modeIcons[mode.id];
    }

    // Fallback to first letter
    return (
      <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
        {mode.name.charAt(0)}
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
              {getModeIcon(mode)}
              <span>{mode.name}</span>
              {mode.description && (
                <span className="ml-auto text-xs text-muted-foreground truncate max-w-[100px]">
                  {mode.description}
                </span>
              )}
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
                <div key={mode.id} className="relative group">
                  <DropdownMenuItem
                    onClick={() => handleSelectMode(mode.id)}
                    className={cn(
                      "gap-2 pr-10",
                      activeMode?.id === mode.id && "bg-accent text-accent-foreground"
                    )}
                  >
                    {getModeIcon(mode)}
                    <span>{mode.name}</span>
                    {mode.description && (
                      <span className="ml-auto text-xs text-muted-foreground truncate max-w-[80px]">
                        {mode.description}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMode(mode);
                      }}
                    >
                      <Icons.Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMode(mode.id);
                      }}
                    >
                      <Icons.Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
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
