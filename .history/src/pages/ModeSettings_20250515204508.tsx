import React, { useState, useEffect } from 'react';
import { MainLayout, MainHeader } from '@/ui/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/ui/icons';
import { modeService } from '@/services/mode/mode-service';
import { Mode } from '@/services/mode/mode-types';
import CustomModeEditor from '@/components/CustomModeEditor';
import ModeDocumentation from '@/components/ModeDocumentation';
import ModeAnalyticsDashboard from '@/components/ModeAnalyticsDashboard';
import ModeSharingDialog from '@/components/ModeSharingDialog';
import ModeTemplatesDialog from '@/components/ModeTemplatesDialog';
import { toast } from '@/hooks/use-toast';

const ModeSettings: React.FC = () => {
  const [modes, setModes] = useState<Mode[]>([]);
  const [activeMode, setActiveMode] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSharingOpen, setIsSharingOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [editingMode, setEditingMode] = useState<Mode | undefined>(undefined);
  const [sharingMode, setSharingMode] = useState<Mode | undefined>(undefined);

  // Load modes on component mount
  useEffect(() => {
    const loadModes = () => {
      const allModes = modeService.getAllModes();
      setModes(allModes);

      const activeModeId = modeService.getActiveModeId();
      setActiveMode(activeModeId);
    };

    loadModes();

    // Subscribe to mode changes
    const handleModeChange = (event: any) => {
      setActiveMode(event.currentMode);
      loadModes();
    };

    modeService.onModeChange(handleModeChange);

    // Cleanup subscription on unmount
    return () => {
      modeService.offModeChange(handleModeChange);
    };
  }, []);

  // Handle creating a custom mode
  const handleCreateMode = () => {
    setEditingMode(undefined);
    setIsEditorOpen(true);
  };

  // Handle creating a mode from template
  const handleCreateFromTemplate = () => {
    setIsTemplatesOpen(true);
  };

  // Handle editing a mode
  const handleEditMode = (mode: Mode) => {
    setEditingMode(mode);
    setIsEditorOpen(true);
  };

  // Handle sharing a mode
  const handleShareMode = (mode: Mode) => {
    setSharingMode(mode);
    setIsSharingOpen(true);
  };

  // Handle importing a mode
  const handleImportMode = () => {
    setSharingMode(undefined);
    setIsSharingOpen(true);
  };

  // Handle deleting a mode
  const handleDeleteMode = (modeId: string) => {
    try {
      if (confirm('Are you sure you want to delete this mode? This action cannot be undone.')) {
        const success = modeService.deleteCustomMode(modeId);
        if (success) {
          toast({
            title: 'Mode deleted',
            description: 'The custom mode has been deleted.',
          });

          // Refresh modes list
          const allModes = modeService.getAllModes();
          setModes(allModes);
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

  // Handle activating a mode
  const handleActivateMode = (modeId: string) => {
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

  // Handle mode creation from template
  const handleModeCreatedFromTemplate = (modeId: string) => {
    // Refresh modes list
    const allModes = modeService.getAllModes();
    setModes(allModes);

    // Activate the new mode
    handleActivateMode(modeId);
  };

  return (
    <MainLayout
      header={
        <MainHeader>
          <div className="flex items-center gap-2">
            <Icons.Settings className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Mode Settings</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImportMode}>
              <Icons.Download className="h-4 w-4 mr-2" />
              Import Mode
            </Button>
            <Button variant="outline" onClick={handleCreateFromTemplate}>
              <Icons.LayoutTemplate className="h-4 w-4 mr-2" />
              From Template
            </Button>
            <Button onClick={handleCreateMode}>
              <Icons.Plus className="h-4 w-4 mr-2" />
              Create Mode
            </Button>
          </div>
        </MainHeader>
      }
    >
      <div className="container mx-auto py-6">
        <Tabs defaultValue="modes" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="modes">Manage Modes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="modes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Modes</CardTitle>
                <CardDescription>
                  These are the built-in modes that come with the application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modes
                    .filter(mode => !mode.isCustom)
                    .map(mode => (
                      <ModeCard
                        key={mode.id}
                        mode={mode}
                        isActive={activeMode === mode.id}
                        onActivate={handleActivateMode}
                        onEdit={handleEditMode}
                        onShare={handleShareMode}
                        onDelete={handleDeleteMode}
                      />
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Modes</CardTitle>
                <CardDescription>
                  These are your custom modes that you've created.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {modes.filter(mode => mode.isCustom).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modes
                      .filter(mode => mode.isCustom)
                      .map(mode => (
                        <ModeCard
                          key={mode.id}
                          mode={mode}
                          isActive={activeMode === mode.id}
                          onActivate={handleActivateMode}
                          onEdit={handleEditMode}
                          onShare={handleShareMode}
                          onDelete={handleDeleteMode}
                        />
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icons.Plus className="h-8 w-8 mx-auto mb-4 opacity-50" />
                    <p>You haven't created any custom modes yet.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={handleCreateMode}
                    >
                      Create Your First Custom Mode
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <ModeAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="templates">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Mode Templates</h2>
                <Button onClick={handleCreateFromTemplate}>
                  <Icons.Plus className="h-4 w-4 mr-2" />
                  Create From Template
                </Button>
              </div>

              <p className="text-muted-foreground">
                Templates provide pre-configured modes for specific tasks. Choose a template to quickly create a specialized mode.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {/* Template cards would be rendered here */}
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icons.Shield className="h-5 w-5" />
                      Security Expert
                    </CardTitle>
                    <CardDescription>
                      Focuses on application security and best practices
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleCreateFromTemplate}>
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icons.Zap className="h-5 w-5" />
                      Performance Optimizer
                    </CardTitle>
                    <CardDescription>
                      Specializes in optimizing code and system performance
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleCreateFromTemplate}>
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icons.FileText className="h-5 w-5" />
                      Documentation Writer
                    </CardTitle>
                    <CardDescription>
                      Creates clear, comprehensive documentation
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={handleCreateFromTemplate}>
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documentation">
            <ModeDocumentation />
          </TabsContent>
        </Tabs>
      </div>

      <CustomModeEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        editMode={editingMode}
      />
    </MainLayout>
  );
};

interface ModeCardProps {
  mode: Mode;
  isActive: boolean;
  onActivate: (modeId: string) => void;
  onEdit: (mode: Mode) => void;
  onShare: (mode: Mode) => void;
  onDelete: (modeId: string) => void;
}

const ModeCard: React.FC<ModeCardProps> = ({
  mode,
  isActive,
  onActivate,
  onEdit,
  onShare,
  onDelete
}) => {
  // Get the icon component
  const getIcon = () => {
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

  return (
    <Card className={cn(
      "border",
      isActive && "border-primary"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {getIcon()}
          {mode.name}
          {isActive && (
            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">
              Active
            </span>
          )}
        </CardTitle>
        <CardDescription className="line-clamp-2">{mode.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-xs text-muted-foreground">
          <div>Tone: {mode.userPreferences.tone}</div>
          <div>Format: {mode.userPreferences.format.replace(/_/g, ' ')}</div>
        </div>
      </CardContent>
      <div className="px-6 pb-4 pt-0 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onActivate(mode.id)}
          disabled={isActive}
        >
          {isActive ? 'Active' : 'Activate'}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(mode)}
            title="Edit Mode"
          >
            <Icons.Edit className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onShare(mode)}
            title="Share Mode"
          >
            <Icons.Share className="h-4 w-4" />
          </Button>

          {mode.isCustom && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(mode.id)}
              title="Delete Mode"
            >
              <Icons.Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// Helper function for conditional class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default ModeSettings;
