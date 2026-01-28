export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  created_at: string;
  updated_at: string;
}

export type EntryMood = "happy" | "neutral" | "sad" | "excited" | "calm" | "anxious" | null;
