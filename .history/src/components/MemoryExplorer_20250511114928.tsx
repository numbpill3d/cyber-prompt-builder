import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { systemIntegration } from '../services/system-integration';
import { MemoryType } from '../services/memory/memory-types';

interface MemoryExplorerProps {
  sessionId?: string;
  initialCollection?: string;
  height?: string;
  onMemorySelect?: (memory: any) => void;
}

const MemoryExplorer = ({
  sessionId,
  initialCollection = 'conversation-history',
  height = '500px',
  onMemorySelect
}: MemoryExplorerProps) => {
  const [collections, setCollections] = useState<string[]>([]);
  const [currentCollection, setCurrentCollection] = useState<string>(initialCollection);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Get memory service from system integration
  const memoryService = systemIntegration.getService<any>('memory');
  
  // Load collections on mount
  useEffect(() => {
    async function loadCollections() {
      try {
        // Ensure the system is initialized
        await systemIntegration.initialize();
        
        const collections = await memoryService.listCollections();
        setCollections(collections);
        
        if (collections.length > 0 && !collections.includes(currentCollection)) {
          setCurrentCollection(collections[0]);
        }
      } catch (error) {
        console.error('Failed to load memory collections:', error);
      }
    }
    
    loadCollections();
  }, []);
  
  // Load memories when collection changes
  useEffect(() => {
    if (!currentCollection) return;
    
    async function loadMemories() {
      setLoading(true);
      try {
        const result = await memoryService.searchMemories(
          currentCollection,
          {
            sessionId: sessionId,
            maxResults: 100
          }
        );
        
        setMemories(result.entries);
      } catch (error) {
        console.error(`Failed to load memories from ${currentCollection}:`, error);
        setMemories([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadMemories();
  }, [currentCollection, sessionId]);
  
  // Search memories
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, reload all memories
      const result = await memoryService.searchMemories(
        currentCollection,
        {
          sessionId: sessionId,
          maxResults: 100
        }
      );
      setMemories(result.entries);
      return;
    }
    
    try {
      const result = await memoryService.searchMemories(
        currentCollection,
        {
          query: searchQuery,
          sessionId: sessionId,
          maxResults: 100
        }
      );
      setMemories(result.entries);
    } catch (error) {
      console.error('Memory search failed:', error);
    }
  };
  
  // Filter memories by type
  const filteredMemories = filterType === 'all' 
    ? memories 
    : memories.filter(memory => memory.metadata.type === filterType);
  
  // Get memory type label
  const getMemoryTypeLabel = (type: MemoryType | string): string => {
    switch (type) {
      case MemoryType.CHAT:
        return 'Chat';
      case MemoryType.CODE:
        return 'Code';
      case MemoryType.CONTEXT:
        return 'Context';
      case MemoryType.DOCUMENT:
        return 'Document';
      default:
        return type as string;
    }
  };
  
  // Get memory type badge color
  const getMemoryTypeBadgeVariant = (type: MemoryType | string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case MemoryType.CHAT:
        return 'default';
      case MemoryType.CODE:
        return 'secondary';
      case MemoryType.CONTEXT:
        return 'outline';
      case MemoryType.DOCUMENT:
        return 'default';
      default:
