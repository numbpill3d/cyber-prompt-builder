/**
 * Text-to-Speech Service Implementation
 * Implements the TTSService interface using Web Speech API
 */

import {
  TTSService,
  TTSPlayer,
  TTSVoiceConfig,
  TTSVoicePreference,
  TTSCodeConfig,
  TTSSettings,
  TTSPlaybackEvent,
  TTSPlaybackStatus,
  TTSEventCallback,
  TTSSpeechSegment,
  TTSEngineType
} from '../../core/interfaces/tts-service';
import { getService } from '../../core/services/service-locator';
import { SettingsManager } from '../../core/interfaces/settings-manager';

/**
 * Web Speech API implementation of TTSPlayer
 */
class WebSpeechPlayer implements TTSPlayer {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private voiceConfig: TTSVoiceConfig = {
    voice: null,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  };
  private queue: TTSSpeechSegment[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private status: TTSPlaybackStatus = TTSPlaybackStatus.IDLE;
  private eventListeners: Map<TTSPlaybackEvent, TTSEventCallback[]> = new Map();
  private loadingVoices: boolean = false;

  constructor() {
    this.synth = window.speechSynthesis;
    this.initVoices();
  }

  /**
   * Initialize voices
   */
  private async initVoices(): Promise<void> {
    if (this.loadingVoices) return;
    this.loadingVoices = true;

    // Get available voices
    let voices = this.synth.getVoices();
    
    // If no voices are available, wait for voiceschanged event
    if (voices.length === 0) {
      try {
        await new Promise<void>((resolve) => {
          const voicesChangedHandler = () => {
            this.synth.removeEventListener('voiceschanged', voicesChangedHandler);
            resolve();
          };
          this.synth.addEventListener('voiceschanged', voicesChangedHandler);
          
          // Set a timeout just in case
          setTimeout(() => {
            this.synth.removeEventListener('voiceschanged', voicesChangedHandler);
            resolve();
          }, 3000);
        });
        
        voices = this.synth.getVoices();
      } catch (error) {
        console.error('Error loading voices:', error);
      }
    }
    
    this.voices = voices;
    this.loadingVoices = false;
  }

  /**
   * Initialize the player
   */
  init(): boolean {
    if (!this.synth) {
      console.error('Speech synthesis not supported in this browser');
      return false;
    }
    
    this.initVoices();
    return true;
  }

  /**
   * Set voice configuration
   */
  setVoiceConfig(config: TTSVoiceConfig): void {
    this.voiceConfig = { ...this.voiceConfig, ...config };
  }

  /**
   * Add segments to the speech queue
   */
  addToQueue(segments: TTSSpeechSegment | TTSSpeechSegment[]): void {
    const segmentsArray = Array.isArray(segments) ? segments : [segments];
    this.queue.push(...segmentsArray);
    
    // If not currently speaking, start
    if (this.status === TTSPlaybackStatus.IDLE) {
      this.play();
    }
  }

  /**
   * Clear the speech queue
   */
  clearQueue(): void {
    this.queue = [];
    if (this.currentUtterance) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
    this.status = TTSPlaybackStatus.IDLE;
    this.emitEvent(TTSPlaybackEvent.END);
  }

  /**
   * Play speech
   */
  play(): boolean {
    if (this.status === TTSPlaybackStatus.PLAYING) return true;
    if (this.queue.length === 0) return false;
    
    if (this.status === TTSPlaybackStatus.PAUSED) {
      this.synth.resume();
      this.status = TTSPlaybackStatus.PLAYING;
      this.emitEvent(TTSPlaybackEvent.RESUME);
      return true;
    }
    
    // Start playing from queue
    this.status = TTSPlaybackStatus.PLAYING;
    this.processNextInQueue();
    return true;
  }

  /**
   * Pause speech
   */
  pause(): boolean {
    if (this.status !== TTSPlaybackStatus.PLAYING) return false;
    
    this.synth.pause();
    this.status = TTSPlaybackStatus.PAUSED;
    this.emitEvent(TTSPlaybackEvent.PAUSE);
    return true;
  }

  /**
   * Resume speech
   */
  resume(): boolean {
    if (this.status !== TTSPlaybackStatus.PAUSED) return false;
    
    this.synth.resume();
    this.status = TTSPlaybackStatus.PLAYING;
    this.emitEvent(TTSPlaybackEvent.RESUME);
    return true;
  }

  /**
   * Stop speech
   */
  stop(): boolean {
    if (this.status === TTSPlaybackStatus.IDLE) return false;
    
    this.synth.cancel();
    this.currentUtterance = null;
    this.queue = [];
    this.status = TTSPlaybackStatus.IDLE;
    this.emitEvent(TTSPlaybackEvent.END);
    return true;
  }

  /**
   * Skip to next segment
   */
  skipNext(): boolean {
    if (this.queue.length === 0 && !this.currentUtterance) return false;
    
    // Cancel current utterance and process next
    this.synth.cancel();
    this.currentUtterance = null;
    this.processNextInQueue();
    return true;
  }

  /**
   * Skip to previous segment (not supported in Web Speech API)
   */
  skipPrevious(): boolean {
    // This isn't well supported in Web Speech API
    // Would require maintaining a history of spoken segments
    return false;
  }

  /**
   * Get current playback status
   */
  getStatus(): TTSPlaybackStatus {
    return this.status;
  }

  /**
   * Add event listener
   */
  addEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event)!;
    const index = listeners.indexOf(callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Process next item in queue
   */
  private processNextInQueue(): void {
    if (this.queue.length === 0) {
      this.status = TTSPlaybackStatus.IDLE;
      this.emitEvent(TTSPlaybackEvent.END);
      return;
    }
    
    const segment = this.queue.shift()!;
    this.emitEvent(TTSPlaybackEvent.SEGMENT_START, segment);
    
    const utterance = new SpeechSynthesisUtterance(segment.text);
    
    // Apply voice config
    utterance.voice = this.voiceConfig.voice;
    utterance.rate = this.voiceConfig.rate;
    utterance.pitch = this.voiceConfig.pitch;
    utterance.volume = this.voiceConfig.volume;
    
    // Apply special settings for code if needed
    if (segment.type === 'code') {
      // Could slow down rate for code
      utterance.rate = Math.max(0.8, utterance.rate - 0.2);
    }
    
    // Set language if specified
    if (segment.lang) {
      utterance.lang = segment.lang;
    }
    
    // Set up event handlers
    utterance.onstart = () => {
      this.emitEvent(TTSPlaybackEvent.START);
    };
    
    utterance.onend = () => {
      this.currentUtterance = null;
      this.emitEvent(TTSPlaybackEvent.SEGMENT_END, segment);
      
      // Process next item if there is one
      if (this.queue.length > 0 && this.status === TTSPlaybackStatus.PLAYING) {
        this.processNextInQueue();
      } else if (this.queue.length === 0) {
        this.status = TTSPlaybackStatus.IDLE;
        this.emitEvent(TTSPlaybackEvent.END);
      }
    };
    
    utterance.onerror = (event) => {
      console.error('TTS error:', event);
      this.emitEvent(TTSPlaybackEvent.ERROR, event);
      this.currentUtterance = null;
      
      // Try next item
      if (this.queue.length > 0 && this.status === TTSPlaybackStatus.PLAYING) {
        this.processNextInQueue();
      } else {
        this.status = TTSPlaybackStatus.IDLE;
      }
    };
    
    utterance.onboundary = (event) => {
      this.emitEvent(TTSPlaybackEvent.BOUNDARY, event);
    };
    
    // Speak the utterance
    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: TTSPlaybackEvent, data?: any): void {
    if (!this.eventListeners.has(event)) return;
    
    for (const callback of this.eventListeners.get(event)!) {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in TTS event listener:', error);
      }
    }
  }
}

/**
 * Implementation of TTSService
 */
export class TTSServiceImpl implements TTSService {
  private player: TTSPlayer;
  private settings: TTSSettings;
  private settingsManager: SettingsManager;
  private eventListeners: Map<TTSPlaybackEvent, TTSEventCallback[]> = new Map();
  private initialized: boolean = false;
  
  constructor() {
    // Create player instance
    this.player = new WebSpeechPlayer();
    
    // Default settings
    this.settings = {
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
      autoStart: true,
      skipMarkdown: true
    };
    
    // Try to get settings manager
    try {
      this.settingsManager = getService<SettingsManager>('settingsManager');
    } catch (error) {
      console.warn('Settings manager not available, using default TTS settings');
    }
    
    // Set up event forwarding
    this.forwardPlayerEvents();
  }

  /**
   * Initialize the TTS service
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    
    // Initialize player
    const playerInitialized = this.player.init();
    if (!playerInitialized) {
      console.error('Failed to initialize TTS player');
      return false;
    }
    
    // Load saved settings if available
    if (this.settingsManager) {
      try {
        const appSettings = this.settingsManager.getSettings();
        if (appSettings.tts) {
          this.settings = {...this.settings, ...appSettings.tts};
        } else {
          // Save default settings
          this.saveSettings();
        }
      } catch (error) {
        console.error('Error loading TTS settings:', error);
      }
    }
    
    // Apply settings to player
    const voices = this.getAvailableVoices();
    let voice = null;
    
    if (this.settings.defaultVoice.voiceURI && voices.length > 0) {
      voice = voices.find(v => v.voiceURI === this.settings.defaultVoice.voiceURI) || voices[0];
    } else if (voices.length > 0) {
      // Pick a default voice - prefer English
      voice = voices.find(v => v.lang.startsWith('en-')) || voices[0];
    }
    
    this.player.setVoiceConfig({
      voice,
      rate: this.settings.defaultVoice.rate,
      pitch: this.settings.defaultVoice.pitch,
      volume: this.settings.defaultVoice.volume
    });
    
    this.initialized = true;
    return true;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return window.speechSynthesis.getVoices();
  }

  /**
   * Set voice by URI
   */
  setVoice(voiceURI: string): boolean {
    const voices = this.getAvailableVoices();
    const voice = voices.find(v => v.voiceURI === voiceURI);
    
    if (!voice) return false;
    
    this.player.setVoiceConfig({
      ...this.player.getStatus() === TTSPlaybackStatus.IDLE ? this.player['voiceConfig'] : {},  // Not ideal to access private prop
      voice
    });
    
    this.settings.defaultVoice.voiceURI = voiceURI;
    this.saveSettings();
    
    return true;
  }

  /**
   * Configure voice settings
   */
  configureVoice(config: Partial<TTSVoicePreference>): void {
    this.settings.defaultVoice = {
      ...this.settings.defaultVoice,
      ...config
    };
    
    // Apply to player
    const voices = this.getAvailableVoices();
    const voice = voices.find(v => v.voiceURI === this.settings.defaultVoice.voiceURI) || null;
    
    this.player.setVoiceConfig({
      voice,
      rate: this.settings.defaultVoice.rate,
      pitch: this.settings.defaultVoice.pitch,
      volume: this.settings.defaultVoice.volume
    });
    
    this.saveSettings();
  }

  /**
   * Configure code speech settings
   */
  configureCodeSpeech(config: Partial<TTSCodeConfig>): void {
    this.settings.codeConfig = {
      ...this.settings.codeConfig,
      ...config
    };
    
    this.saveSettings();
  }

  /**
   * Toggle TTS enabled state
   */
  toggleEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    
    if (!enabled) {
      this.stop();
    }
    
    this.saveSettings();
  }

  /**
   * Set auto-start
   */
  setAutoStart(autoStart: boolean): void {
    this.settings.autoStart = autoStart;
    this.saveSettings();
  }

  /**
   * Get current settings
   */
  getSettings(): TTSSettings {
    return {...this.settings};
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<TTSSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings
    };
    
    // Apply relevant settings to player
    if (settings.defaultVoice) {
      const voices = this.getAvailableVoices();
      const voice = voices.find(v => v.voiceURI === settings.defaultVoice!.voiceURI) || null;
      
      this.player.setVoiceConfig({
        voice,
        rate: settings.defaultVoice.rate,
        pitch: settings.defaultVoice.pitch,
        volume: settings.defaultVoice.volume
      });
    }
    
    this.saveSettings();
  }

  /**
   * Process text into speech segments
   */
  processText(text: string): TTSSpeechSegment[] {
    if (!text) return [];
    
    const segments: TTSSpeechSegment[] = [];
    
    // Simple code block detection
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      const textBefore = text.substring(lastIndex, match.index).trim();
      if (textBefore) {
        segments.push({
          text: textBefore,
          type: 'normal'
        });
      }
      
      // Add code block if not skipped
      if (this.settings.codeConfig.enabled) {
        let codeText = match[2].trim();
        
        // Handle code based on settings
        if (this.settings.codeConfig.skipComments) {
          // Remove common comment patterns
          codeText = codeText
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/#.*$/gm, '')
            .replace(/--.*$/gm, '');
        }
        
        if (this.settings.codeConfig.speakPunctuation) {
          // Replace common punctuation with spoken words
          codeText = codeText
            .replace(/\(/g, ' open parenthesis ')
            .replace(/\)/g, ' close parenthesis ')
            .replace(/\{/g, ' open brace ')
            .replace(/\}/g, ' close brace ')
            .replace(/\[/g, ' open bracket ')
            .replace(/\]/g, ' close bracket ')
            .replace(/;/g, ' semicolon ')
            .replace(/:/g, ' colon ')
            .replace(/\./g, ' dot ')
            .replace(/,/g, ' comma ')
            .replace(/=/g, ' equals ')
            .replace(/\+/g, ' plus ')
            .replace(/-/g, ' minus ')
            .replace(/\*/g, ' asterisk ')
            .replace(/\//g, ' slash ')
            .replace(/&/g, ' ampersand ')
            .replace(/\|/g, ' pipe ')
            .replace(/</g, ' less than ')
            .replace(/>/g, ' greater than ')
            .replace(/!/g, ' exclamation ')
            .replace(/\?/g, ' question mark ');
        }
        
        // Add the processed code
        segments.push({
          text: `Code in ${match[1] || 'code block'}: ${codeText}`,
          type: 'code'
        });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex).trim();
      if (remainingText) {
        segments.push({
          text: remainingText,
          type: 'normal'
        });
      }
    }
    
    return segments;
  }

  /**
   * Speak text
   */
  speak(text: string): boolean {
    if (!this.settings.enabled) return false;
    
    const segments = this.processText(text);
    if (segments.length === 0) return false;
    
    this.player.clearQueue();
    this.player.addToQueue(segments);
    return true;
  }

  /**
   * Speak raw text without processing
   */
  speakRaw(text: string): boolean {
    if (!this.settings.enabled) return false;
    
    this.player.clearQueue();
    this.player.addToQueue({
      text,
      type: 'normal'
    });
    return true;
  }

  /**
   * Queue text to speak
   */
  queue(text: string): boolean {
    if (!this.settings.enabled) return false;
    
    const segments = this.processText(text);
    if (segments.length === 0) return false;
    
    this.player.addToQueue(segments);
    return true;
  }

  /**
   * Play queued speech
   */
  play(): boolean {
    if (!this.settings.enabled) return false;
    return this.player.play();
  }

  /**
   * Pause speech
   */
  pause(): boolean {
    return this.player.pause();
  }

  /**
   * Resume speech
   */
  resume(): boolean {
    if (!this.settings.enabled) return false;
    return this.player.resume();
  }

  /**
   * Stop speech
   */
  stop(): boolean {
    return this.player.stop();
  }

  /**
   * Skip to next segment
   */
  skipNext(): boolean {
    return this.player.skipNext();
  }

  /**
   * Skip to previous segment
   */
  skipPrevious(): boolean {
    return this.player.skipPrevious();
  }

  /**
   * Get playback status
   */
  getStatus(): TTSPlaybackStatus {
    return this.player.getStatus();
  }

  /**
   * Add event listener
   */
  addEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)!.push(callback);
    this.player.addEventListener(event, callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event)!;
    const index = listeners.indexOf(callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    
    this.player.removeEventListener(event, callback);
  }

  /**
   * Forward player events to service listeners
   */
  private forwardPlayerEvents(): void {
    Object.values(TTSPlaybackEvent).forEach(event => {
      this.player.addEventListener(event, (eventType, data) => {
        if (!this.eventListeners.has(eventType)) return;
        
        for (const callback of this.eventListeners.get(eventType)!) {
          try {
            callback(eventType, data);
          } catch (error) {
            console.error('Error in TTS event listener:', error);
          }
        }
      });
    });
  }

  /**
   * Save settings
   */
  private saveSettings(): void {
    if (!this.settingsManager) return;
    
    try {
      const appSettings = this.settingsManager.getSettings();
      this.settingsManager.updateSettings({
        ...appSettings,
        tts: this.settings
      });
    } catch (error) {
      console.error('Error saving TTS settings:', error);
    }
  }
}

// Factory function
export function createTTSService(): TTSService {
  return new TTSServiceImpl();
}