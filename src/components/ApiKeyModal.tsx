
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Key, ExternalLink } from 'lucide-react';
import { openAIService } from '@/services/openai';
import { toast } from "@/hooks/use-toast";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ open, onOpenChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (open) {
      // Load existing API key from localStorage (support legacy key)
      const newKey = localStorage.getItem('openai_api_key');
      const oldKey = localStorage.getItem('openai-api-key');
      const savedKey = newKey || oldKey || '';
      setApiKey(savedKey);
      if (oldKey && !newKey) {
        localStorage.setItem('openai_api_key', oldKey);
        localStorage.removeItem('openai-api-key');
      }
      setIsValid(null);
    }
  }, [open]);

  const validateApiKey = async (key: string) => {
    if (!key.trim()) {
      setIsValid(null);
      return;
    }

    setIsValidating(true);
    try {
      const valid = await openAIService.validateApiKey(key);
      setIsValid(valid);
      
      if (valid) {
        toast({
          title: "API Key Valid",
          description: "Your OpenAI API key is working correctly.",
        });
      } else {
        toast({
          title: "Invalid API Key",
          description: "Please check your OpenAI API key and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsValid(false);
      toast({
        title: "Validation Error",
        description: "Failed to validate API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      localStorage.removeItem('openai-api-key');
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved locally.",
      });
    } else {
      localStorage.removeItem('openai_api_key');
    }
    onOpenChange(false);
  };

  const handleKeyChange = (value: string) => {
    setApiKey(value);
    setIsValid(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configure OpenAI API Key
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => validateApiKey(apiKey)}
              disabled={!apiKey.trim() || isValidating}
              className="flex-1"
            >
              {isValidating ? "Validating..." : "Test Key"}
            </Button>
            {isValid !== null && (
              <div className={`px-3 py-2 rounded text-sm ${
                isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isValid ? "✓ Valid" : "✗ Invalid"}
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-blue-900 mb-1">Need an API key?</p>
            <p className="text-blue-700 mb-2">Get your OpenAI API key from the OpenAI platform.</p>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              Get API Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyModal;
