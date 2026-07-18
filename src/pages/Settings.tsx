import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { openAIService } from '@/services/openai';
import { validateApiKey as validateKeyFormat } from '@/config/security';
import { toast } from '@/hooks/use-toast';

type ThemeOption = 'system' | 'light' | 'dark';

interface APIKeyInputProps {
  provider: 'openai' | 'gemini' | 'claude';
  apiKey: string;
  setApiKey: (key: string) => void;
  testKey: () => void;
  saveKey: () => void;
  validating: boolean;
}

const APIKeyInput: React.FC<APIKeyInputProps> = ({
  provider,
  apiKey,
  setApiKey,
  testKey,
  saveKey,
  validating
}) => {
  const providerLabels = {
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    claude: 'Anthropic Claude'
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={provider}>{providerLabels[provider]} API Key</Label>
      <div className="flex gap-2">
        <Input
          id={provider}
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`Enter your ${providerLabels[provider]} API key`}
          className="flex-1"
        />
        <Button
          onClick={testKey}
          disabled={validating || !apiKey.trim()}
          variant="outline"
        >
          {validating ? 'Testing...' : 'Test'}
        </Button>
        <Button
          onClick={saveKey}
          disabled={!apiKey.trim()}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

interface ThemeSelectorProps {
  theme: ThemeOption;
  handleThemeChange: (theme: ThemeOption) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, handleThemeChange }) => {
  return (
    <div className="space-y-2">
      <Label>Theme</Label>
      <div className="flex gap-2">
        {(['system', 'light', 'dark'] as ThemeOption[]).map((option) => (
          <Button
            key={option}
            variant={theme === option ? 'default' : 'outline'}
            onClick={() => handleThemeChange(option)}
            className="capitalize"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default function Settings() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [theme, setTheme] = useState<ThemeOption>('system');
  const [validating, setValidating] = useState({
    openai: false,
    gemini: false,
    claude: false
  });

  // Load stored settings on mount
  useEffect(() => {
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
    setGeminiKey(localStorage.getItem('gemini_api_key') || '');
    setClaudeKey(localStorage.getItem('claude_api_key') || '');
    const storedTheme = (localStorage.getItem('theme_preference') as ThemeOption) || 'system';
    setTheme(storedTheme);
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    const root = document.body;
    if (!root) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        root.classList.toggle('dark', e.matches);
      }
    };

    // Remove existing listener
    mediaQuery.removeEventListener('change', handleSystemThemeChange);

    if (theme === 'system') {
      const prefersDark = mediaQuery.matches;
      root.classList.toggle('dark', prefersDark);
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  const saveKey = (provider: 'openai' | 'gemini' | 'claude') => {
    const keyMap = { openai: openaiKey, gemini: geminiKey, claude: claudeKey };
    const key = keyMap[provider].trim();
    if (key) {
      localStorage.setItem(`${provider}_api_key`, key);
      toast({ title: 'Key Saved', description: `${provider} API key saved.` });
    } else {
      localStorage.removeItem(`${provider}_api_key`);
      toast({ title: 'Key Removed', description: `${provider} API key removed.` });
    }
  };

  const testOpenAI = async () => {
    setValidating(v => ({ ...v, openai: true }));
    try {
      const valid = await openAIService.validateApiKey(openaiKey);
      toast({
        title: valid ? 'API Key Valid' : 'Invalid API Key',
        description: valid ? 'OpenAI key works correctly.' : 'Please check your OpenAI key.',
        variant: valid ? undefined : 'destructive'
      });
    } catch (error) {
      toast({
        title: 'Error Testing Key',
        description: 'Failed to test OpenAI key.',
        variant: 'destructive'
      });
    } finally {
      setValidating(v => ({ ...v, openai: false }));
    }
  };

  const testKeyFormat = (provider: 'gemini' | 'claude') => {
    setValidating(v => ({ ...v, [provider]: true }));
    const keyMap = { gemini: geminiKey, claude: claudeKey };
    const key = keyMap[provider];
    const valid = validateKeyFormat(key, provider);
    setValidating(v => ({ ...v, [provider]: false }));
    toast({
      title: valid ? 'API Key Looks Valid' : 'Invalid API Key',
      description: valid
        ? `${provider} key format appears correct.`
        : `Please check your ${provider} API key.`,
      variant: valid ? undefined : 'destructive'
    });
  };

  const handleThemeChange = (value: ThemeOption) => {
    setTheme(value);
    localStorage.setItem('theme_preference', value);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <APIKeyInput
        provider="openai"
        apiKey={openaiKey}
        setApiKey={setOpenaiKey}
        testKey={testOpenAI}
        saveKey={() => saveKey('openai')}
        validating={validating.openai}
      />

      <APIKeyInput
        provider="gemini"
        apiKey={geminiKey}
        setApiKey={setGeminiKey}
        testKey={() => testKeyFormat('gemini')}
        saveKey={() => saveKey('gemini')}
        validating={validating.gemini}
      />

      <APIKeyInput
        provider="claude"
        apiKey={claudeKey}
        setApiKey={setClaudeKey}
        testKey={() => testKeyFormat('claude')}
        saveKey={() => saveKey('claude')}
        validating={validating.claude}
      />

      <ThemeSelector theme={theme} handleThemeChange={handleThemeChange} />

      <div>
        <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
}