/**
 * Text-to-Speech Service Interface
 * Defines the contract for TTS functionality
 */

/**
 * TTS Engine Type enum
 */
export enum TTSEngineType {
  WEB_SPEECH_API = 'web_speech_api',
  CLOUD_TTS = 'cloud_tts',
  LOCAL_TTS = 'local_tts'
}

/**
 * TTS Voice Configuration
 */
export interface TTSVoiceConfig {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
}

/**
 * TTS Voice Preference (stored in settings)
 */
export interface TTSVoicePreference {
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
}

/**
 * TTS Code Configuration
 */
export interface TTSCodeConfig {
  enabled: boolean;
  speakPunctuation: boolean;
  useAlternativeVoice: boolean;
  skipComments: boolean;
  verbosityLevel: 'minimal' | 'normal' | 'detailed';
}

/**
 * TTS Settings
 */
export interface TTSSettings {
  enabled: boolean;
  engineType: TTSEngineType;
  defaultVoice: TTSVoicePreference;
  codeConfig: TTSCodeConfig;
  autoStart: boolean;
  skipMarkdown: boolean;
}

/**
 * TTS Playback Event enum
 */
export enum TTSPlaybackEvent {
  START = 'start',
  PAUSE = 'pause',
  RESUME = 'resume',
  END = 'end',
  ERROR = 'error',
  BOUNDARY = 'boundary',
  SEGMENT_START = 'segment_start',
  SEGMENT_END = 'segment_end'
}

/**
 * TTS Playback Status enum
 */
export enum TTSPlaybackStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused'
}

/**
 * TTS Event Callback type
 */
export type TTSEventCallback = (event: TTSPlaybackEvent, data?: any) => void;

/**
 * TTS Speech Segment type
 */
export interface TTSSpeechSegment {
  text: string;
  type: 'normal' | 'code' | 'heading' | 'list' | 'technical';
  lang?: string;
}

/**
 * TTS Service Interface
 */
export interface TTSService {
  // Initialization
  initialize(): Promise<boolean>;
  
  // Voice management
  getAvailableVoices(): SpeechSynthesisVoice[];
  setVoice(voiceURI: string): boolean;
  configureVoice(config: Partial<TTSVoicePreference>): void;
  
  // Code speech configuration
  configureCodeSpeech(config: Partial<TTSCodeConfig>): void;
  
  // Settings management
  toggleEnabled(enabled: boolean): void;
  setAutoStart(autoStart: boolean): void;
  getSettings(): TTSSettings;
  updateSettings(settings: Partial<TTSSettings>): void;
  
  // Content processing
  processText(text: string): TTSSpeechSegment[];
  
  // Playback controls
  speak(text: string): boolean;
  speakRaw(text: string): boolean;
  queue(text: string): boolean;
  play(): boolean;
  pause(): boolean;
  resume(): boolean;
  stop(): boolean;
  skipNext(): boolean;
  skipPrevious(): boolean;
  getStatus(): TTSPlaybackStatus;
  
  // Event handling
  addEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void;
  removeEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void;
}

/**
 * TTS Player Interface
 * Interface for the underlying playback mechanism
 */
export interface TTSPlayer {
  // Initialization
  init(): boolean;
  
  // Voice configuration
  setVoiceConfig(config: TTSVoiceConfig): void;
  
  // Queue management
  addToQueue(segments: TTSSpeechSegment | TTSSpeechSegment[]): void;
  clearQueue(): void;
  
  // Playback controls
  play(): boolean;
  pause(): boolean;
  resume(): boolean;
  stop(): boolean;
  skipNext(): boolean;
  skipPrevious(): boolean;
  getStatus(): TTSPlaybackStatus;
  
  // Event handling
  addEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void;
  removeEventListener(event: TTSPlaybackEvent, callback: TTSEventCallback): void;
}