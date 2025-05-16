import { useState, useEffect, useCallback, useRef } from 'react';
import { TerminalService, CommandOptions, CommandResult, TerminalSession, TerminalEvent } from '../core/interfaces/terminal';
import { getService } from '../core/services/service-locator';
import { toast } from '../components/ui/sonner';

/**
 * Hook for using the terminal service
 */
export const useTerminal = (sessionId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [terminalService, setTerminalService] = useState<TerminalService | null>(null);
  const [session, setSession] = useState<TerminalSession | null>(null);
  const [events, setEvents] = useState<TerminalEvent[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize the terminal service
  useEffect(() => {
    try {
      const service = getService<TerminalService>('terminalService');
      setTerminalService(service);
    } catch (err) {
      console.error('Failed to get terminal service:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to initialize terminal service');
    }
  }, []);

  // Set up session and event subscription
  useEffect(() => {
    if (!terminalService) return;

    const setupSession = async () => {
      try {
        setIsLoading(true);
        
        // If sessionId is provided, get that session, otherwise create a new one
        let currentSession: TerminalSession;
        if (sessionId) {
          const existingSession = await terminalService.getSession(sessionId);
          if (!existingSession) {
            throw new Error(`Terminal session not found: ${sessionId}`);
          }
          currentSession = existingSession;
        } else {
          currentSession = await terminalService.createSession();
        }
        
        setSession(currentSession);
        
        // Subscribe to events
        const unsubscribe = terminalService.subscribe(currentSession.id, (event) => {
          setEvents(prev => [...prev, event]);
        });
        
        unsubscribeRef.current = unsubscribe;
      } catch (err) {
        console.error('Failed to set up terminal session:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        toast.error('Failed to set up terminal session');
      } finally {
        setIsLoading(false);
      }
    };

    setupSession();

    // Clean up subscription and session on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      if (session && !sessionId) {
        // Only close the session if we created it (not if it was provided)
        terminalService.closeSession(session.id).catch(console.error);
      }
    };
  }, [terminalService, sessionId]);

  /**
   * Execute a command
   */
  const executeCommand = useCallback(async (command: string, options?: CommandOptions) => {
    if (!terminalService) {
      throw new Error('Terminal service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await terminalService.executeCommand(command, options);
      return result;
    } catch (err) {
      console.error(`Failed to execute command: ${command}`, err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [terminalService]);

  /**
   * Execute a command in the current session
   */
  const executeInSession = useCallback(async (command: string) => {
    if (!terminalService || !session) {
      throw new Error('Terminal service or session not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await terminalService.executeInSession(session.id, command);
      return result;
    } catch (err) {
      console.error(`Failed to execute command in session: ${command}`, err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [terminalService, session]);

  /**
   * Create a new terminal session
   */
  const createSession = useCallback(async (name?: string, cwd?: string) => {
    if (!terminalService) {
      throw new Error('Terminal service not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const newSession = await terminalService.createSession(name, cwd);
      return newSession;
    } catch (err) {
      console.error('Failed to create terminal session', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [terminalService]);

  /**
   * Close the current session
   */
  const closeSession = useCallback(async () => {
    if (!terminalService || !session) {
      throw new Error('Terminal service or session not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await terminalService.closeSession(session.id);
      if (result) {
        setSession(null);
        setEvents([]);
      }
      return result;
    } catch (err) {
      console.error('Failed to close terminal session', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [terminalService, session]);

  /**
   * Get command history for the current session
   */
  const getHistory = useCallback(async (limit?: number) => {
    if (!terminalService || !session) {
      throw new Error('Terminal service or session not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const history = await terminalService.getHistory(session.id, limit);
      return history;
    } catch (err) {
      console.error('Failed to get command history', err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [terminalService, session]);

  /**
   * Clear the events list
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    isLoading,
    error,
    session,
    events,
    executeCommand,
    executeInSession,
    createSession,
    closeSession,
    getHistory,
    clearEvents,
    isCommandAllowed: terminalService?.isCommandAllowed.bind(terminalService),
  };
};

export default useTerminal;
