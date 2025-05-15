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
    utterance.volume = this.voiceConfig.volume;
  }

  /**
   * Clear the current queue
   */
  public clearQueue(): void {
    this.queue.segments = [];
    this.queue.currentIndex = 0;
    this.queue.isPlaying = false;
  }

  /**
   * Add segments to the speech queue
   */
  public addToQueue(segments: TTSSpeechSegment | TTSSpeechSegment[]): void {
    const segmentsToAdd = Array.isArray(segments) ? segments : [segments];
    
    // Sort by priority if provided
    const sortedSegments = [...segmentsToAdd].sort((a, b) => 
      (b.priority || 0) - (a.priority || 0)
    );
    
    this.queue.segments.push(...sortedSegments);
  }

  /**
   * Start playing from the queue
   */
  public play(): boolean {
    if (this.status === TTSPlaybackStatus.PLAYING) {
      return true;
    }

    if (this.queue.segments.length === 0) {
      console.warn('TTS play called but queue is empty');
      return false;
    }

    if (this.status === TTSPlaybackStatus.PAUSED) {
      this.resume();
      return true;
    }

    return this.playNextSegment();
  }

  /**
   * Play the next segment in the queue
   */
  private playNextSegment(): boolean {
    if (this.queue.currentIndex >= this.queue.segments.length) {
      this.emitEvent(TTSPlaybackEvent.END);
      this.status = TTSPlaybackStatus.IDLE;
      return false;
    }

    const segment = this.queue.segments[this.queue.currentIndex];
    const text = this.preprocessText(segment);
    
    if (!text) {
      this.queue.currentIndex++;
      return this.playNextSegment();
    }

    this.utterance = new SpeechSynthesisUtterance(text);
    this.applyVoiceConfig(this.utterance);

    // Special handling for code segments
    if (segment.type === 'code' && segment.lang) {
      // Apply special voice settings for code if needed
      // This could be extended to use a different voice for code
    }

    // Add event listeners
    this.utterance.onend = this.boundHandlers.onEnd;
    this.utterance.onerror = this.boundHandlers.onError;
    this.utterance.onpause = this.boundHandlers.onPause;
    this.utterance.onboundary = this.boundHandlers.onBoundary;

    try {
      this.synth.speak(this.utterance);
      this.status = TTSPlaybackStatus.PLAYING;
      this.queue.isPlaying = true;
      this.emitEvent(TTSPlaybackEvent.START, segment);
      this.emitEvent(TTSPlaybackEvent.SEGMENT_START, {
        index: this.queue.currentIndex,
        segment
      });
      return true;
    } catch (error) {
      console.error('Error speaking:', error);
      this.status = TTSPlaybackStatus.ERROR;
      this.emitEvent(TTSPlaybackEvent.ERROR, error);
      return false;
    }
  }

  /**
   * Preprocess text based on segment type
   */
  private preprocessText(segment: TTSSpeechSegment): string {
    let text = segment.text;

    switch (segment.type) {
      case 'code':
        // Format code for better speech
        text = this.preprocessCodeText(text, segment.lang || 'unknown');
        break;
      case 'technical':
        // Handle technical terms, acronyms, etc.
        text = this.preprocessTechnicalText(text);
        break;
      case 'heading':
        // Add slight pause after headings
        text = `${text}. `;
        break;
      case 'list':
        // Format list items for better speech
        text = text.replace(/^\s*[-*•]\s*/gm, 'Item: ');
        break;
    }
    
    return text;
  }

  /**
   * Preprocess code text for better speech
   */
  private preprocessCodeText(text: string, language: string): string {
    // Remove excessive whitespace
    let processed = text.replace(/\s+/g, ' ');
    
    // Replace common symbols with words
    processed = processed
      .replace(/\{/g, ' open curly brace ')
      .replace(/\}/g, ' close curly brace ')
      .replace(/\(/g, ' open parenthesis ')
      .replace(/\)/g, ' close parenthesis ')
      .replace(/\[/g, ' open bracket ')
      .replace(/\]/g, ' close bracket ')
      .replace(/;/g, ' semicolon ')
      .replace(/=/g, ' equals ')
      .replace(/==/g, ' equals equals ')
      .replace(/===/g, ' triple equals ')
      .replace(/\+/g, ' plus ')
      .replace(/\-/g, ' minus ')
      .replace(/\*/g, ' times ')
      .replace(/\//g, ' divided by ')
      .replace(/\|\|/g, ' logical or ')
      .replace(/&&/g, ' logical and ');
      
    return `${language} code: ${processed}`;
  }

  /**
   * Preprocess technical text for better speech
   */
  private preprocessTechnicalText(text: string): string {
    // Handle common acronyms and technical terms
    return text
      .replace(/API/g, 'A P I')
      .replace(/REST/g, 'REST')
      .replace(/JSON/g, 'Jason')
      .replace(/HTML/g, 'H T M L')
      .replace(/CSS/g, 'C S S')
      .replace(/JS/g, 'JavaScript')
      .replace(/TS/g, 'TypeScript')
      .replace(/URL/g, 'U R L')
      .replace(/HTTP/g, 'H T T P')
      .replace(/HTTPS/g, 'H T T P S')
      .replace(/SQL/g, 'S Q L')
      .replace(/UI/g, 'U I')
      .replace(/UX/g, 'U X');
  }

  /**
   * Pause playback
   */
  public pause(): boolean {
    if (this.status !== TTSPlaybackStatus.PLAYING) {
      return false;
    }

    this.synth.pause();
    this.status = TTSPlaybackStatus.PAUSED;
    this.emitEvent(TTSPlaybackEvent.PAUSE);
    return true;
  }

  /**
   * Resume playback
   */
  public resume(): boolean {
    if (this.status !== TTSPlaybackStatus.PAUSED) {
      return false;
    }

    this.synth.resume();
    this.status = TTSPlaybackStatus.PLAYING;
    this.emitEvent(TTSPlaybackEvent.RESUME);
    return true;
  }

  /**
   * Stop playback
   */
  public stop(): boolean {
    this.synth.cancel();
    this.status = TTSPlaybackStatus.IDLE;
    this.queue.isPlaying = false;
    this.emitEvent(TTSPlaybackEvent.STOP);
    return true;
  }

  /**
   * Skip to the next segment
   */
  public skipNext(): boolean {
    if (this.queue.currentIndex >= this.queue.segments.length - 1) {
      return false;
    }

    const wasPlaying = this.status === TTSPlaybackStatus.PLAYING;
    this.synth.cancel();
    this.queue.currentIndex++;
    
    return wasPlaying ? this.playNextSegment() : true;
  }

  /**
   * Skip to the previous segment
   */
  public skipPrevious(): boolean {
    if (this.queue.currentIndex <= 0) {
      return false;
    }

    const wasPlaying = this.status === TTSPlaybackStatus.PLAYING;
    this.synth.cancel();
    this.queue.currentIndex--;
    
    return wasPlaying ? this.playNextSegment() : true;
  }

  /**
   * Get current playback status
   */
  public getStatus(): TTSPlaybackStatus {
    return this.status;
  }

  /**
   * Get current queue
   */
  public getQueue(): TTSSpeechQueue {
    return { ...this.queue };
  }

  /**
   * Add event listener
   */
  public addEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: TTSPlaybackEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        callback(event, data);
      }
    }
  }

  /**
   * Handle end of utterance event
   */
  private handleEnd(): void {
    this.emitEvent(TTSPlaybackEvent.SEGMENT_END, {
      index: this.queue.currentIndex,
      segment: this.queue.segments[this.queue.currentIndex]
    });
    
    this.queue.currentIndex++;
    this.playNextSegment();
  }

  /**
   * Handle error event
   */
  private handleError(event: SpeechSynthesisErrorEvent): void {
    console.error('Speech synthesis error:', event);
    this.status = TTSPlaybackStatus.ERROR;
    this.emitEvent(TTSPlaybackEvent.ERROR, event);
    
    // Try to recover by moving to next segment
    this.queue.currentIndex++;
    this.playNextSegment();
  }

  /**
   * Handle pause event
   */
  private handlePause(): void {
    this.status = TTSPlaybackStatus.PAUSED;
    this.emitEvent(TTSPlaybackEvent.PAUSE);
  }

  /**
   * Handle boundary event (word/sentence boundaries)
   */
  private handleBoundary(event: SpeechSynthesisEvent): void {
    // Could be used for word highlighting, etc.
  }
}