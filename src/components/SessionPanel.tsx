import React from 'react';
import React from 'react';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

export interface BasicSession {
  id: string;
  name: string;
}

interface SessionPanelProps {
  sessions: BasicSession[];
  selectedSessionId?: string;
  onSelectSession: (id: string) => void;
}

const SessionPanel: React.FC<SessionPanelProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession
}) => {
  return (
    <ScrollArea className="space-y-2">
      {sessions.map((session) => (
        <Card
          key={session.id}
          onClick={() => onSelectSession(session.id)}
          className={`p-2 cursor-pointer border ${
            selectedSessionId === session.id ? 'border-purple-500' : 'border-transparent'
          }`}
        >
          {session.name}
        </Card>
      ))}
    </ScrollArea>
  );
};

export default SessionPanel;

};

export default SessionPanel;
