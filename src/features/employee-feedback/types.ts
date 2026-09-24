export type SuggestionCategory = 'Saran' | 'Keluhan' | 'Masukan';
export type SuggestionPriority = 'normal';
export type SuggestionStatus = 'Baru' | 'Diproses' | 'Selesai';

export interface SuggestionDraft {
  title: string;
  content: string;
  category: SuggestionCategory;
}


export interface Suggestion {
  id: string;
  title: string;
  content: string;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  status: SuggestionStatus;
  anonymous: boolean;
  submittedBy?: string | null;
}

export interface Suggestion {
  id: string;
  title: string;
  content: string;
  category: SuggestionCategory;
  priority: SuggestionPriority;
  status: SuggestionStatus;
  anonymous: boolean;
  submittedBy?: string | null;
}
