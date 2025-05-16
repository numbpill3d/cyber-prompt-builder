import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { toast } from '@/hooks/use-toast';
import { modeTemplatesService, ModeTemplate } from '@/services/mode/mode-templates';
import { modeService } from '@/services/mode/mode-service';
import { cn } from '@/lib/utils';

interface ModeTemplatesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onModeCreated?: (modeId: string) => void;
}

const ModeTemplatesDialog: React.FC<ModeTemplatesDialogProps> = ({ 
  isOpen, 
  onClose,
  onModeCreated
}) => {
  const [templates, setTemplates] = useState<ModeTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ModeTemplate | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  
  // Load templates when dialog opens
  useEffect(() => {
    if (isOpen) {
      const allTemplates = modeTemplatesService.getAllTemplates();
      setTemplates(allTemplates);
      setSelectedTemplate(null);
      setCustomName('');
    }
  }, [isOpen]);
  
  // Update custom name when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      setCustomName(selectedTemplate.name);
    } else {
      setCustomName('');
    }
  }, [selectedTemplate]);
  
  // Handle selecting a template
  const handleSelectTemplate = (template: ModeTemplate) => {
    setSelectedTemplate(template);
  };
  
  // Handle creating a mode from the selected template
  const handleCreateMode = () => {
    if (!selectedTemplate) {
      toast({
        title: 'No Template Selected',
        description: 'Please select a template to create a mode.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!customName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your mode.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Create customizations
      const customizations = {
        name: customName.trim()
      };
      
      // Create mode from template
      const newModeId = modeTemplatesService.createModeFromTemplate(
        selectedTemplate.id,
        customizations
      );
      
      // Get the created mode
      const newMode = modeService.getMode(newModeId);
      
      toast({
        title: 'Mode Created',
        description: `"${newMode?.name}" has been created successfully.`,
      });
      
      // Call the onModeCreated callback if provided
      if (onModeCreated) {
        onModeCreated(newModeId);
      }
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Failed to create mode from template:', error);
      toast({
        title: 'Creation Failed',
        description: 'An error occurred while creating the mode.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Get icon component for a template
  const getIconForTemplate = (template: ModeTemplate): React.ReactNode => {
    if (template.icon && Icons[template.icon as keyof typeof Icons]) {
      const IconComponent = Icons[template.icon as keyof typeof Icons];
      return <IconComponent className="h-5 w-5" />;
    }
    
    // Fallback to first letter
    return (
      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
        {template.name.charAt(0)}
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mode Templates</DialogTitle>
          <DialogDescription>
            Choose a template to quickly create a specialized mode.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Available Templates</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
                    selectedTemplate?.id === template.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      {getIconForTemplate(template)}
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Template Details</h3>
            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customName">Mode Name</Label>
                  <Input
                    id="customName"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter a name for your mode"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>System Prompt</Label>
                  <div className="p-3 bg-muted rounded-md text-xs max-h-[150px] overflow-y-auto">
                    {selectedTemplate.systemPrompt}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tone</Label>
                    <div className="text-sm">{selectedTemplate.userPreferences.tone}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Format</Label>
                    <div className="text-sm">{selectedTemplate.userPreferences.format.replace(/_/g, ' ')}</div>
                  </div>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={handleCreateMode}
                  disabled={isCreating || !customName.trim()}
                >
                  {isCreating ? (
                    <>
                      <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Icons.Plus className="mr-2 h-4 w-4" />
                      Create Mode
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Icons.LayoutTemplate className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select a template from the list to see details and create a mode.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModeTemplatesDialog;
