export interface JournalEntry {
  id: number;
  user_id: string;
  ambience: string;
  text: string;
  emotion: string | null;
  keywords: string[] | null;
  summary: string | null;
  created_at: string;
}

export interface Insights {
  totalEntries: number;
  topEmotion: string | null;
  mostUsedAmbience: string | null;
  recentKeywords: string[];
}