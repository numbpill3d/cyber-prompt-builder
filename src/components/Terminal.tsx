import React, { useState, useEffect, useRef } from 'react';
import { TerminalSession, TerminalEvent } from '../core/interfaces/terminal';
import { terminalService } from '../services/terminal/terminal-service';
import { cn } from '../lib/utils';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Copy, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { toast } from '@/hooks/use-toast';

interface TerminalProps {
  className?: string;
  initialCwd?: string;
  sessionName?: string;
  height?: string;
  onClose?: () => void;
  autoFocus?: boolean;
  showHeader?: boolean;
  showPrompt?: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({
  className,
  initialCwd,
  sessionName = 'Terminal',
  height = '300px',
  onClose,
  autoFocus = true,
  showHeader = true,
  showPrompt = true
}) => {
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [output, setOutput] = useState<TerminalEvent[]>([]);
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize terminal session
  useEffect(() => {
    const initTerminal = async () => {
      try {
        await terminalService.initialize();
        const newSession = await terminalService.createSession(sessionName, initialCwd);
        setSession(newSession);
        
        // Add welcome message
        setOutput([{
          type: 'output',
          sessionId: newSession.id,
          data: `Welcome to ${sessionName}. Type 'help' for available commands.`,
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Failed to initialize terminal:', error);
        toast({
          title: 'Terminal Error',
          description: 'Failed to initialize terminal',
          variant: 'destructive',
        });
      }
    };
    
    initTerminal();
    
    // Cleanup on unmount
    return () => {
      if (session) {
        terminalService.closeSession(session.id).catch(console.error);
      }
    };
  }, [sessionName, initialCwd]);
  
  // Subscribe to terminal events
  useEffect(() => {
    if (!session) return;
    
    const unsubscribe = terminalService.subscribe(session.id, (event) => {
      setOutput(prev => [...prev, event]);
    });
    
    return unsubscribe;
  }, [session]);
  
  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);
  
  // Auto-focus input on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !command.trim()) return;
    
    setIsLoading(true);
    
    try {
      await terminalService.executeInSession(session.id, command);
      setCommand('');
      setHistoryIndex(-1);
    } catch (error) {
      console.error('Command execution failed:', error);
      // Error will be shown in the terminal output via events
    } finally {
      setIsLoading(false);
      
      // Focus the input again
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!session) return;
    
    // Handle up/down arrows for history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      try {
        const history = await terminalService.getHistory(session.id);
        
        if (history.length > 0) {
          const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
          setHistoryIndex(newIndex);
          setCommand(history[history.length - 1 - newIndex] || '');
        }
      } catch (error) {
        console.error('Failed to get command history:', error);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      try {
        const history = await terminalService.getHistory(session.id);
        
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCommand(history[history.length - 1 - newIndex] || '');
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setCommand('');
        }
      } catch (error) {
        console.error('Failed to get command history:', error);
      }
    }
  };
  
  const handleClearTerminal = () => {
    if (!session) return;
    
    setOutput([{
      type: 'output',
      sessionId: session.id,
      data: 'Terminal cleared',
      timestamp: new Date()
    }]);
  };
  
  const handleCopyOutput = () => {
    const text = output.map(event => event.data).join('\n');
    navigator.clipboard.writeText(text)
      .then(() =>
        toast({
          title: 'Copied',
          description: 'Terminal output copied to clipboard',
        })
      )
      .catch(() =>
        toast({
          title: 'Copy Failed',
          description: 'Failed to copy terminal output',
          variant: 'destructive',
        })
      );
  };
  
  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };
  
  // Render terminal output with appropriate styling
  const renderOutput = (event: TerminalEvent) => {
    switch (event.type) {
      case 'command':
        return <div className="text-cyber-bright-blue font-bold">$ {event.data}</div>;
      case 'error':
        return <div className="text-red-500">{event.data}</div>;
      case 'output':
        return <div className="text-white whitespace-pre-wrap">{event.data}</div>;
      case 'exit':
        return <div className="text-gray-400 text-sm">{event.data}</div>;
      default:
        return <div>{event.data}</div>;
    }
  };
  
  return (
    <div 
      className={cn(
        "bg-black bg-opacity-90 border border-cyber-bright-blue rounded-md flex flex-col",
        isMaximized ? "fixed inset-4 z-50" : "",
        className
      )}
      style={{ height: isMaximized ? 'auto' : height }}
    >
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-cyber-bright-blue">
          <div className="flex items-center gap-2">
            <TerminalIcon size={16} className="text-cyber-bright-blue" />
            <span className="text-cyber-bright-blue font-mono text-sm">
              {session?.name || 'Terminal'} - {session?.cwd || ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={handleCopyOutput}
            >
              <Copy size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={handleClearTerminal}
            >
              <RotateCcw size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={toggleMaximize}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
            {onClose && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-gray-400 hover:text-red-500"
                onClick={onClose}
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1 p-3 font-mono text-sm">
        {output.map((event, index) => (
          <div key={index} className="mb-1">
            {renderOutput(event)}
          </div>
        ))}
        <div ref={outputEndRef} />
      </ScrollArea>
      
      {showPrompt && (
        <form onSubmit={handleCommandSubmit} className="border-t border-cyber-bright-blue p-2">
          <div className="flex items-center">
            <span className="text-cyber-bright-blue font-bold mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !session}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono"
              placeholder={isLoading ? 'Executing...' : 'Type a command...'}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        </form>
      )}
    </div>
  );
};

export default Terminal;
