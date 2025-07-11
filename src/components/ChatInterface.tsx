import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  error?: string;
}

interface ChatInterfaceProps {
  onCodeGenerated?: (code: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onCodeGenerated }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Check which providers are configured
  const getProviderStatus = () => {
    return {
      gemini: !!localStorage.getItem('gemini_api_key'),
      openai: !!localStorage.getItem('openai_api_key'),
      claude: !!localStorage.getItem('claude_api_key')
    };
  };
  
  const [providerStatus, setProviderStatus] = useState(getProviderStatus());
  
  useEffect(() => {
    const checkStatus = () => setProviderStatus(getProviderStatus());
    window.addEventListener('storage', checkStatus);
    window.addEventListener('focus', checkStatus);
    return () => {
      window.removeEventListener('storage', checkStatus);
      window.removeEventListener('focus', checkStatus);
    };
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem(`${selectedProvider}_api_key`);
      
      if (!apiKey) {
        throw new Error(`Please configure your ${selectedProvider.toUpperCase()} API key in settings`);
      }

      // Make API call based on selected provider
      let response;
      
      if (selectedProvider === 'gemini') {
        response = await callGeminiAPI(input, apiKey);
      } else if (selectedProvider === 'openai') {
        response = await callOpenAIAPI(input, apiKey);
      } else {
        throw new Error('Unsupported provider');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Extract code blocks if any
      const codeBlocks = extractCodeBlocks(response);
      if (codeBlocks.length > 0 && onCodeGenerated) {
        onCodeGenerated(codeBlocks.join('\n\n'));
      }

    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error.message || 'An error occurred',
        role: 'assistant',
        timestamp: new Date(),
        error: error.message
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string> => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
  };

  const callOpenAIAPI = async (prompt: string, apiKey: string): Promise<string> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated';
  };

  const extractCodeBlocks = (text: string): string[] => {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const matches = text.match(codeBlockRegex) || [];
    return matches.map(match => match.replace(/```\w*\n?/g, '').replace(/```$/g, ''));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[500px] cyberborder ice-card">
      <div className="p-4 border-b border-cyber-bright-blue border-opacity-30">
        <div className="flex items-center justify-between">
          <h3 className="font-orbitron text-lg text-cyber-bright-blue">AI Chat</h3>
          <div className="flex items-center gap-2">
            <select 
              value={selectedProvider} 
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-2 py-1 text-xs bg-transparent border border-cyber-bright-blue border-opacity-30 rounded text-cyber-black"
            >
              <option value="gemini">Gemini (Free) {providerStatus.gemini ? '✓' : '⚠'}</option>
              <option value="openai">OpenAI {providerStatus.openai ? '✓' : '⚠'}</option>
            </select>
            {!providerStatus[selectedProvider as keyof typeof providerStatus] && (
              <span className="text-xs text-red-500">No API key</span>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-cyber-black opacity-60 py-8">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Start a conversation with AI</p>
              <p className="text-xs mt-1">Try: "Create a React component" or "Explain async/await"</p>
              
              {!providerStatus[selectedProvider as keyof typeof providerStatus] && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-left">
                  <p className="font-medium text-yellow-800 mb-1">API Key Required</p>
                  <p className="text-yellow-700 mb-2">
                    {selectedProvider === 'gemini' 
                      ? 'Get a free Gemini API key from Google AI Studio'
                      : 'Configure your API key in Settings'
                    }
                  </p>
                  {selectedProvider === 'gemini' && (
                    <a 
                      href="https://makersuite.google.com/app/apikey" 
                      target="_blank" 
                      className="text-blue-600 hover:underline"
                    >
                      Get Free Gemini API Key →
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-cyber-bright-blue text-white' 
                    : message.error 
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-cyber-black'
                }`}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={`px-3 py-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-cyber-bright-blue text-white' 
                    : message.error
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-gray-50 border border-gray-200 text-cyber-black'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cyber-black" />
                </div>
                <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-cyber-bright-blue rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyber-bright-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-cyber-bright-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-cyber-bright-blue border-opacity-30">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask AI anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !input.trim()}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;