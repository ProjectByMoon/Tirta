import type { AnnouncementDraft } from './types';

export function validateAnnouncementDraft(draft: AnnouncementDraft): string[] {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push('announcement_title_required');
  if (draft.title.trim().length > 200) errors.push('announcement_title_max');
  if (!draft.body.trim()) errors.push('announcement_body_required');
  if (draft.body.trim().length > 20000) errors.push('announcement_body_max');
  if (!draft.category) errors.push('announcement_category_required');
  if (!draft.priority) errors.push('announcement_priority_required');
  if (draft.expiresAt && draft.publishAt && draft.expiresAt < draft.publishAt) {
    errors.push('announcement_expiry_invalid');
  }
  return errors;
}
