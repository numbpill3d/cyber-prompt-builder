/**
 * TTS Player
 * Audio playback controller for Text-to-Speech functionality
 */

import {
  TTSEventCallback,
  TTSPlaybackEvent,
  TTSPlaybackStatus,
  TTSSpeechQueue, 
  TTSSpeechSegment,
  TTSVoiceConfig
} from './tts-types';

export class TTSPlayer {
  private synth: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private queue: TTSSpeechQueue = {
    segments: [],
    currentIndex: 0,
    isPlaying: false
  };
  private voiceConfig: TTSVoiceConfig = {
    voice: null,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  };
  private status: TTSPlaybackStatus = TTSPlaybackStatus.IDLE;
  private eventListeners: Map<TTSPlaybackEvent, TTSEventCallback[]> = new Map();
  private boundHandlers: {
    onEnd: () => void;
    onError: (e: SpeechSynthesisErrorEvent) => void;
    onPause: () => void;
    onBoundary: (e: SpeechSynthesisEvent) => void;
  };

  constructor() {
    this.synth = window.speechSynthesis;
    
    // Create bound event handlers to properly handle 'this'
    this.boundHandlers = {
      onEnd: this.handleEnd.bind(this),
      onError: this.handleError.bind(this),
      onPause: this.handlePause.bind(this),
      onBoundary: this.handleBoundary.bind(this)
    };
  }

  /**
   * Initialize the TTS player
   */
  public init(): boolean {
    if (!this.synth) {
      console.error('Speech synthesis not supported in this browser');
      return false;
    }
    return true;
  }

  /**
   * Set the voice configuration
   */
  public setVoiceConfig(config: Partial<TTSVoiceConfig>): void {
    this.voiceConfig = { ...this.voiceConfig, ...config };
    
    // If we're currently speaking, update the current utterance
    if (this.utterance && this.status === TTSPlaybackStatus.PLAYING) {
      this.applyVoiceConfig(this.utterance);
    }
  }

  /**
   * Get available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  /**
   * Apply voice configuration to an utterance
   */
  private applyVoiceConfig(utterance: SpeechSynthesisUtterance): void {
    utterance.voice = this.voiceConfig.voice;
    utterance.rate = this.voiceConfig.rate;
    utterance.pitch = this.voiceConfig.pitch;
