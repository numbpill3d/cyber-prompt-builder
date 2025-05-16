import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Mode } from '@/services/mode/mode-types';
import { modeService } from '@/services/mode/mode-service';
import { ResponseFormat, ResponseTone } from '@/services/prompt-builder/layers/user-preferences-layer';
import { toast } from '@/hooks/use-toast';
import { Icons } from '@/components/ui/icons';

interface CustomModeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editMode?: Mode; // If provided, we're editing an existing mode
}

const AVAILABLE_ICONS = [
  'Code', 'Terminal', 'Building2', 'HelpCircle', 'FileCode', 'Layers', 
  'Cpu', 'Database', 'Server', 'Bug', 'TestTube', 'Wrench', 'Settings'
];

const CustomModeEditor: React.FC<CustomModeEditorProps> = ({ 
  isOpen, 
  onClose,
  editMode 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Code');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [tone, setTone] = useState<ResponseTone>(ResponseTone.TECHNICAL);
  const [format, setFormat] = useState<ResponseFormat>(ResponseFormat.CODE_FOCUSED);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [includeExamples, setIncludeExamples] = useState(true);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load mode data if editing
  useEffect(() => {
    if (editMode) {
      setName(editMode.name);
      setDescription(editMode.description);
      setIcon(editMode.icon);
      setSystemPrompt(editMode.systemPrompt);
      setTone(editMode.userPreferences.tone);
      setFormat(editMode.userPreferences.format);
      setIncludeExplanations(editMode.userPreferences.includeExplanations);
      setIncludeExamples(editMode.userPreferences.includeExamples);
      setCustomInstructions(editMode.userPreferences.customInstructions || '');
    } else {
      // Reset form for new mode
      resetForm();
    }
  }, [editMode, isOpen]);
  
  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('Code');
    setSystemPrompt('You are a helpful AI assistant specialized in software development.');
    setTone(ResponseTone.TECHNICAL);
    setFormat(ResponseFormat.CODE_FOCUSED);
    setIncludeExplanations(true);
    setIncludeExamples(true);
    setCustomInstructions('');
  };
  
  const handleSubmit = async () => {
    if (!name || !systemPrompt) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const modeData: Omit<Mode, 'id' | 'isCustom'> = {
        name,
        description,
        icon,
        systemPrompt,
        userPreferences: {
          tone,
          format,
          includeExplanations,
          includeExamples,
          customInstructions: customInstructions || undefined
        }
      };
      
      if (editMode) {
        // Update existing mode
        const success = modeService.updateCustomMode(editMode.id, modeData);
        if (success) {
          toast({
            title: "Mode updated",
            description: `${name} has been updated successfully.`,
          });
        }
      } else {
        // Create new mode
        const newModeId = modeService.createCustomMode(modeData);
        if (newModeId) {
          toast({
            title: "Mode created",
            description: `${name} has been created successfully.`,
          });
          
          // Switch to the new mode
          modeService.setActiveMode(newModeId);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save mode:', error);
      toast({
        title: "Failed to save mode",
        description: "An error occurred while saving the mode.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Edit Mode' : 'Create Custom Mode'}</DialogTitle>
          <DialogDescription>
            {editMode 
              ? 'Modify this mode to customize AI behavior for specific tasks.' 
              : 'Create a new mode to customize AI behavior for specific tasks.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name*
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., DevOps Mode"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Specialized in deployment and infrastructure"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icon
            </Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ICONS.map((iconName) => (
                  <SelectItem key={iconName} value={iconName}>
                    <div className="flex items-center gap-2">
                      {React.createElement(Icons[iconName], { className: "h-4 w-4" })}
                      <span>{iconName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="systemPrompt" className="text-right pt-2">
              System Prompt*
            </Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="col-span-3 min-h-[100px]"
              placeholder="Define the AI's role and behavior..."
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tone" className="text-right">
              Tone
            </Label>
            <Select value={tone} onValueChange={(value) => setTone(value as ResponseTone)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ResponseTone).map((toneValue) => (
                  <SelectItem key={toneValue} value={toneValue}>
                    {toneValue.charAt(0).toUpperCase() + toneValue.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select value={format} onValueChange={(value) => setFormat(value as ResponseFormat)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a format" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ResponseFormat).map((formatValue) => (
                  <SelectItem key={formatValue} value={formatValue}>
                    {formatValue.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Include Explanations
            </Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={includeExplanations}
                onCheckedChange={setIncludeExplanations}
              />
              <span className="text-sm text-muted-foreground">
                {includeExplanations ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Include Examples
            </Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={includeExamples}
                onCheckedChange={setIncludeExamples}
              />
              <span className="text-sm text-muted-foreground">
                {includeExamples ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="customInstructions" className="text-right pt-2">
              Custom Instructions
            </Label>
            <Textarea
              id="customInstructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="col-span-3"
              placeholder="Additional instructions for the AI..."
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              editMode ? 'Update Mode' : 'Create Mode'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomModeEditor;
