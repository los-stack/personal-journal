export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  images?: JournalEntryImage[];
}

export interface JournalEntryImage {
  id: string;
  url: string;
  created_at: string;
}

export type EntryMood = "happy" | "neutral" | "sad" | "excited" | "calm" | "anxious" | null;
