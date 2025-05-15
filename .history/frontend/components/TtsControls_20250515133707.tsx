import { useState, useEffect } from 'react';
import { useTTSService } from '@frontend/hooks/use-tts-service';
import {
  TTSPlaybackStatus,
  TTSPlaybackEvent,
  TTSVoicePreference
} from '@shared/interfaces/tts-service';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@frontend/components/ui/card';
import { Button } from '@frontend/components/ui/button';
import { Slider } from '@frontend/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@frontend/components/ui/select';
import { 
  Play, 
  Pause, 
  Stop, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Settings,
  Mic
} from 'lucide-react';
import { Switch } from '@frontend/components/ui/switch';
import { Label } from '@frontend/components/ui/label';
import { LoadingSpinner } from './ui/loading-spinner';

export default function TtsControls() {
  // Service hook
  const { ttsService, isLoading: isServiceLoading, error: serviceError } = useTTSService();
  
  // State
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [playbackStatus, setPlaybackStatus] = useState<TTSPlaybackStatus>(TTSPlaybackStatus.IDLE);
  const [isEnabled, setIsEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Load voices and current settings on mount
  useEffect(() => {
    if (ttsService) {
      const voices = ttsService.getAvailableVoices();
      setAvailableVoices(voices);
      
      const settings = ttsService.getSettings();
      setIsEnabled(settings.enabled);
      setSelectedVoice(settings.defaultVoice.voiceURI);
      setRate(settings.defaultVoice.rate);
      setPitch(settings.defaultVoice.pitch);
      setVolume(settings.defaultVoice.volume);
      
      // Setup event listeners
      ttsService.addEventListener(TTSPlaybackEvent.START, handlePlaybackEvent);
      ttsService.addEventListener(TTSPlaybackEvent.PAUSE, handlePlaybackEvent);
      ttsService.addEventListener(TTSPlaybackEvent.RESUME, handlePlaybackEvent);
      ttsService.addEventListener(TTSPlaybackEvent.END, handlePlaybackEvent);
      
      // Poll status initially
      setPlaybackStatus(ttsService.getStatus());
      
      // Poll status every second
      const statusInterval = setInterval(() => {
        if (ttsService) {
          setPlaybackStatus(ttsService.getStatus());
        }
      }, 1000);
      
      // Cleanup event listeners
      return () => {
        clearInterval(statusInterval);
        if (ttsService) {
          ttsService.removeEventListener(TTSPlaybackEvent.START, handlePlaybackEvent);
          ttsService.removeEventListener(TTSPlaybackEvent.PAUSE, handlePlaybackEvent);
          ttsService.removeEventListener(TTSPlaybackEvent.RESUME, handlePlaybackEvent);
          ttsService.removeEventListener(TTSPlaybackEvent.END, handlePlaybackEvent);
        }
      };
    }
  }, [ttsService]);
  
  // Event handler for TTS events
  const handlePlaybackEvent = (event: TTSPlaybackEvent) => {
    if (!ttsService) return;
    
    // Update the playback status when events occur
    setPlaybackStatus(ttsService.getStatus());
  };
  
  // Handle playback controls
  const handlePlay = () => {
    if (!ttsService) return;
    
    if (playbackStatus === TTSPlaybackStatus.PAUSED) {
      ttsService.resume();
    } else {
      ttsService.play();
    }
  };
  
  const handlePause = () => {
    if (!ttsService) return;
    ttsService.pause();
  };
  
  const handleStop = () => {
    if (!ttsService) return;
    ttsService.stop();
  };
  
  const handlePrevious = () => {
    if (!ttsService) return;
    ttsService.skipPrevious();
  };
  
  const handleNext = () => {
    if (!ttsService) return;
    ttsService.skipNext();
  };
  
  // Handle voice selection
  const handleVoiceChange = (voiceURI: string) => {
    if (!ttsService) return;
    
    setSelectedVoice(voiceURI);
    ttsService.setVoice(voiceURI);
  };
  
  // Handle voice configuration changes
  const handleRateChange = (value: number[]) => {
    if (!ttsService) return;
    
    const newRate = value[0];
    setRate(newRate);
    ttsService.configureVoice({ rate: newRate });
  };
  
  const handlePitchChange = (value: number[]) => {
    if (!ttsService) return;
    
    const newPitch = value[0];
    setPitch(newPitch);
    ttsService.configureVoice({ pitch: newPitch });
  };
  
  const handleVolumeChange = (value: number[]) => {
    if (!ttsService) return;
    
    const newVolume = value[0];
    setVolume(newVolume);
    ttsService.configureVoice({ volume: newVolume });
  };
  
  // Handle TTS enabled toggle
  const handleToggleEnabled = (enabled: boolean) => {
    if (!ttsService) return;
    
    setIsEnabled(enabled);
    ttsService.toggleEnabled(enabled);
  };
  
  // Save current voice config as default
  const saveVoicePreference = () => {
    if (!ttsService) return;
    
    const voicePreference: TTSVoicePreference = {
      voiceURI: selectedVoice,
      rate,
      pitch,
      volume
    };
    
    ttsService.configureVoice(voicePreference);
    ttsService.updateSettings({ defaultVoice: voicePreference });
  };
  
  // Loading or error states
  if (isServiceLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex justify-center">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p>Loading TTS Service...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (serviceError) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">TTS Service Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to initialize the TTS Service. Check console for details.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full cyberborder ice-card hover-glow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-orbitron text-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-cyber-bright-blue animate-pulse"></div>
              Text-to-Speech Controls
            </CardTitle>
            <CardDescription>
              Manage voice playback and configuration
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggleEnabled}
              id="tts-enabled"
            />
            <Label htmlFor="tts-enabled">Enabled</Label>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Voice selection */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Voice</label>
          <Select
            value={selectedVoice}
            onValueChange={handleVoiceChange}
            disabled={!isEnabled || availableVoices.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {availableVoices.map(voice => (
                <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Playback controls */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={!isEnabled || playbackStatus === TTSPlaybackStatus.IDLE}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          {playbackStatus === TTSPlaybackStatus.PLAYING ? (
            <Button
              variant="default"
              size="icon"
              onClick={handlePause}
              disabled={!isEnabled}
              className="col-span-3 bg-cyber-bright-blue hover:bg-cyber-bright-blue/80"
            >
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={handlePlay}
              disabled={!isEnabled}
              className="col-span-3 bg-cyber-bright-blue hover:bg-cyber-bright-blue/80"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={!isEnabled || playbackStatus === TTSPlaybackStatus.IDLE}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleStop}
            disabled={!isEnabled || playbackStatus === TTSPlaybackStatus.IDLE}
            className="col-start-5"
          >
            <Stop className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Playback status */}
        <div className="mb-6 flex items-center justify-center">
          <div className="text-sm text-center">
            {playbackStatus === TTSPlaybackStatus.IDLE && 'Ready'}
            {playbackStatus === TTSPlaybackStatus.LOADING && (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Preparing audio...</span>
              </div>
            )}
            {playbackStatus === TTSPlaybackStatus.PLAYING && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Playing</span>
              </div>
            )}
            {playbackStatus === TTSPlaybackStatus.PAUSED && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Paused</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Volume control */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Volume</label>
            <span className="text-xs">{Math.round(volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-4">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              disabled={!isEnabled}
              className="flex-1"
            />
          </div>
        </div>
        
        {/* Advanced settings toggle */}
        <Button 
          variant="ghost" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-center gap-2 mt-2"
        >
          <Settings className="h-4 w-4" />
          {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
        </Button>
        
        {/* Advanced settings */}
        {showAdvanced && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Rate control */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Rate</label>
                <span className="text-xs">{rate.toFixed(1)}x</span>
              </div>
              <Slider
                value={[rate]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={handleRateChange}
                disabled={!isEnabled}
              />
            </div>
            
            {/* Pitch control */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Pitch</label>
                <span className="text-xs">{pitch.toFixed(1)}</span>
              </div>
              <Slider
                value={[pitch]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={handlePitchChange}
                disabled={!isEnabled}
              />
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={saveVoicePreference}
              disabled={!isEnabled}
              className="w-full"
            >
              <Mic className="h-4 w-4 mr-2" />
              Save as Default Voice
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="justify-between border-t pt-4">
        <div className="text-sm text-cyber-black font-mono">
          {isEnabled 
            ? `${availableVoices.length} voices available` 
            : 'TTS is disabled'}
        </div>
        <Button variant="ghost" size="sm" onClick={handleStop} disabled={!isEnabled}>
          Reset
        </Button>
      </CardFooter>
    </Card>
  );
}