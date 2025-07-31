import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface PromptEditorProps {
  initialPrompt: string;
  sessionId?: string;
  onSave: (sessionId: string, prompt: string) => void;
  onExecute: (prompt: string) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  initialPrompt,
  sessionId,
  onSave,
  onExecute
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleSave = () => {
    if (sessionId) {
      onSave(sessionId, prompt);
    }
  };

  const handleExecute = () => {
    onExecute(prompt);
  };

  return (
    <div className="flex flex-col h-full space-y-2">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt..."
        className="flex-1 bg-black/30 border-purple-500/30 text-white"
      />
      <div className="flex justify-end space-x-2">
        <Button size="sm" onClick={handleSave} disabled={!sessionId}>
          Save
        </Button>
        <Button size="sm" variant="secondary" onClick={handleExecute}>
          Run
        </Button>
      </div>
    </div>
  );
};

export default PromptEditor;
