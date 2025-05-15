
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { configureApiKey } from '@backend/services/aiService';
import { toast } from '@frontend/hooks/use-toast';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const success = configureApiKey(apiKey);
      if (success) {
        toast({
          title: "API Key Saved",
          description: "Your AI API key has been successfully saved.",
        });
        onClose();
      } else {
        toast({
          title: "Invalid API Key",
          description: "Please enter a valid API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-6 rounded-lg cyberborder ice-card relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyber-black hover:text-cyber-bright-blue"
        >
          <X size={20} />
        </button>
        
        <h2 className="font-orbitron text-xl mb-6 text-cyber-bright-blue">Configure AI API</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="apiKey" className="block text-sm font-medium text-cyber-black mb-2">
              API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your AI API key"
              className="w-full"
              required
            />
            <p className="mt-2 text-xs text-cyber-black opacity-70">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-cyber-bright-blue hover:bg-cyber-sky-blue text-white"
            >
              {isSubmitting ? "Saving..." : "Save API Key"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;
