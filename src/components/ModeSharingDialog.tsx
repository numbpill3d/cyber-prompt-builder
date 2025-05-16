import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { toast } from '@/hooks/use-toast';
import { modeSharingService } from '@/services/mode/mode-sharing';
import { modeService } from '@/services/mode/mode-service';
import { Mode } from '@/services/mode/mode-types';

interface ModeSharingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: Mode; // If provided, we're exporting this mode
}

const ModeSharingDialog: React.FC<ModeSharingDialogProps> = ({ 
  isOpen, 
  onClose,
  mode
}) => {
  const [activeTab, setActiveTab] = useState<string>(mode ? 'export' : 'import');
  const [exportedJson, setExportedJson] = useState<string>('');
  const [importJson, setImportJson] = useState<string>('');
  const [importUrl, setImportUrl] = useState<string>('');
  const [shareableUrl, setShareableUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Handle exporting a mode
  const handleExport = () => {
    if (!mode) return;
    
    try {
      setIsLoading(true);
      const json = modeSharingService.exportMode(mode.id);
      setExportedJson(json);
      
      // Generate shareable URL
      const url = modeSharingService.generateShareableUrl(mode.id);
      setShareableUrl(url);
      
      toast({
        title: 'Mode Exported',
        description: 'The mode has been exported successfully.',
      });
    } catch (error) {
      console.error('Failed to export mode:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while exporting the mode.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle importing a mode from JSON
  const handleImportFromJson = () => {
    if (!importJson.trim()) {
      toast({
        title: 'Import Failed',
        description: 'Please enter valid JSON data.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const newModeId = modeSharingService.importMode(importJson);
      const newMode = modeService.getMode(newModeId);
      
      toast({
        title: 'Mode Imported',
        description: `"${newMode?.name}" has been imported successfully.`,
      });
      
      // Clear the input
      setImportJson('');
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Failed to import mode:', error);
      toast({
        title: 'Import Failed',
        description: 'The provided JSON data is invalid or corrupted.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle importing a mode from URL
  const handleImportFromUrl = () => {
    if (!importUrl.trim()) {
      toast({
        title: 'Import Failed',
        description: 'Please enter a valid URL.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const newModeId = modeSharingService.importFromUrl(importUrl);
      const newMode = modeService.getMode(newModeId);
      
      toast({
        title: 'Mode Imported',
        description: `"${newMode?.name}" has been imported successfully.`,
      });
      
      // Clear the input
      setImportUrl('');
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Failed to import mode from URL:', error);
      toast({
        title: 'Import Failed',
        description: 'The provided URL is invalid or the mode data is corrupted.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle copying to clipboard
  const handleCopyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to Clipboard',
        description: successMessage,
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    });
  };
  
  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(mode ? 'export' : 'import');
      setExportedJson('');
      setShareableUrl('');
      
      // If a mode is provided, export it automatically
      if (mode) {
        handleExport();
      }
    }
  }, [isOpen, mode]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Mode Sharing</DialogTitle>
          <DialogDescription>
            Export your custom modes to share with others or import modes created by the community.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" disabled={!mode}>Export Mode</TabsTrigger>
            <TabsTrigger value="import">Import Mode</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4 mt-4">
            {mode && (
              <>
                <div className="space-y-2">
                  <Label>Mode JSON</Label>
                  <Textarea 
                    value={exportedJson} 
                    readOnly 
                    className="font-mono text-xs h-[200px]" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleCopyToClipboard(exportedJson, 'Mode JSON copied to clipboard.')}
                  >
                    <Icons.Copy className="h-4 w-4 mr-2" />
                    Copy JSON
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Shareable URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={shareableUrl} 
                      readOnly 
                      className="font-mono text-xs" 
                    />
                    <Button 
                      variant="outline"
                      onClick={() => handleCopyToClipboard(shareableUrl, 'Shareable URL copied to clipboard.')}
                    >
                      <Icons.Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this URL with others to let them import your mode.
                  </p>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Import from JSON</Label>
                <Textarea 
                  value={importJson} 
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="Paste the exported mode JSON here..."
                  className="font-mono text-xs h-[150px]" 
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleImportFromJson}
                  disabled={isLoading || !importJson.trim()}
                >
                  {isLoading ? (
                    <Icons.Spinner className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Icons.Download className="h-4 w-4 mr-2" />
                  )}
                  Import from JSON
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Import from URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={importUrl} 
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="Paste a shareable mode URL here..."
                    className="font-mono text-xs" 
                  />
                  <Button 
                    variant="outline"
                    onClick={handleImportFromUrl}
                    disabled={isLoading || !importUrl.trim()}
                  >
                    {isLoading ? (
                      <Icons.Spinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icons.Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModeSharingDialog;
