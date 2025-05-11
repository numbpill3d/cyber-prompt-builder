/**
 * TTS Service
 * Core Text-to-Speech service implementation
 */

import { settingsManager } from '../settings-manager';
import { TTSPlayer } from './tts-player';
import {
  TTSCodeConfig,
  TTSEngineType,
  TTSEventCallback,
  TTSPlaybackEvent,
  TTSPlaybackStatus,
  TTSSpeechSegment,
  TTSSettings,
  TTSVoiceConfig,
  TTSVoicePreference
} from './tts-types';

// Default TTS settings
const DEFAULT_TTS_SETTINGS: TTSSettings = {
  enabled: true,
  engineType: TTSEngineType.WEB_SPEECH_API,
  defaultVoice: {
    voiceURI: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  },
  codeConfig: {
    enabled: true,
    speakPunctuation: true,
    useAlternativeVoice: false,
    skipComments: true,
    verbosityLevel: 'normal'
  },
  autoStart: false,
  skipMarkdown: true
};

/**
 * Text-to-Speech Service
 * Integrates with settings manager and handles TTS functionality
 */
export class TTSService {
  private player: TTSPlayer;
  private initialized: boolean = false;
  private settings: TTSSettings;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private voiceMap: Map<string, SpeechSynthesisVoice> = new Map();
  private pendingContent: string = '';

  constructor() {
    this.player = new TTSPlayer();
    this.settings = this.loadSettings();
  }

  /**
   * Initialize the TTS service
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported in this browser');
      return false;
    }

    const playerInitialized = this.player.init();
    if (!playerInitialized) {
      return false;
    }

    // Get available voices
    await this.loadVoices();

    // Apply configured voice
    this.applyVoicePreference(this.settings.defaultVoice);

    // Set up event listeners
    this.player.addEventListener(TTSPlaybackEvent.ERROR, (event, error) => {
      console.error('TTS playback error:', error);
    });

    this.initialized = true;
    return true;
  }

  /**
   * Load voices from speech synthesis
   * Note: Voices may load asynchronously in some browsers
   */
  private async loadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      
      // Try to get voices immediately
      let voices = synth.getVoices();
      
      if (voices.length > 0) {
        this.processVoices(voices);
        resolve(voices);
      } else {
        // Wait for voices to be loaded
        const onVoicesChanged = () => {
          voices = synth.getVoices();
          synth.removeEventListener('voiceschanged', onVoicesChanged);
          this.processVoices(voices);
          resolve(voices);
        };
        
        synth.addEventListener('voiceschanged', onVoicesChanged);
      }
    });
  }

  /**
   * Process and store available voices
   */
  private processVoices(voices: SpeechSynthesisVoice[]): void {
    this.availableVoices = voices;
    this.voiceMap.clear();
    
    for (const voice of voices) {
      this.voiceMap.set(voice.voiceURI, voice);
    }
    
    // Try to restore saved voice preference
    const savedVoice = this.settings.defaultVoice;
    if (savedVoice && savedVoice.voiceURI) {
      this.applyVoicePreference(savedVoice);
    }
  }

  /**
   * Load TTS settings from the settings manager
   */
  private loadSettings(): TTSSettings {
    const appSettings = settingsManager.getSettings();
    
    // Check if TTS settings exist in app settings
    if (!appSettings.tts) {
      // Initialize TTS settings with defaults
      this.saveSettings(DEFAULT_TTS_SETTINGS);
      return DEFAULT_TTS_SETTINGS;
    }
    
    // Merge with defaults to ensure all properties exist
    return {
      ...DEFAULT_TTS_SETTINGS,
      ...appSettings.tts
    };
  }

  /**
   * Save TTS settings to the settings manager
   */
  private saveSettings(settings: TTSSettings): void {
    const appSettings = settingsManager.getSettings();
    
    settingsManager.updateSettings({
      ...appSettings,
      tts: settings
    });
    
    this.settings = settings;
  }

  /**
   * Apply voice preference to the TTS player
   */
  private applyVoicePreference(preference: TTSVoicePreference): boolean {
    // Find the voice by URI
    const voice = this.voiceMap.get(preference.voiceURI) || null;
    
    // Apply voice configuration
    this.player.setVoiceConfig({
      voice,
      rate: preference.rate,
      pitch: preference.pitch,
      volume: preference.volume
    });
    
    return !!voice;
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return [...this.availableVoices];
  }

  /**
   * Set preferred voice
   */
  public setVoice(voiceURI: string): boolean {
    const voice = this.voiceMap.get(voiceURI);
    if (!voice) {
      console.error(`Voice with URI ${voiceURI} not found`);
      return false;
    }
    
    const newPreference: TTSVoicePreference = {
      ...this.settings.defaultVoice,
      voiceURI
    };
    
    this.settings.defaultVoice = newPreference;
    this.saveSettings(this.settings);
    
    return this.applyVoicePreference(newPreference);
  }

  /**
   * Configure voice parameters
   */
  public configureVoice(config: Partial<TTSVoicePreference>): void {
    const newPreference: TTSVoicePreference = {
      ...this.settings.defaultVoice,
      ...config
    };
    
    this.settings.defaultVoice = newPreference;
    this.saveSettings(this.settings);
    
    this.applyVoicePreference(newPreference);
  }

  /**
   * Configure code speech settings
   */
  public configureCodeSpeech(config: Partial<TTSCodeConfig>): void {
    this.settings.codeConfig = {
      ...this.settings.codeConfig,
      ...config
    };
    
    this.saveSettings(this.settings);
  }

  /**
   * Toggle TTS enabled state
   */
  public toggleEnabled(enabled: boolean): void {
    if (this.settings.enabled === enabled) {
      return;
    }
    
    this.settings.enabled = enabled;
    this.saveSettings(this.settings);
    
    if (!enabled && this.player.getStatus() === TTSPlaybackStatus.PLAYING) {
      this.player.stop();
    }
  }

  /**
   * Set auto-start option
   */
  public setAutoStart(autoStart: boolean): void {
    this.settings.autoStart = autoStart;
    this.saveSettings(this.settings);
  }

  /**
   * Process text into speech segments
   */
  public processText(text: string): TTSSpeechSegment[] {
    if (!text) return [];
    
    const segments: TTSSpeechSegment[] = [];
    
    // Check for code blocks
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)\n```/g;
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      const beforeText = text.substring(lastIndex, match.index).trim();
      if (beforeText) {
        segments.push(this.createTextSegment(beforeText));
      }
      
      // Add code block if enabled
      if (this.settings.codeConfig.enabled) {
        const lang = match[1] || 'code';
        let codeText = match[2];
        
        // Remove comments if configured
        if (this.settings.codeConfig.skipComments) {
          codeText = this.removeComments(codeText, lang);
        }
        
        segments.push({
          text: codeText,
          type: 'code',
          lang
        });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex).trim();
      if (remainingText) {
        segments.push(this.createTextSegment(remainingText));
      }
    }
    
    return segments;
  }

  /**
   * Create a text segment from raw text
   */
  private createTextSegment(text: string): TTSSpeechSegment {
    // Check if it's a heading
    if (/^#{1,6}\s+.+$/m.test(text)) {
      return {
        text: text.replace(/^#{1,6}\s+(.+)$/m, '$1'),
        type: 'heading'
      };
    }
    
    // Check if it's a list
    if (/^[\s]*[-*•]\s+.+$/m.test(text)) {
      return {
        text,
        type: 'list'
      };
    }
    
    // Check for technical content
    if (this.containsTechnicalContent(text)) {
      return {
        text,
        type: 'technical'
      };
    }
    
    // Default to normal text
    return {
      text,
      type: 'normal'
    };
  }

  /**
   * Check if text contains technical content
   */
  private containsTechnicalContent(text: string): boolean {
    // Simple heuristic - check for common technical terms, symbols, etc.
    const technicalPatterns = [
      /API|REST|JSON|HTML|CSS|JS|TS|URL|HTTP|SQL|UI|UX/,
      /function|const|let|var|import|export|class|interface/,
      /\{\}|\[\]|\(\)|=>|\+\+|--|&&|\|\|/
    ];
    
    return technicalPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Remove comments from code
   */
  private removeComments(code: string, language: string): string {
    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'js':
      case 'ts':
      case 'java':
      case 'c':
      case 'cpp':
      case 'csharp':
      case 'cs':
        // Remove C-style comments
        return code
          .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
          .replace(/\/\/.*$/gm, '');        // Single-line comments
        
      case 'python':
      case 'py':
        // Remove Python comments
        return code
          .replace(/'''[\s\S]*?'''/g, '')   // Multi-line docstrings
          .replace(/"""[\s\S]*?"""/g, '')   // Multi-line docstrings
          .replace(/#.*$/gm, '');           // Single-line comments
        
      case 'html':
        // Remove HTML comments
        return code.replace(/<!--[\s\S]*?-->/g, '');
        
      case 'css':
        // Remove CSS comments
        return code.replace(/\/\*[\s\S]*?\*\//g, '');
        
      default:
        // Generic comment removal (best effort)
        return code
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '')
          .replace(/#.*$/gm, '')
          .replace(/<!--[\s\S]*?-->/g, '');
    }
  }

  /**
   * Speak text
   */
  public speak(text: string): boolean {
    if (!this.initialized) {
      this.pendingContent = text;
      this.initialize().then(initialized => {
        if (initialized && this.pendingContent) {
          this.speak(this.pendingContent);
          this.pendingContent = '';
        }
      });
      return false;
    }
    
    if (!this.settings.enabled) {
      return false;
    }
    
    const segments = this.processText(text);
    this.player.clearQueue();
    this.player.addToQueue(segments);
    return this.player.play();
  }

  /**
   * Speak raw text without processing
   */
  public speakRaw(text: string): boolean {
    if (!this.initialized || !this.settings.enabled) {
      return false;
    }
    
    this.player.clearQueue();
    this.player.addToQueue({
      text,
      type: 'normal'
    });
    return this.player.play();
  }

  /**
   * Queue text for speaking
   */
  public queue(text: string): boolean {
    if (!this.initialized) {
      this.initialize().then(initialized => {
        if (initialized) {
          this.queue(text);
        }
      });
      return false;
    }
    
    if (!this.settings.enabled) {
      return false;
    }
    
    const segments = this.processText(text);
    this.player.addToQueue(segments);
    
    // Auto-start if configured and not already playing
    if (this.settings.autoStart && this.player.getStatus() !== TTSPlaybackStatus.PLAYING) {
      return this.player.play();
    }
    
    return true;
  }

  /**
   * Control playback - play
   */
  public play(): boolean {
    return this.initialized && this.settings.enabled ? this.player.play() : false;
  }

  /**
   * Control playback - pause
   */
  public pause(): boolean {
    return this.initialized ? this.player.pause() : false;
  }

  /**
   * Control playback - resume
   */
  public resume(): boolean {
    return this.initialized && this.settings.enabled ? this.player.resume() : false;
  }

  /**
   * Control playback - stop
   */
  public stop(): boolean {
    return this.initialized ? this.player.stop() : false;
  }

  /**
   * Control playback - skip to next segment
   */
  public skipNext(): boolean {
    return this.initialized ? this.player.skipNext() : false;
  }

  /**
   * Control playback - skip to previous segment
   */
  public skipPrevious(): boolean {
    return this.initialized ? this.player.skipPrevious() : false;
  }

  /**
   * Get current playback status
   */
  public getStatus(): TTSPlaybackStatus {
    return this.initialized ? this.player.getStatus() : TTSPlaybackStatus.IDLE;
  }

  /**
   * Get current TTS settings
   */
  public getSettings(): TTSSettings {
    return { ...this.settings };
  }

  /**
   * Update TTS settings
   */
  public updateSettings(settings: Partial<TTSSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings
    };
    
    this.saveSettings(this.settings);
    
    // Apply voice configuration if changed
    if (settings.defaultVoice) {
      this.applyVoicePreference(this.settings.defaultVoice);
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void {
    this.player.addEventListener(event, callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void {
    this.player.removeEventListener(event, callback);
  }
}

// Create singleton instance
export const ttsService = new TTSService();