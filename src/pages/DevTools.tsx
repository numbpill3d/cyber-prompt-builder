import React, { useState } from 'react';
import { Terminal } from '../components/Terminal';
import { FileExplorer } from '../components/FileExplorer';
import { FileInfo } from '../core/interfaces/file-system';
import useFileSystem from '../hooks/useFileSystem';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { toast } from '../components/ui/sonner';
import { Layout } from '../components/Layout';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Folder, Terminal as TerminalIcon, Save, RefreshCw, Play, Download } from 'lucide-react';

/**
 * Developer Tools Page
 * Showcases the file system and terminal functionality
 */
export default function DevTools() {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [filePath, setFilePath] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('file-explorer');
  const { readFile, writeFile, isLoading } = useFileSystem();

  // Handle file selection
  const handleFileSelect = async (file: FileInfo) => {
    if (file.isDirectory) return;
    
    setSelectedFile(file);
    setFilePath(file.path);
    
    try {
      const content = await readFile(file.path);
      setFileContent(content);
      toast.success(`Loaded ${file.name}`);
    } catch (error) {
      toast.error(`Failed to load file: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handle file save
  const handleSaveFile = async () => {
    if (!filePath) {
      toast.error('Please enter a file path');
      return;
    }
    
    try {
      await writeFile(filePath, fileContent, { createDirectories: true, overwrite: true });
      toast.success(`Saved ${filePath}`);
    } catch (error) {
      toast.error(`Failed to save file: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Developer Tools</h1>
              <p className="text-muted-foreground">
                Explore and manage project files, execute commands, and more.
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-[400px]">
              <TabsTrigger value="file-explorer" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                File Explorer
              </TabsTrigger>
              <TabsTrigger value="terminal" className="flex items-center gap-2">
                <TerminalIcon className="h-4 w-4" />
                Terminal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file-explorer" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>File Explorer</CardTitle>
                    <CardDescription>
                      Browse and manage project files
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileExplorer 
                      height="500px" 
                      onFileSelect={handleFileSelect}
                      basePath="/"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>File Editor</CardTitle>
                    <CardDescription>
                      View and edit file content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label htmlFor="file-path">File Path</Label>
                          <Input 
                            id="file-path"
                            value={filePath} 
                            onChange={(e) => setFilePath(e.target.value)}
                            placeholder="Enter file path..."
                          />
                        </div>
                        <div className="pt-6">
                          <Button 
                            onClick={handleSaveFile}
                            disabled={isLoading || !filePath}
                            className="flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="file-content">Content</Label>
                        <Textarea 
                          id="file-content"
                          value={fileContent} 
                          onChange={(e) => setFileContent(e.target.value)}
                          placeholder="File content..."
                          className="font-mono h-[400px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="terminal" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Terminal</CardTitle>
                  <CardDescription>
                    Execute commands and view output
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Terminal height="500px" showHeader={true} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
