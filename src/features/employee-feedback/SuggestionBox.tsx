import React, { useState } from 'react';
import type { SuggestionCategory, SuggestionDraft } from './types';
import { validateSuggestionDraft } from './suggestion-service';
import { useTranslation } from '../../locales/LanguageContext';

const categories: SuggestionCategory[] = ['Saran', 'Keluhan', 'Masukan'];
const categoryKeys: Record<SuggestionCategory, string> = {
  Saran: 'suggestion',
  Keluhan: 'complaint',
  Masukan: 'feedback',
};

export default function SuggestionBox({ onSubmit }: { onSubmit?: (draft: SuggestionDraft) => Promise<void> | void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<SuggestionDraft>({ title: '', content: '', category: 'Saran' });
  const [errors, setErrors] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const update = (patch: Partial<SuggestionDraft>) => setDraft((v) => ({ ...v, ...patch }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validateSuggestionDraft(draft);
    setErrors(nextErrors);
    if (nextErrors.length || busy) return;
    setBusy(true);
    try {
      await onSubmit?.(draft);
      setSent(true);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'suggestion_failed']);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <section className="portal-card suggestion-box suggestion-success" aria-live="polite">
        <div className="suggestion-success-icon" aria-hidden="true">✓</div>
        <span className="card-kicker">{t('suggestion_sent_kicker')}</span>
        <h2>{t('suggestion_sent_title')}</h2>
        <p>{t('suggestion_sent_desc')}</p>
        <button type="button" className="portal-primary" onClick={() => {
          setSent(false);
          setErrors([]);
          setDraft({ title: '', content: '', category: 'Saran' });
        }}>{t('suggestion_send_another')}</button>
      </section>
    );
  }

  return (
    <form className="portal-card suggestion-box employee-form" onSubmit={submit} aria-label={t('suggestion_box')}>
      <div className="suggestion-header">
        <div>
          <span className="card-kicker">{t('suggestion_box').toUpperCase()}</span>
          <h2>{t('suggestion_share_title')}</h2>
          <p className="muted">{t('suggestion_share_desc')}</p>
        </div>
        <span className="suggestion-security">{t('for_hr')}</span>
      </div>

      {errors.length > 0 && (
        <div className="portal-error compact" role="alert">
          {errors.map((x) => <div key={x}>{t(x)}</div>)}
        </div>
      )}

      <div className="form-two suggestion-form-grid">
        <label>{t('suggestion_title')}
          <input
            aria-invalid={errors.some((x) => x === 'suggestion_title_required' || x === 'suggestion_title_max')}
            maxLength={150}
            minLength={3}
            required
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder={t('suggestion_title_placeholder')}
          />
        </label>
        <label>{t('suggestion_category')}
          <select value={draft.category} onChange={(e) => update({ category: e.target.value as SuggestionCategory })}>
            {categories.map((value) => <option key={value} value={value}>{t(categoryKeys[value])}</option>)}
          </select>
        </label>
      </div>

      <label>{t('suggestion_content')}
        <textarea
          maxLength={5000}
          minLength={5}
          required
          rows={7}
          value={draft.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder={t('suggestion_content_placeholder')}
        />
        <small>{draft.content.length}/5000 {t('characters')}</small>
      </label>

      <div className="suggestion-footer">
        <small>{t('sensitive_data_note')}</small>
        <button type="submit" className="portal-primary" disabled={busy}>{busy ? t('sending') : t('send_suggestion')}</button>
      </div>
    </form>
  );
}
