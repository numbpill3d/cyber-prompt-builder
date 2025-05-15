import { useState, useEffect } from 'react';
import { useMemoryService } from '@frontend/hooks/use-memory-service';
import { MemoryEntry, MemorySearchParams, MemoryType } from '@shared/interfaces/memory-engine';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@frontend/components/ui/card';
import { Button } from '@frontend/components/ui/button';
import { Input } from '@frontend/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@frontend/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';
import { Badge } from '@frontend/components/ui/badge';
import { Search, Filter, Trash2, Clock, Tag } from 'lucide-react';
import { LoadingSpinner } from './ui/loading-spinner';

export default function MemoryExplorer() {
  // Service hook
  const { memoryService, isLoading: isServiceLoading, error: serviceError } = useMemoryService();
  
  // State
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filterType, setFilterType] = useState<MemoryType | ''>('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  
  // Load collections on mount
  useEffect(() => {
    if (memoryService) {
      loadCollections();
    }
  }, [memoryService]);
  
  // Load memories when collection changes
  useEffect(() => {
    if (selectedCollection && memoryService) {
      searchMemories();
    }
  }, [selectedCollection, activeTab, filterType]);
  
  // Functions
  const loadCollections = async () => {
    if (!memoryService) return;
    
    try {
      setIsLoading(true);
      const collectionList = await memoryService.listCollections();
      setCollections(collectionList);
      
      if (collectionList.length > 0) {
        setSelectedCollection(collectionList[0]);
      }
    } catch (err) {
      setError('Failed to load memory collections');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const searchMemories = async () => {
    if (!memoryService || !selectedCollection) return;
    
    try {
      setIsLoading(true);
      
      const searchParams: MemorySearchParams = {
        query: searchQuery || undefined,
        types: filterType ? [filterType as MemoryType] : undefined,
        tags: filterTags.length > 0 ? filterTags : undefined,
        maxResults: 50,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      };
      
      const result = await memoryService.searchMemories(selectedCollection, searchParams);
      setMemories(result.entries);
    } catch (err) {
      setError('Failed to search memories');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = () => {
    searchMemories();
  };
  
  const handleDelete = async (id: string) => {
    if (!memoryService || !selectedCollection) return;
    
    try {
      await memoryService.deleteMemory(selectedCollection, id);
      setMemories(memories.filter(memory => memory.id !== id));
    } catch (err) {
      setError('Failed to delete memory');
      console.error(err);
    }
  };
  
  const handleFilterByType = (type: string) => {
    setFilterType(type as MemoryType || '');
  };
  
  const handleFilterByTag = (tag: string) => {
    if (filterTags.includes(tag)) {
      setFilterTags(filterTags.filter(t => t !== tag));
    } else {
      setFilterTags([...filterTags, tag]);
    }
  };
  
  const clearFilters = () => {
    setFilterType('');
    setFilterTags([]);
    setSearchQuery('');
  };
  
  // Memory type display names
  const memoryTypeNames: Record<MemoryType, string> = {
    [MemoryType.CONTEXT]: 'Context',
    [MemoryType.CODE]: 'Code',
    [MemoryType.CHAT]: 'Chat',
    [MemoryType.PROMPT]: 'Prompt',
    [MemoryType.RESPONSE]: 'Response',
    [MemoryType.USER_INPUT]: 'User Input',
    [MemoryType.METADATA]: 'Metadata'
  };
  
  // Get a list of all unique tags from memories
  const allTags = [...new Set(memories.flatMap(memory => memory.metadata.tags || []))];
  
  // Loading or error states
  if (isServiceLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p>Loading Memory Service...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (serviceError) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Memory Service Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to initialize the Memory Service. Check console for details.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full cyberborder ice-card hover-glow">
      <CardHeader>
        <CardTitle className="font-orbitron text-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
          Memory Explorer
        </CardTitle>
        <CardDescription>
          Search, filter and browse memory entries
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Collection selection */}
        <div className="mb-4">
          <Select
            value={selectedCollection}
            onValueChange={setSelectedCollection}
            disabled={collections.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent>
              {collections.map(collection => (
                <SelectItem key={collection} value={collection}>
                  {collection}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Search and filters */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search memory entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={handleSearch} variant="secondary">
              <Search className="w-4 h-4 mr-1" /> Search
            </Button>
            <Button onClick={clearFilters} variant="outline">
              <Filter className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
          
          {/* Memory type filter */}
          <div className="flex flex-wrap gap-2">
            {Object.values(MemoryType).map(type => (
              <Badge
                key={type}
                variant={filterType === type ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleFilterByType(type)}
              >
                {memoryTypeNames[type]}
              </Badge>
            ))}
          </div>
          
          {/* Tags filter - only show if we have memories with tags */}
          {allTags.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Filter by tags:</p>
              <div className="flex flex-wrap gap-1">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={filterTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleFilterByTag(tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Results */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All Memories</TabsTrigger>
              <TabsTrigger value="code" className="flex-1">Code</TabsTrigger>
              <TabsTrigger value="conversations" className="flex-1">Conversations</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {isLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : memories.length > 0 ? (
                <div className="space-y-4">
                  {memories.map(memory => (
                    <MemoryCard 
                      key={memory.id} 
                      memory={memory} 
                      onDelete={() => handleDelete(memory.id)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-muted-foreground">No memories found</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="code" className="mt-4">
              {isLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : memories.filter(m => m.metadata.type === MemoryType.CODE).length > 0 ? (
                <div className="space-y-4">
                  {memories
                    .filter(m => m.metadata.type === MemoryType.CODE)
                    .map(memory => (
                      <MemoryCard 
                        key={memory.id} 
                        memory={memory} 
                        onDelete={() => handleDelete(memory.id)} 
                      />
                    ))}
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-muted-foreground">No code memories found</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="conversations" className="mt-4">
              {isLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : memories.filter(m => [MemoryType.CHAT, MemoryType.PROMPT, MemoryType.RESPONSE].includes(m.metadata.type)).length > 0 ? (
                <div className="space-y-4">
                  {memories
                    .filter(m => [MemoryType.CHAT, MemoryType.PROMPT, MemoryType.RESPONSE].includes(m.metadata.type))
                    .map(memory => (
                      <MemoryCard 
                        key={memory.id} 
                        memory={memory} 
                        onDelete={() => handleDelete(memory.id)} 
                      />
                    ))}
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-muted-foreground">No conversation memories found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      <CardFooter className="justify-between border-t pt-4">
        <div className="text-sm text-cyber-black font-mono">
          {selectedCollection ? `${memories.length} entries found` : 'No collection selected'}
        </div>
        <Button variant="outline" size="sm" onClick={() => setMemories([])}>
          Clear Results
        </Button>
      </CardFooter>
    </Card>
  );
}

// Memory card component for displaying individual memory entries
function MemoryCard({ memory, onDelete }: { memory: MemoryEntry, onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const truncate = (text: string, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // Color coding for memory types
  const typeColors: Record<MemoryType, string> = {
    [MemoryType.CONTEXT]: 'bg-blue-100 text-blue-800',
    [MemoryType.CODE]: 'bg-purple-100 text-purple-800',
    [MemoryType.CHAT]: 'bg-green-100 text-green-800',
    [MemoryType.PROMPT]: 'bg-yellow-100 text-yellow-800',
    [MemoryType.RESPONSE]: 'bg-indigo-100 text-indigo-800',
    [MemoryType.USER_INPUT]: 'bg-orange-100 text-orange-800',
    [MemoryType.METADATA]: 'bg-gray-100 text-gray-800'
  };
  
  return (
    <Card className="cyberborder-sm">
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-2 items-center">
            <Badge className={typeColors[memory.metadata.type]}>
              {memory.metadata.type}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              {formatDate(memory.createdAt)}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0">
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 px-4">
        <div 
          className={`prose prose-sm max-w-none ${expanded ? '' : 'line-clamp-3'}`}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? memory.content : truncate(memory.content)}
        </div>
        
        {memory.metadata.tags && memory.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {memory.metadata.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" /> {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="py-2 px-4 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="text-xs"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </Button>
        
        <div className="text-xs text-muted-foreground">
          Source: {memory.metadata.source}
        </div>
      </CardFooter>
    </Card>
  );
}