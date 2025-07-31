import { v4 as uuidv4 } from 'uuid';

export interface PromptSnapshot {
  id: string;
  content: string;
  createdAt: number;
}

export interface PromptSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  currentSnapshotId?: string;
  snapshots: PromptSnapshot[];
  tags: string[];
}

class PromptMemoryStore {
  private sessions: PromptSession[] = [];

  /** Get all stored sessions */
  getAllSessions(): PromptSession[] {
    return [...this.sessions];
  }

  /** Search sessions by name or tag */
  searchSessions(query: string): PromptSession[] {
    const lower = query.toLowerCase();
    return this.sessions.filter(
      s => s.name.toLowerCase().includes(lower) ||
        s.tags.some(t => t.toLowerCase().includes(lower))
    );
  }

  /** Retrieve a session by id */
  getSession(id: string): PromptSession | undefined {
// Import the sanitize-html package for input sanitization
// import sanitizeHtml from 'sanitize-html';

getSession(id: string): PromptSession | undefined {
  const sanitizedId = sanitizeHtml(id, { allowedTags: [], allowedAttributes: {} });
  return this.sessions.find(s => s.id === sanitizedId);
}
  }

  /** Create a new session with an optional initial prompt */
  createSession(name: string, prompt: string, tags: string[]): PromptSession {
    const snapshot: PromptSnapshot | undefined = prompt
      ? { id: uuidv4(), content: prompt, createdAt: Date.now() }
      : undefined;

    const session: PromptSession = {
      id: uuidv4(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      snapshots: snapshot ? [snapshot] : [],
      currentSnapshotId: snapshot?.id,
      tags,
    };

    this.sessions.push(session);
    return session;
  }

  /** Delete a session */
  deleteSession(id: string): void {
    this.sessions = this.sessions.filter(s => s.id !== id);
  }

  /** Roll back a session to a previous snapshot */
  rollbackToSnapshot(sessionId: string, snapshotId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    const snapshot = session.snapshots.find(s => s.id === snapshotId);
    if (snapshot) {
      session.currentSnapshotId = snapshotId;
      session.updatedAt = Date.now();
    }
  }
}

export const promptMemoryStore = new PromptMemoryStore();
