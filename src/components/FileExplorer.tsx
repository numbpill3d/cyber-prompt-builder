import React, { useState, useEffect } from 'react';
import { FileInfo, FileSearchOptions } from '../core/interfaces/file-system';
import { fileSystemService } from '../services/file-system/file-system-service';
import { cn } from '../lib/utils';
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  RefreshCw, 
  Plus, 
  Trash, 
  Edit, 
  Download,
  X,
  FileText,
  Code,
  Image,
  Package,
  Coffee,
  FileJson
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from './ui/sonner';
import { Textarea } from './ui/textarea';

interface FileExplorerProps {
  className?: string;
  basePath?: string;
  onFileSelect?: (file: FileInfo) => void;
  height?: string;
  showToolbar?: boolean;
  allowEditing?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  className,
  basePath = '/',
  onFileSelect,
  height = '400px',
  showToolbar = true,
  allowEditing = true
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [currentPath, setCurrentPath] = useState(basePath);
  
  // Dialog states
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [editFileContent, setEditFileContent] = useState('');
  
  // Load files on mount and when currentPath changes
  useEffect(() => {
    loadFiles();
  }, [currentPath]);
  
  const loadFiles = async () => {
    setIsLoading(true);
    
    try {
      await fileSystemService.initialize();
      
      if (searchQuery) {
        const searchOptions: FileSearchOptions = {
          recursive: true,
          searchPattern: searchQuery
        };
        
        const results = await fileSystemService.searchFiles(currentPath, searchOptions);
        setFiles(results.files);
      } else {
        const fileList = await fileSystemService.listDirectory(currentPath);
        setFiles(fileList);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles();
  };
  
  const toggleFolder = (folder: FileInfo) => {
    const newExpandedFolders = new Set(expandedFolders);
    
    if (newExpandedFolders.has(folder.path)) {
      newExpandedFolders.delete(folder.path);
    } else {
      newExpandedFolders.add(folder.path);
    }
    
    setExpandedFolders(newExpandedFolders);
  };
  
  const handleFileClick = (file: FileInfo) => {
    setSelectedFile(file);
    
    if (onFileSelect && !file.isDirectory) {
      onFileSelect(file);
    }
    
    if (file.isDirectory) {
      setCurrentPath(file.path);
    }
  };
  
  const handleCreateFile = async () => {
    if (!newFileName) {
      toast.error('File name is required');
      return;
    }
    
    try {
      const filePath = `${currentPath}/${newFileName}`;
      await fileSystemService.writeFile(filePath, newFileContent, { createDirectories: true });
      toast.success(`File ${newFileName} created`);
      setShowNewFileDialog(false);
      setNewFileName('');
      setNewFileContent('');
      loadFiles();
    } catch (error) {
      console.error('Failed to create file:', error);
      toast.error('Failed to create file');
    }
  };
  
  const handleCreateFolder = async () => {
    if (!newFileName) {
      toast.error('Folder name is required');
      return;
    }
    
    try {
      const folderPath = `${currentPath}/${newFileName}`;
      await fileSystemService.createDirectory(folderPath, true);
      toast.success(`Folder ${newFileName} created`);
      setShowNewFolderDialog(false);
      setNewFileName('');
      loadFiles();
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('Failed to create folder');
    }
  };
  
  const handleEditFile = async () => {
    if (!selectedFile) return;
    
    try {
      await fileSystemService.writeFile(selectedFile.path, editFileContent, { overwrite: true });
      toast.success(`File ${selectedFile.name} updated`);
      setShowEditDialog(false);
      loadFiles();
    } catch (error) {
      console.error('Failed to update file:', error);
      toast.error('Failed to update file');
    }
  };
  
  const handleDeleteFile = async () => {
    if (!selectedFile) return;
    
    try {
      if (selectedFile.isDirectory) {
        await fileSystemService.deleteDirectory(selectedFile.path, true);
        toast.success(`Folder ${selectedFile.name} deleted`);
      } else {
        await fileSystemService.deleteFile(selectedFile.path);
        toast.success(`File ${selectedFile.name} deleted`);
      }
      
      setShowDeleteDialog(false);
      setSelectedFile(null);
      loadFiles();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete');
    }
  };
  
  const handleOpenEditDialog = async (file: FileInfo) => {
    if (file.isDirectory) return;
    
    try {
      const content = await fileSystemService.readFile(file.path);
      setEditFileContent(content);
      setSelectedFile(file);
      setShowEditDialog(true);
    } catch (error) {
      console.error('Failed to read file:', error);
      toast.error('Failed to read file');
    }
  };
  
  const handleDownloadFile = async (file: FileInfo) => {
    if (file.isDirectory) return;
    
    try {
      const content = await fileSystemService.readFile(file.path);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('Failed to download file');
    }
  };
  
  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parentPath);
  };
  
  // Get appropriate icon for file type
  const getFileIcon = (file: FileInfo) => {
    if (file.isDirectory) {
      return <Folder size={18} className="text-yellow-400" />;
    }
    
    const extension = file.extension?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return <Coffee size={18} className="text-yellow-600" />;
      case 'ts':
      case 'tsx':
        return <Code size={18} className="text-blue-500" />;
      case 'json':
        return <FileJson size={18} className="text-green-500" />;
      case 'html':
        return <Code size={18} className="text-orange-500" />;
      case 'css':
      case 'scss':
        return <Code size={18} className="text-purple-500" />;
      case 'md':
        return <FileText size={18} className="text-gray-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image size={18} className="text-pink-500" />;
      case 'zip':
      case 'tar':
      case 'gz':
        return <Package size={18} className="text-gray-500" />;
      default:
        return <File size={18} className="text-gray-400" />;
    }
  };
  
  return (
    <div 
      className={cn(
        "border border-cyber-bright-blue rounded-md flex flex-col bg-black bg-opacity-90",
        className
      )}
      style={{ height }}
    >
      {showToolbar && (
        <div className="flex items-center justify-between p-2 border-b border-cyber-bright-blue">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-cyber-bright-blue"
              onClick={navigateUp}
              disabled={currentPath === '/'}
            >
              <ChevronUp size={16} />
            </Button>
            <span className="text-cyber-bright-blue font-mono text-sm truncate">
              {currentPath}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {allowEditing && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-cyber-bright-blue"
                  onClick={() => setShowNewFileDialog(true)}
                >
                  <FileText size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-cyber-bright-blue"
                  onClick={() => setShowNewFolderDialog(true)}
                >
                  <Folder size={16} />
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-cyber-bright-blue"
              onClick={loadFiles}
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSearch} className="p-2 border-b border-cyber-bright-blue">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 bg-transparent border-cyber-bright-blue text-white"
          />
          <Button 
            type="submit" 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-cyber-bright-blue"
          >
            <Search size={16} />
          </Button>
        </div>
      </form>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {files.length === 0 ? (
            <div className="text-center text-gray-400 py-4">
              {isLoading ? 'Loading...' : 'No files found'}
            </div>
          ) : (
            <div className="space-y-1">
              {files
                .sort((a, b) => {
                  // Directories first, then files
                  if (a.isDirectory && !b.isDirectory) return -1;
                  if (!a.isDirectory && b.isDirectory) return 1;
                  // Alphabetical order
                  return a.name.localeCompare(b.name);
                })
                .map((file) => (
                  <div 
                    key={file.path}
                    className={cn(
                      "flex items-center p-1 rounded hover:bg-gray-800 cursor-pointer group",
                      selectedFile?.path === file.path && "bg-gray-800"
                    )}
                  >
                    <div 
                      className="flex-1 flex items-center gap-2"
                      onClick={() => handleFileClick(file)}
                    >
                      {file.isDirectory && (
                        <button
                          className="text-gray-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFolder(file);
                          }}
                        >
                          {expandedFolders.has(file.path) ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      )}
                      {getFileIcon(file)}
                      <span className="text-white truncate">{file.name}</span>
                    </div>
                    
                    {allowEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center">
                        {!file.isDirectory && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-gray-400 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDialog(file);
                            }}
                          >
                            <Edit size={14} />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-gray-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!file.isDirectory) {
                              handleDownloadFile(file);
                            }
                          }}
                          disabled={file.isDirectory}
                        >
                          <Download size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-gray-400 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(file);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">File Name</label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="example.js"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="File content..."
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFile}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Folder Name</label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="my-folder"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit File Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit {selectedFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={editFileContent}
              onChange={(e) => setEditFileContent(e.target.value)}
              rows={20}
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditFile}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete {selectedFile?.name}?</p>
            {selectedFile?.isDirectory && (
              <p className="text-red-500 mt-2">
                This will delete the folder and all its contents!
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFile}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileExplorer;

// Helper component for ChevronUp icon
const ChevronUp = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);
