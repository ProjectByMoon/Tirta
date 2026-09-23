import type { SuggestionDraft } from './types';

export function validateSuggestionDraft(draft: SuggestionDraft): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push('Judul saran wajib diisi.');
  if (draft.title.trim().length > 150) errors.push('Judul maksimal 150 karakter.');
  if (!draft.content.trim()) errors.push('Isi saran wajib diisi.');
  if (draft.content.trim().length > 5000) errors.push('Isi saran maksimal 5000 karakter.');
  if (!draft.category) errors.push('Kategori wajib dipilih.');
  return errors;
}
