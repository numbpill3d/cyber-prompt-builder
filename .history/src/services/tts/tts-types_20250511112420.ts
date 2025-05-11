/**
 * TTS Types
 * Type definitions for Text-to-Speech functionality
 */

/**
 * Voice configuration options
 */
export interface TTSVoiceConfig {
  voice: SpeechSynthesisVoice | null;
  rate: number;      // 0.1 to 10
  pitch: number;     // 0 to 2
  volume: number;    // 0 to 1
}

/**
 * Simplified voice representation for storage/selection
 */
export interface TTSVoicePreference {
  voiceURI: string;  // Unique identifier for voice
  rate: number;
  pitch: number;
  volume: number;
}

/**
 * Speech segment with text and optional metadata
 */
export interface TTSSpeechSegment {
  text: string;
  type: 'normal' | 'code' | 'technical' | 'heading' | 'list';
  lang?: string;     // Language for code segments
  priority?: number; // Higher priority items speak first (default: 0)
}

/**
 * Speech queue state
 */
export interface TTSSpeechQueue {
  segments: TTSSpeechSegment[];
  currentIndex: number;
  isPlaying: boolean;
}

/**
 * TTS playback status
 */
export enum TTSPlaybackStatus {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ERROR = 'error'
}

/**
 * TTS playback events
 */
export enum TTSPlaybackEvent {
  START = 'start',
  PAUSE = 'pause',
  RESUME = 'resume',
  STOP = 'stop',
  END = 'end',
  ERROR = 'error',
  SEGMENT_START = 'segment-start',
  SEGMENT_END = 'segment-end'
}

/**
 * TTS event callback
 */
export type TTSEventCallback = (event: TTSPlaybackEvent, data?: any) => void;

/**
 * TTS engine type
 */
export enum TTSEngineType {
  WEB_SPEECH_API = 'web_speech_api',
  EXTERNAL_API = 'external_api' // For future API-based TTS options
