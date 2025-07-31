import React from 'react';
import React from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

interface EditorPanelProps {
  prompt: string;
  sessionId?: string;
  onChangePrompt: (value: string) => void;
  onSavePrompt?: (sessionId: string, prompt: string) => void;
  onExecutePrompt?: (prompt: string) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  prompt,
  sessionId,
  onChangePrompt,
  onSavePrompt,
  onExecutePrompt
}) => {
  return (
    <div className="flex flex-col space-y-2 h-full">
      <Textarea
        value={prompt}
        onChange={(e) => onChangePrompt(e.target.value)}
        className="flex-1 bg-black/30"
      />
      <div className="flex justify-end space-x-2">
        {onSavePrompt && sessionId && (
          <Button size="sm" onClick={() => onSavePrompt(sessionId, prompt)}>
            Save
          </Button>
        )}
        {onExecutePrompt && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onExecutePrompt(prompt)}
          >
            Run
          </Button>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;

};

export default EditorPanel;
