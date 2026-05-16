// ==========================================
// Music Mood Insight — Shared Types
// ==========================================

export type EmotionLabel =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'fearful'
  | 'disgusted'
  | 'neutral'
  | 'calm'
  | 'excited';

export interface EmotionScores {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  fearful: number;
  disgusted: number;
  neutral: number;
}

export interface AnalysisResult {
  dominantEmotion: EmotionLabel;
  emotionScores: EmotionScores;
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
  aiInterpretation: string;
  reasoning?: string; // AI's internal reasoning
  source: 'face' | 'text' | 'both';
  searchKeywords?: string[]; // Deep AI keywords
}

export interface DeezerTrack {
  id: string;
  name: string;
  artist: string;
  albumName: string;
  albumImage: string;
  previewUrl: string | null;
  deezerUrl: string;
}

export interface MoodResult {
  analysis: AnalysisResult;
  tracks: DeezerTrack[];
  timestamp: number;
}

export const EMOTION_COLORS: Record<EmotionLabel, string> = {
  happy: '#FFE66D',
  sad: '#A7D8FF',
  angry: '#FF9F7F',
  surprised: '#DCC6FF',
  fearful: '#B8F2D6',
  disgusted: '#FFD6BA',
  neutral: '#E8E8E8',
  calm: '#B8F2D6',
  excited: '#FFC8DD',
};
