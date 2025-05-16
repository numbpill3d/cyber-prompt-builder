import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/ui/icons';
import { modeService } from '@/services/mode/mode-service';
import { Mode } from '@/services/mode/mode-types';
import { cn } from '@/lib/utils';

interface ModeDocumentationProps {
  className?: string;
}

const ModeDocumentation: React.FC<ModeDocumentationProps> = ({ className }) => {
  const modes = modeService.getAllModes();
  const defaultModes = modes.filter(mode => !mode.isCustom);
  const customModes = modes.filter(mode => mode.isCustom);
  
  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="text-2xl font-bold tracking-tight">Mode Documentation</h2>
      <p className="text-muted-foreground">
        The Mode system allows you to switch between different operational personas to tailor the AI's behavior to your specific needs.
      </p>
      
      <Tabs defaultValue="default" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="default">Default Modes</TabsTrigger>
          <TabsTrigger value="custom">Custom Modes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="default" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defaultModes.map(mode => (
              <ModeCard key={mode.id} mode={mode} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-4 mt-4">
          {customModes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customModes.map(mode => (
                <ModeCard key={mode.id} mode={mode} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  You haven't created any custom modes yet. Create one from the mode selector in the navbar.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      <h3 className="text-xl font-bold tracking-tight mt-8">When to Use Each Mode</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.Code className="h-5 w-5" />
              Code Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Best for:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Writing new code</li>
              <li>Debugging existing code</li>
              <li>Implementing specific features</li>
              <li>Code optimization</li>
              <li>Refactoring</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.Building2 className="h-5 w-5" />
              Architect Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Best for:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>System design planning</li>
              <li>Directory structure setup</li>
              <li>Technology stack selection</li>
              <li>Design pattern implementation</li>
              <li>Architecture reviews</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.HelpCircle className="h-5 w-5" />
              Ask Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Best for:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Learning about concepts</li>
              <li>Understanding code behavior</li>
              <li>Exploring alternatives</li>
              <li>Getting explanations</li>
              <li>Researching technologies</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <h3 className="text-xl font-bold tracking-tight mt-8">Creating Custom Modes</h3>
      <p className="text-muted-foreground mt-2">
        You can create custom modes for specific tasks like DevOps, QA testing, or bug hunting. 
        Custom modes allow you to define:
      </p>
      <ul className="list-disc pl-5 space-y-1 mt-2">
        <li>A specialized system prompt</li>
        <li>Preferred response format and tone</li>
        <li>Whether to include explanations and examples</li>
        <li>Custom instructions for the AI</li>
      </ul>
    </div>
  );
};

interface ModeCardProps {
  mode: Mode;
}

const ModeCard: React.FC<ModeCardProps> = ({ mode }) => {
  // Get the icon component
  const getIcon = () => {
    if (mode.icon && Icons[mode.icon as keyof typeof Icons]) {
      const IconComponent = Icons[mode.icon as keyof typeof Icons];
      return <IconComponent className="h-5 w-5" />;
    }
    
    // Default icons based on mode ID
    if (mode.id === 'code') return <Icons.Code className="h-5 w-5" />;
    if (mode.id === 'architect') return <Icons.Building2 className="h-5 w-5" />;
    if (mode.id === 'ask') return <Icons.HelpCircle className="h-5 w-5" />;
    
    // Fallback to first letter
    return (
      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
        {mode.name.charAt(0)}
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getIcon()}
          {mode.name}
          {mode.isCustom && (
            <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-md">Custom</span>
          )}
        </CardTitle>
        <CardDescription>{mode.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium">System Prompt:</h4>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{mode.systemPrompt}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Preferences:</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
              <div className="text-xs">Tone: <span className="text-muted-foreground">{mode.userPreferences.tone}</span></div>
              <div className="text-xs">Format: <span className="text-muted-foreground">{mode.userPreferences.format.replace(/_/g, ' ')}</span></div>
              <div className="text-xs">Explanations: <span className="text-muted-foreground">{mode.userPreferences.includeExplanations ? 'Yes' : 'No'}</span></div>
              <div className="text-xs">Examples: <span className="text-muted-foreground">{mode.userPreferences.includeExamples ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <button 
          className="text-xs text-primary hover:underline"
          onClick={() => modeService.setActiveMode(mode.id)}
        >
          Switch to this mode
        </button>
      </CardFooter>
    </Card>
  );
};

export default ModeDocumentation;
