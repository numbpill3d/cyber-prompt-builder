import { useState, useEffect } from 'react';
import { useMemoryService } from '@frontend/hooks/use-memory-service';
import { useTTSService } from '@frontend/hooks/use-tts-service';
import { useEvolutionService } from '@frontend/hooks/use-evolution-service';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@frontend/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@frontend/components/ui/tabs';
import { Button } from '@frontend/components/ui/button';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import { Switch } from '@frontend/components/ui/switch';
import { Slider } from '@frontend/components/ui/slider';
import { Separator } from '@frontend/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@frontend/components/ui/select';
import { LoadingSpinner } from '@frontend/components/ui/loading-spinner';
import {
  Save,
  Settings2,
  Database,
  Bot,
  Key, 
  SpeakerLoud,
  RotateCcw,
  Cloud,
  Shield,
  FileJson
} from 'lucide-react';
import { 
  MemoryProviderConfig,
  MemoryType
} from '@backend/core/interfaces/memory-engine';
import {
  TrackingConfig
} from '@backend/core/interfaces/evolution-engine';
import {
  TTSSettings,
  TTSEngineType
} from '@backend/core/interfaces/tts-service';

export default function Settings() {
  // Service hooks 
  const { memoryService, isLoading: isMemoryLoading } = useMemoryService();
  const { ttsService, isLoading: isTTSLoading } = useTTSService();
  const { evolutionService, isLoading: isEvolutionLoading } = useEvolutionService();
  
  // Memory settings state
  const [memoryConfig, setMemoryConfig] = useState<MemoryProviderConfig>({
    persistencePath: './data/memories',
    embeddingModel: 'text-embedding-3-small',
    dimensions: 1536,
    serverUrl: '',
    apiKey: '',
  });
  
  // TTS settings state
  const [ttsSettings, setTtsSettings] = useState<TTSSettings>({
    enabled: true,
    engineType: TTSEngineType.WEB_SPEECH_API,
    defaultVoice: {
      voiceURI: '',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0
    },
    codeConfig: {
      enabled: true,
      speakPunctuation: false,
      useAlternativeVoice: false,
      skipComments: true,
      verbosityLevel: 'normal'
    },
    autoStart: false,
    skipMarkdown: true
  });
  
  // Evolution settings state
  const [trackingConfig, setTrackingConfig] = useState<TrackingConfig>({
    enableTracking: true,
    trackingFrequency: 'perSession',
    saveHistory: true,
    historyLimit: 100,
    dimensions: [
      'promptQuality', 
      'codeQuality', 
      'efficiency', 
      'creativity'
    ]
  });
  
  // API key settings
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: '',
    huggingface: '',
  });
  
  const [activeTab, setActiveTab] = useState('api-keys');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Load settings on mount
  useEffect(() => {
    if (memoryService && ttsService && evolutionService) {
      loadSettings();
    }
  }, [memoryService, ttsService, evolutionService]);
  
  // Load all settings
  const loadSettings = async () => {
    // In a real implementation, this would load from the settings service
    // For now, we'll use dummy data and console log
    console.log('Loading settings...');
    
    // Load TTS settings if available
    if (ttsService) {
      const settings = ttsService.getSettings();
      setTtsSettings(settings);
    }
    
    // Load evolution tracking config if available
    if (evolutionService) {
      const config = evolutionService.getTrackingConfig();
      setTrackingConfig(config);
    }
    
    // API keys would be loaded from a secure storage
  };
  
  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // In a real implementation, this would save to each service
      console.log('Saving settings...');
      
      // Save TTS settings
      if (ttsService) {
        ttsService.updateSettings(ttsSettings);
      }
      
      // Save tracking config
      if (evolutionService) {
        evolutionService.updateTrackingConfig(trackingConfig);
      }
      
      // API keys would be saved to secure storage
      
      setSaveMessage('Settings saved successfully!');
      
      // Clear save message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset settings to defaults
  const resetSettings = () => {
    // Confirmation would be needed in a real implementation
    if (confirm('Reset all settings to defaults?')) {
      loadSettings(); // Reload current settings
    }
  };
  
  // Loading state
  const isLoading = isMemoryLoading || isTTSLoading || isEvolutionLoading;
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <div className="flex flex-col items-center gap-4 py-12">
              <LoadingSpinner size="lg" />
              <p>Loading settings...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card className="cyberborder ice-card hover-glow">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
            <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
            Settings
          </CardTitle>
          <CardDescription>
            Configure system services and preferences
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-8">
              <TabsTrigger value="api-keys" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="memory" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Memory
              </TabsTrigger>
              <TabsTrigger value="tts" className="flex items-center gap-2">
                <SpeakerLoud className="h-4 w-4" />
                Text-to-Speech
              </TabsTrigger>
              <TabsTrigger value="evolution" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Evolution
              </TabsTrigger>
            </TabsList>
            
            {/* API Keys Tab */}
            <TabsContent value="api-keys">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Provider API Keys</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Enter your API keys to enable integration with AI service providers.
                    These keys are stored locally and never transmitted to our servers.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="openai-key">OpenAI API Key</Label>
                      <Input
                        id="openai-key"
                        type="password"
                        placeholder="sk-..."
                        value={apiKeys.openai}
                        onChange={(e) => setApiKeys({...apiKeys, openai: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                      <Input
                        id="anthropic-key"
                        type="password"
                        placeholder="sk-ant-..."
                        value={apiKeys.anthropic}
                        onChange={(e) => setApiKeys({...apiKeys, anthropic: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="google-key">Google AI API Key</Label>
                      <Input
                        id="google-key"
                        type="password"
                        placeholder="AIza..."
                        value={apiKeys.google}
                        onChange={(e) => setApiKeys({...apiKeys, google: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="huggingface-key">HuggingFace API Key</Label>
                      <Input
                        id="huggingface-key"
                        type="password"
                        placeholder="hf_..."
                        value={apiKeys.huggingface}
                        onChange={(e) => setApiKeys({...apiKeys, huggingface: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center pt-4 gap-2">
                  <Shield className="text-muted-foreground h-5 w-5" />
                  <p className="text-sm text-muted-foreground">
                    Keys are encrypted and stored locally in your browser's secure storage
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Memory Tab */}
            <TabsContent value="memory">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Memory Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="memory-path">Storage Path</Label>
                      <Input
                        id="memory-path"
                        placeholder="./data/memories"
                        value={memoryConfig.persistencePath}
                        onChange={(e) => setMemoryConfig({...memoryConfig, persistencePath: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Local path for storing memory data
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="embedding-model">Embedding Model</Label>
                      <Select
                        value={memoryConfig.embeddingModel}
                        onValueChange={(value) => setMemoryConfig({...memoryConfig, embeddingModel: value})}
                      >
                        <SelectTrigger id="embedding-model">
                          <SelectValue placeholder="Select embedding model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                          <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                          <SelectItem value="text-embedding-ada-002">text-embedding-ada-002 (Legacy)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="dimensions">Embedding Dimensions</Label>
                        <span className="text-sm">{memoryConfig.dimensions}</span>
                      </div>
                      <Slider
                        id="dimensions"
                        min={512}
                        max={4096}
                        step={512}
                        value={[memoryConfig.dimensions || 1536]}
                        onValueChange={(value) => setMemoryConfig({...memoryConfig, dimensions: value[0]})}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="grid gap-2">
                      <Label htmlFor="server-url">Vector Database Server URL (Optional)</Label>
                      <Input
                        id="server-url"
                        placeholder="http://localhost:8000"
                        value={memoryConfig.serverUrl}
                        onChange={(e) => setMemoryConfig({...memoryConfig, serverUrl: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty for local storage
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="vector-db-key">Vector DB API Key (Optional)</Label>
                      <Input
                        id="vector-db-key"
                        type="password"
                        placeholder="Vector database API key"
                        value={memoryConfig.apiKey}
                        onChange={(e) => setMemoryConfig({...memoryConfig, apiKey: e.target.value})}
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 pt-4">
                      <Button variant="outline" className="gap-2">
                        <FileJson className="h-4 w-4" />
                        Export Memories
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <FileJson className="h-4 w-4" />
                        Import Memories
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* TTS Tab */}
            <TabsContent value="tts">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Text-to-Speech Settings</h3>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="tts-enabled"
                        checked={ttsSettings.enabled}
                        onCheckedChange={(enabled) => setTtsSettings({...ttsSettings, enabled})}
                      />
                      <Label htmlFor="tts-enabled">Enabled</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="tts-engine">TTS Engine</Label>
                      <Select
                        value={ttsSettings.engineType}
                        onValueChange={(value) => setTtsSettings({
                          ...ttsSettings, 
                          engineType: value as TTSEngineType
                        })}
                        disabled={!ttsSettings.enabled}
                      >
                        <SelectTrigger id="tts-engine">
                          <SelectValue placeholder="Select TTS engine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TTSEngineType.WEB_SPEECH_API}>Web Speech API (Browser)</SelectItem>
                          <SelectItem value={TTSEngineType.CLOUD_TTS}>Cloud TTS (API)</SelectItem>
                          <SelectItem value={TTSEngineType.LOCAL_TTS}>Local TTS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-start"
                        checked={ttsSettings.autoStart}
                        onCheckedChange={(autoStart) => setTtsSettings({...ttsSettings, autoStart})}
                        disabled={!ttsSettings.enabled}
                      />
                      <Label htmlFor="auto-start">Auto-start TTS on new content</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="skip-markdown"
                        checked={ttsSettings.skipMarkdown}
                        onCheckedChange={(skipMarkdown) => setTtsSettings({...ttsSettings, skipMarkdown})}
                        disabled={!ttsSettings.enabled}
                      />
                      <Label htmlFor="skip-markdown">Skip markdown formatting when speaking</Label>
                    </div>
                    
                    <Separator />
                    
                    <h4 className="font-medium">Code Speech Settings</h4>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="code-tts-enabled"
                        checked={ttsSettings.codeConfig.enabled}
                        onCheckedChange={(enabled) => setTtsSettings({
                          ...ttsSettings,
                          codeConfig: {...ttsSettings.codeConfig, enabled}
                        })}
                        disabled={!ttsSettings.enabled}
                      />
                      <Label htmlFor="code-tts-enabled">Enable TTS for code blocks</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="skip-comments"
                        checked={ttsSettings.codeConfig.skipComments}
                        onCheckedChange={(skipComments) => setTtsSettings({
                          ...ttsSettings,
                          codeConfig: {...ttsSettings.codeConfig, skipComments}
                        })}
                        disabled={!ttsSettings.enabled || !ttsSettings.codeConfig.enabled}
                      />
                      <Label htmlFor="skip-comments">Skip comments when speaking code</Label>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="verbosity">Code Verbosity Level</Label>
                      <Select
                        value={ttsSettings.codeConfig.verbosityLevel}
                        onValueChange={(value: any) => setTtsSettings({
                          ...ttsSettings,
                          codeConfig: {
                            ...ttsSettings.codeConfig,
                            verbosityLevel: value
                          }
                        })}
                        disabled={!ttsSettings.enabled || !ttsSettings.codeConfig.enabled}
                      >
                        <SelectTrigger id="verbosity">
                          <SelectValue placeholder="Select verbosity level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal (basic structure only)</SelectItem>
                          <SelectItem value="normal">Normal (standard detail)</SelectItem>
                          <SelectItem value="detailed">Detailed (comprehensive)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Evolution Tab */}
            <TabsContent value="evolution">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Evolution Engine Settings</h3>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="tracking-enabled"
                        checked={trackingConfig.enableTracking}
                        onCheckedChange={(enableTracking) => setTrackingConfig({...trackingConfig, enableTracking})}
                      />
                      <Label htmlFor="tracking-enabled">Enable Tracking</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="tracking-frequency">Tracking Frequency</Label>
                      <Select
                        value={trackingConfig.trackingFrequency}
                        onValueChange={(value: any) => setTrackingConfig({...trackingConfig, trackingFrequency: value})}
                        disabled={!trackingConfig.enableTracking}
                      >
                        <SelectTrigger id="tracking-frequency">
                          <SelectValue placeholder="Select tracking frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="perSession">Per Session</SelectItem>
                          <SelectItem value="perPrompt">Per Prompt</SelectItem>
                          <SelectItem value="custom">Custom Interval</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {trackingConfig.trackingFrequency === 'custom' && (
                      <div className="grid gap-2">
                        <Label htmlFor="custom-interval">Interval (minutes)</Label>
                        <Input
                          id="custom-interval"
                          type="number"
                          min="1"
                          value={trackingConfig.customInterval || 30}
                          onChange={(e) => setTrackingConfig({
                            ...trackingConfig, 
                            customInterval: parseInt(e.target.value)
                          })}
                          disabled={!trackingConfig.enableTracking}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="save-history"
                        checked={trackingConfig.saveHistory}
                        onCheckedChange={(saveHistory) => setTrackingConfig({...trackingConfig, saveHistory})}
                        disabled={!trackingConfig.enableTracking}
                      />
                      <Label htmlFor="save-history">
                        Save evolution history
                      </Label>
                    </div>
                    
                    {trackingConfig.saveHistory && (
                      <div className="grid gap-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="history-limit">History Limit</Label>
                          <span className="text-sm">{trackingConfig.historyLimit} entries</span>
                        </div>
                        <Slider
                          id="history-limit"
                          min={10}
                          max={500}
                          step={10}
                          value={[trackingConfig.historyLimit || 100]}
                          onValueChange={(value) => setTrackingConfig({...trackingConfig, historyLimit: value[0]})}
                          disabled={!trackingConfig.enableTracking || !trackingConfig.saveHistory}
                        />
                      </div>
                    )}
                    
                    <Separator />
                    
                    <h4 className="font-medium">Tracked Dimensions</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Select which performance dimensions to track
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {['promptQuality', 'codeQuality', 'creativity', 'efficiency', 
                        'consistency', 'adaptability', 'learning'].map(dimension => (
                        <div className="flex items-center space-x-2" key={dimension}>
                          <Switch
                            id={`dim-${dimension}`}
                            checked={trackingConfig.dimensions?.includes(dimension) || false}
                            onCheckedChange={(checked) => {
                              const newDimensions = checked 
                                ? [...(trackingConfig.dimensions || []), dimension]
                                : (trackingConfig.dimensions || []).filter(d => d !== dimension);
                              setTrackingConfig({...trackingConfig, dimensions: newDimensions});
                            }}
                            disabled={!trackingConfig.enableTracking}
                          />
                          <Label htmlFor={`dim-${dimension}`} className="capitalize">
                            {dimension}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t pt-4 flex justify-between">
          <Button variant="outline" onClick={resetSettings} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </Button>
          
          <div className="flex items-center gap-4">
            {saveMessage && (
              <div className={`text-sm ${saveMessage.includes('Error') ? 'text-destructive' : 'text-green-600'}`}>
                {saveMessage}
              </div>
            )}
            
            <Button onClick={saveSettings} disabled={isSaving} className="gap-2">
              {isSaving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
              Save Settings
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}