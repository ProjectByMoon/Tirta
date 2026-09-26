import type { SuggestionDraft } from './types';

export function validateSuggestionDraft(draft: SuggestionDraft): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push('suggestion_title_required');
  if (draft.title.trim().length > 150) errors.push('suggestion_title_max');
  if (!draft.content.trim()) errors.push('suggestion_content_required');
  if (draft.content.trim().length > 5000) errors.push('suggestion_content_max');
  if (!draft.category) errors.push('suggestion_category_required');
  return errors;
}
