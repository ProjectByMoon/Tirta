export type SuggestionCategory = 'Saran' | 'Keluhan' | 'Masukan';
export type SuggestionPriority = 'normal';
export type SuggestionStatus = 'Baru' | 'Diproses' | 'Selesai';

export interface SuggestionDraft {
  title: string;
  content: string;
  category: SuggestionCategory;
}
