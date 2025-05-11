/**
 * TTS Controls Component
 * 
 * A UI component for controlling text-to-speech playback with voice settings.
 */

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { systemIntegration } from '../services/system-integration';
import { TTSPlaybackStatus, TTSVoicePreference } from '../services/tts/tts-types';

interface TtsControlsProps {
  initialText?: string;
  compact?: boolean;
  onStatusChange?: (status: TTSPlaybackStatus) => void;
}

export function TtsControls({
  initialText = '',
  compact = false,
  onStatusChange
}: TtsControlsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.8);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [text, setText] = useState<string>(initialText);
  const [status, setStatus] = useState<TTSPlaybackStatus>(TTSPlaybackStatus.IDLE);
  
  // Get TTS service from system integration
  const ttsService = systemIntegration.getService<any>('tts');
  
  // Initialize and load voices
  useEffect(() => {
    async function initTts() {
      try {
        // Ensure system is initialized
        await systemIntegration.initialize();
        
        // Load TTS settings
        const settings = ttsService.getSettings();
        setEnabled(settings.enabled);
        setRate(settings.defaultVoice.rate);
        setPitch(settings.defaultVoice.pitch);
        setVolume(settings.defaultVoice.volume);
        
        // Get available voices
        const availableVoices = ttsService.getAvailableVoices();
        setVoices(availableVoices);
        
        // Set selected voice if one is configured
        if (settings.defaultVoice.voiceURI) {
          setSelectedVoice(settings.defaultVoice.voiceURI);
        } else if (availableVoices.length > 0) {
          setSelectedVoice(availableVoices[0].voiceURI);
        }
        
        // Set up status change listener
        ttsService.addEventListener('statusChange', handleStatusChange);
      } catch (error) {
        console.error('Failed to initialize TTS:', error);
      }
    }
    
    initTts();
    
    // Cleanup
    return () => {
      ttsService.removeEventListener('statusChange', handleStatusChange);
    };
  }, []);
  
  // Handle status changes
  const handleStatusChange = (event: string, newStatus: TTSPlaybackStatus) => {
    setStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };
  
  // Handle voice change
  const handleVoiceChange = (value: string) => {
    setSelectedVoice(value);
    ttsService.setVoice(value);
  };
  
  // Handle rate change
  const handleRateChange = (value: number[]) => {
    const newRate = value[0];
    setRate(newRate);
    updateVoiceSettings({ rate: newRate });
  };
  
  // Handle pitch change
  const handlePitchChange = (value: number[]) => {
    const newPitch = value[0];
    setPitch(newPitch);
    updateVoiceSettings({ pitch: newPitch });
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    updateVoiceSettings({ volume: newVolume });
  };
  
  // Handle enabled toggle
  const handleEnabledToggle = (checked: boolean) => {
    setEnabled(checked);
    ttsService.toggleEnabled(checked);
  };
  
  // Update voice settings
  const updateVoiceSettings = (updates: Partial<TTSVoicePreference>) => {
    ttsService.configureVoice(updates);
  };
  
  // Playback controls
  const handlePlay = () => {
    if (text) {
      ttsService.speak(text);
    } else {
      ttsService.play();
    }
  };
  
  const handlePause = () => {
    ttsService.pause();
  };
  
  const handleResume = () => {
    ttsService.resume();
  };
  
  const handleStop = () => {
    ttsService.stop();
  };
  
  // Render compact version
  if (compact) {
    return (
      <div className="flex items-center space-x-2 w-full">
        <Button
          size="sm"
          variant="outline"
          disabled={!enabled || status === TTSPlaybackStatus.PLAYING}
          onClick={handlePlay}
        >
          Play
        </Button>
        
        {status === TTSPlaybackStatus.PLAYING ? (
          <Button size="sm" variant="outline" onClick={handlePause}>Pause</Button>
        ) : status === TTSPlaybackStatus.PAUSED ? (
          <Button size="sm" variant="outline" onClick={handleResume}>Resume</Button>
        ) : null}
        
        <Button
          size="sm"
          variant="outline"
          disabled={!enabled || status === TTSPlaybackStatus.IDLE}
          onClick={handleStop}
        >
          Stop
        </Button>
        
        <div className="flex items-center ml-auto">
          <Switch
            checked={enabled}
            onCheckedChange={handleEnabledToggle}
            id="tts-enabled-compact"
          />
          <Label htmlFor="tts-enabled-compact" className="ml-2">TTS</Label>
        </div>
      </div>
    );
  }
  
  // Render full version
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Text-to-Speech Controls</CardTitle>
        <CardDescription>Configure voice and playback settings</CardDescription>
        <div className="flex items-center space-x-2 pt-2">
          <Switch
            checked={enabled}
            onCheckedChange={handleEnabledToggle}
            id="tts-enabled"
          />
          <Label htmlFor="tts-enabled">Enable TTS</Label>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="voice-select">Voice</Label>
          <Select 
            value={selectedVoice} 
            onValueChange={handleVoiceChange}
            disabled={!enabled}
          >
            <SelectTrigger id="voice-select">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map(voice => (
                <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="rate-slider">Rate</Label>
            <span className="text-sm text-muted-foreground">{rate.toFixed(1)}x</span>
          </div>
          <Slider
            id="rate-slider"
            min={0.5}
            max={2}
            step={0.1}
            value={[rate]}
            onValueChange={handleRateChange}
            disabled={!enabled}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="pitch-slider">Pitch</Label>
            <span className="text-sm text-muted-foreground">{pitch.toFixed(1)}</span>
          </div>
          <Slider
            id="pitch-slider"
            min={0.5}
            max={2}
            step={0.1}
            value={[pitch]}
            onValueChange={handlePitchChange}
            disabled={!enabled}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="volume-slider">Volume</Label>
            <span className="text-sm text-muted-foreground">{Math.round(volume * 100)}%</span>
          </div>
          <Slider
            id="volume-slider"
            min={0}
            max={1}
            step={0.05}
            value={[volume]}
            onValueChange={handleVolumeChange}
            disabled={!enabled}
          />
        </div>
        
        {initialText === '' && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <Label htmlFor="tts-text">Text to speak</Label>
              <textarea
                id="tts-text"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to speak..."
                disabled={!enabled}
              />
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            disabled={!enabled || status === TTSPlaybackStatus.PLAYING}
            onClick={handlePlay}
          >
            Play
          </Button>
          
          {status === TTSPlaybackStatus.PLAYING ? (
            <Button variant="outline" onClick={handlePause}>Pause</Button>
          ) : status === TTSPlaybackStatus.PAUSED ? (
            <Button variant="outline" onClick={handleResume}>Resume</Button>
          ) : null}
          
          <Button
            variant="outline"
            disabled={!enabled || status === TTSPlaybackStatus.IDLE}
            onClick={handleStop}
          >
            Stop
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Status: {status === TTSPlaybackStatus.IDLE ? 'Idle' : 
                  status === TTSPlaybackStatus.PLAYING ? 'Playing' : 
                  status === TTSPlaybackStatus.PAUSED ? 'Paused' : 'Loading'}
        </div>
      </CardFooter>
    </Card>
  );
}