import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  getSettingsManager,
  configureApiKey,
  getProviders,
  getModels,
  getModelRouter,
  getRoutingOptions,
  setRoutingStrategy,
  setRoutingOptions,
  RoutingStrategy,
  RoutingOptions
} from "@/services/aiService";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("providers");
  const [settings, setSettings] = useState(getSettingsManager().getSettings());
  const [routingOptions, setRoutingOptionsState] = useState<RoutingOptions>(getRoutingOptions());
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<Record<string, string[]>>({});
  const [isTestingKey, setIsTestingKey] = useState<Record<string, boolean>>({});
  
  // Temporary form state
  const [formState, setFormState] = useState({
    claude: {
      apiKey: "",
      model: ""
    },
    openai: {
      apiKey: "",
      model: ""
    },
    gemini: {
      apiKey: "",
      model: ""
    }
  });

  useEffect(() => {
    // Load settings
    const currentSettings = getSettingsManager().getSettings();
    setSettings(currentSettings);
    
    // Initialize form state from settings
    setFormState({
      claude: {
        apiKey: "", // Don't show the actual API key for security
        model: currentSettings.providers.claude.preferredModel
      },
      openai: {
        apiKey: "",
        model: currentSettings.providers.openai.preferredModel
      },
      gemini: {
        apiKey: "",
        model: currentSettings.providers.gemini.preferredModel
      }
    });
    
    // Load available providers
    const providers = getProviders();
    setAvailableProviders(providers);
    
    // Load available models for each provider
    providers.forEach(async (provider) => {
      const models = await getModels(provider);
      setAvailableModels(prev => ({
        ...prev,
        [provider]: models
      }));
    });
  }, []);

  const handleApiKeyChange = (provider: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider as keyof typeof prev],
        apiKey: value
      }
    }));
  };

  const handleModelChange = (provider: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider as keyof typeof prev],
        model: value
      }
    }));
    
    // Also update settings
    getSettingsManager().setPreferredModel(provider, value);
    setSettings(getSettingsManager().getSettings());
    
    toast({
      title: "Model Updated",
      description: `${provider} model updated to ${value}`,
    });
  };

  const handleSaveApiKey = async (provider: string) => {
    const apiKey = formState[provider as keyof typeof formState].apiKey;
    if (!apiKey) {
      toast({
        title: "Missing API Key",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }
    
    setIsTestingKey({ ...isTestingKey, [provider]: true });
    
    try {
      const success = await configureApiKey(provider, apiKey);
      
      if (success) {
        toast({
          title: "API Key Saved",
          description: `${provider} API key has been verified and saved`,
        });
        
        // Clear the form field
        setFormState(prev => ({
          ...prev,
          [provider]: {
            ...prev[provider as keyof typeof prev],
            apiKey: ""
          }
        }));
        
        // Refresh settings
        setSettings(getSettingsManager().getSettings());
      } else {
        toast({
          title: "Invalid API Key",
          description: `The API key for ${provider} could not be verified`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `An error occurred while saving the API key: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsTestingKey({ ...isTestingKey, [provider]: false });
    }
  };

  const handleSetActiveProvider = (provider: string) => {
    getSettingsManager().setActiveProvider(provider);
    setSettings(getSettingsManager().getSettings());
    
    toast({
      title: "Active Provider Updated",
      description: `Active provider set to ${provider}`,
    });
  };

  const handleToggleAgentFeature = (feature: string, value: boolean) => {
    const agentSettings = { ...settings.agent };
    agentSettings[feature as keyof typeof agentSettings] = value;
    
    getSettingsManager().updateAgentSettings(agentSettings);
    setSettings(getSettingsManager().getSettings());
    
    toast({
      title: "Feature Updated",
      description: `${feature} is now ${value ? "enabled" : "disabled"}`,
    });
  };
  
  const handleChangeRoutingStrategy = (strategy: RoutingStrategy) => {
    setRoutingStrategy(strategy);
    setRoutingOptionsState({
      ...routingOptions,
      strategy: strategy
    });
    
    toast({
      title: "Routing Strategy Updated",
      description: `Strategy set to ${strategy}`,
    });
  };
  
  const handleToggleRoutingOption = (option: keyof RoutingOptions, value: boolean | string) => {
    const newOptions = {
      ...routingOptions,
      [option]: value
    };
    
    setRoutingOptions(newOptions);
    setRoutingOptionsState(newOptions);
    
    toast({
      title: "Routing Option Updated",
      description: `${option} is now set to ${value}`,
    });
  };
  
  const handleUpdateNumericSetting = (feature: string, value: number) => {
    const agentSettings = { ...settings.agent };
    agentSettings[feature as keyof typeof agentSettings] = value;
    
    getSettingsManager().updateAgentSettings(agentSettings);
    setSettings(getSettingsManager().getSettings());
    
    toast({
      title: "Setting Updated",
      description: `${feature} is now set to ${value}`,
    });
  };

  return (
    <div className="container py-8">
      <h1 className="font-orbitron text-3xl text-cyber-bright-blue mb-8">Settings</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
          <TabsTrigger value="agent">Agent Features</TabsTrigger>
          <TabsTrigger value="routing">Model Routing</TabsTrigger>
          <TabsTrigger value="export">Export & Deploy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="providers">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Provider</CardTitle>
                <CardDescription>
                  Select which AI provider to use for code generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {availableProviders.map(provider => (
                    <Button
                      key={provider}
                      variant={settings.activeProvider === provider ? "default" : "outline"}
                      onClick={() => handleSetActiveProvider(provider)}
                    >
                      {provider}
                      {settings.activeProvider === provider && " (Active)"}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {availableProviders.map(provider => (
              <Card key={provider}>
                <CardHeader>
                  <CardTitle>{provider.charAt(0).toUpperCase() + provider.slice(1)}</CardTitle>
                  <CardDescription>
                    Configure {provider} API key and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${provider}-api-key`}>API Key</Label>
                    <div className="flex space-x-2">
                      <Input
                        id={`${provider}-api-key`}
                        type="password"
                        placeholder="Enter API key"
                        value={formState[provider as keyof typeof formState].apiKey}
                        onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => handleSaveApiKey(provider)}
                        disabled={isTestingKey[provider]}
                      >
                        {isTestingKey[provider] ? "Testing..." : "Save Key"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Status: {settings.providers[provider as keyof typeof settings.providers]?.apiKey ? "Configured" : "Not Configured"}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`${provider}-model`}>Preferred Model</Label>
                    <Select
                      value={formState[provider as keyof typeof formState].model}
                      onValueChange={(value) => handleModelChange(provider, value)}
                    >
                      <SelectTrigger id={`${provider}-model`}>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels[provider]?.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="agent">
          <Card>
            <CardHeader>
              <CardTitle>Agent Features</CardTitle>
              <CardDescription>
                Configure how the AI assistant breaks down tasks and maintains context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="task-breakdown">Task Breakdown</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically break down complex tasks into smaller steps
                  </p>
                </div>
                <Switch
                  id="task-breakdown"
                  checked={settings.agent.enableTaskBreakdown}
                  onCheckedChange={(value) => handleToggleAgentFeature('enableTaskBreakdown', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="iteration">Iterative Refinement</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically refine code through multiple iterations
                  </p>
                </div>
                <Switch
                  id="iteration"
                  checked={settings.agent.enableIteration}
                  onCheckedChange={(value) => handleToggleAgentFeature('enableIteration', value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="context-memory">Context Memory</Label>
                  <p className="text-sm text-muted-foreground">
                    Remember context from previous interactions
                  </p>
                </div>
                <Switch
                  id="context-memory"
                  checked={settings.agent.enableContextMemory}
                  onCheckedChange={(value) => handleToggleAgentFeature('enableContextMemory', value)}
                />
              </div>
              
              {settings.agent.enableIteration && (
                <div className="space-y-2">
                  <Label htmlFor="max-iterations">Maximum Iterations</Label>
                  <Select
                    value={settings.agent.maxIterations.toString()}
                    onValueChange={(value) => handleUpdateNumericSetting('maxIterations', parseInt(value))}
                  >
                    <SelectTrigger id="max-iterations">
                      <SelectValue placeholder="Select max iterations" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="routing">
          <Card>
            <CardHeader>
              <CardTitle>Model Routing Strategy</CardTitle>
              <CardDescription>
                Choose how the system selects which AI model to use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={routingOptions.strategy === 'user-selected' ? "default" : "outline"}
                    onClick={() => handleChangeRoutingStrategy('user-selected')}
                    className="h-auto py-4 flex flex-col items-start text-left"
                  >
                    <span className="font-bold mb-1">Manual Selection</span>
                    <span className="text-sm font-normal">Use the provider you select manually</span>
                  </Button>
                  
                  <Button
                    variant={routingOptions.strategy === 'cost-optimized' ? "default" : "outline"}
                    onClick={() => handleChangeRoutingStrategy('cost-optimized')}
                    className="h-auto py-4 flex flex-col items-start text-left"
                  >
                    <span className="font-bold mb-1">Cost Optimized</span>
                    <span className="text-sm font-normal">Choose the most cost-effective provider</span>
                  </Button>
                  
                  <Button
                    variant={routingOptions.strategy === 'performance-optimized' ? "default" : "outline"}
                    onClick={() => handleChangeRoutingStrategy('performance-optimized')}
                    className="h-auto py-4 flex flex-col items-start text-left"
                  >
                    <span className="font-bold mb-1">Performance Optimized</span>
                    <span className="text-sm font-normal">Choose the most accurate provider</span>
                  </Button>
                  
                  <Button
                    variant={routingOptions.strategy === 'balanced' ? "default" : "outline"}
                    onClick={() => handleChangeRoutingStrategy('balanced')}
                    className="h-auto py-4 flex flex-col items-start text-left"
                  >
                    <span className="font-bold mb-1">Balanced</span>
                    <span className="text-sm font-normal">Balance cost and performance based on prompt complexity</span>
                  </Button>
                </div>
              </div>
              
              {routingOptions.strategy === 'balanced' && (
                <div className="space-y-4 border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium">Balanced Strategy Options</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="prompt-complexity">Prompt Complexity</Label>
                    <Select
                      value={routingOptions.promptComplexity || 'medium'}
                      onValueChange={(value) => handleToggleRoutingOption('promptComplexity', value as 'low' | 'medium' | 'high')}
                    >
                      <SelectTrigger id="prompt-complexity">
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Simple code snippets</SelectItem>
                        <SelectItem value="medium">Medium - Standard functions/components</SelectItem>
                        <SelectItem value="high">High - Complex systems/algorithms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="prioritize-cost">Prioritize Cost</Label>
                      <p className="text-sm text-muted-foreground">
                        Prefer cheaper models when possible
                      </p>
                    </div>
                    <Switch
                      id="prioritize-cost"
                      checked={routingOptions.prioritizeCost || false}
                      onCheckedChange={(value) => handleToggleRoutingOption('prioritizeCost', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="prioritize-accuracy">Prioritize Accuracy</Label>
                      <p className="text-sm text-muted-foreground">
                        Prefer more accurate models when possible
                      </p>
                    </div>
                    <Switch
                      id="prioritize-accuracy"
                      checked={routingOptions.prioritizeAccuracy || false}
                      onCheckedChange={(value) => handleToggleRoutingOption('prioritizeAccuracy', value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export & Deploy Options</CardTitle>
              <CardDescription>
                Configure code export and deployment settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Basic export and deployment options are available in the current version.</p>
              <p className="text-sm text-muted-foreground mt-2">Use the Export and Deploy buttons after generating code.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;