import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
// Load stored settings on mount
  useEffect(() => {
    try {
      setOpenaiKey(localStorage.getItem('openai_api_key') || '');
      setGeminiKey(localStorage.getItem('gemini_api_key') || '');
      setClaudeKey(localStorage.getItem('claude_api_key') || '');
      const storedTheme = (localStorage.getItem('theme_preference') as ThemeOption) || 'system';
      setTheme(storedTheme);
      applyTheme(storedTheme);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, []);

  const applyTheme = (value: ThemeOption) => {
    const storedTheme = (localStorage.getItem('theme_preference') as ThemeOption) || 'system';
    setTheme(storedTheme);
// Load stored settings on mount
  useEffect(() => {
    setOpenaiKey(localStorage.getItem('openai_api_key') || '');
    setGeminiKey(localStorage.getItem('gemini_api_key') || '');
    setClaudeKey(localStorage.getItem('claude_api_key') || '');
    const storedTheme = (localStorage.getItem('theme_preference') as ThemeOption) || 'system';
    setTheme(storedTheme);
  }, []);

      if (key) {
        // Use a simple encryption or consider a more robust solution
        const encryptedKey = btoa(key); // Basic encoding, consider stronger encryption
        localStorage.setItem(`${provider}_api_key`, encryptedKey);
        toast({ title: 'Key Saved', description: `${provider} API key saved.` });
  }, [theme]);

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
  };

  const saveKey = (provider: 'openai' | 'gemini' | 'claude') => {
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
      toast({ title: 'Key Removed', description: `${provider} API key removed.` });
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
return (
  <div className="container mx-auto px-4 py-8 space-y-8">
    <h1 className="text-2xl font-bold mb-4">Settings</h1>

    <APIKeyInput
      provider="openai"
      apiKey={openaiKey}
      setApiKey={setOpenaiKey}
      testKey={testOpenAI}
      saveKey={saveKey}
      validating={validating.openai}
    />

    <APIKeyInput
      provider="gemini"
      apiKey={geminiKey}
      setApiKey={setGeminiKey}
      testKey={() => testKeyFormat('gemini')}
      saveKey={saveKey}
      validating={validating.gemini}
    />

    <APIKeyInput
      provider="claude"
      apiKey={claudeKey}
      setApiKey={setClaudeKey}
      testKey={() => testKeyFormat('claude')}
      saveKey={saveKey}
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

    </div>
  );
}