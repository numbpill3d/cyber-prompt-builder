import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { openAIService } from '@/services/openai';
import { validateApiKey as validateKeyFormat } from '@/config/security';
import { toast } from '@/hooks/use-toast';

type ThemeOption = 'system' | 'light' | 'dark';

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
    applyTheme(storedTheme);
  }, []);

  const applyTheme = (value: ThemeOption) => {
    const root = document.body;
    if (!root) return;
    if (value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', value === 'dark');
    }
  };

  const handleThemeChange = (value: ThemeOption) => {
    setTheme(value);
    localStorage.setItem('theme_preference', value);
    applyTheme(value);
  };

  const saveKey = (provider: 'openai' | 'gemini' | 'claude') => {
    const keyMap = { openai: openaiKey, gemini: geminiKey, claude: claudeKey };
    const key = keyMap[provider].trim();
    if (key) {
      localStorage.setItem(`${provider}_api_key`, key);
      toast({ title: 'Key Saved', description: `${provider} API key saved.` });
    } else {
      localStorage.removeItem(`${provider}_api_key`);
    }
  };

  const testOpenAI = async () => {
    setValidating(v => ({ ...v, openai: true }));
    const valid = await openAIService.validateApiKey(openaiKey);
    setValidating(v => ({ ...v, openai: false }));
    toast({
      title: valid ? 'API Key Valid' : 'Invalid API Key',
      description: valid ? 'OpenAI key works correctly.' : 'Please check your OpenAI key.',
      variant: valid ? undefined : 'destructive'
    });
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      {/* OpenAI Key */}
      <div className="space-y-2">
        <Label htmlFor="openai">OpenAI API Key</Label>
        <Input
          id="openai"
          type="text"
          value={openaiKey}
          placeholder="sk-..."
          onChange={e => setOpenaiKey(e.target.value)}
        />
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={testOpenAI} disabled={validating.openai || !openaiKey.trim()}>
            {validating.openai ? 'Testing...' : 'Test Key'}
          </Button>
          <Button onClick={() => saveKey('openai')}>Save</Button>
        </div>
      </div>

      {/* Gemini Key */}
      <div className="space-y-2">
        <Label htmlFor="gemini">Gemini API Key</Label>
        <Input
          id="gemini"
          type="text"
          value={geminiKey}
          placeholder="AIza..."
          onChange={e => setGeminiKey(e.target.value)}
        />
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => testKeyFormat('gemini')}
            disabled={validating.gemini || !geminiKey.trim()}
          >
            {validating.gemini ? 'Testing...' : 'Test Key'}
          </Button>
          <Button onClick={() => saveKey('gemini')}>Save</Button>
        </div>
      </div>

      {/* Claude Key */}
      <div className="space-y-2">
        <Label htmlFor="claude">Claude API Key</Label>
        <Input
          id="claude"
          type="text"
          value={claudeKey}
          placeholder="sk-ant-..."
          onChange={e => setClaudeKey(e.target.value)}
        />
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => testKeyFormat('claude')}
            disabled={validating.claude || !claudeKey.trim()}
          >
            {validating.claude ? 'Testing...' : 'Test Key'}
          </Button>
          <Button onClick={() => saveKey('claude')}>Save</Button>
        </div>
      </div>

      {/* Theme Preference */}
      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <select
          id="theme"
          value={theme}
          onChange={e => handleThemeChange(e.target.value as ThemeOption)}
          className="border border-cyber-bright-blue border-opacity-30 bg-white bg-opacity-80 text-cyber-black rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-bright-blue"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </div>
  );
}