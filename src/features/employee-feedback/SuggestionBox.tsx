import React, { useState } from 'react';
import type { SuggestionCategory, SuggestionDraft } from './types';
import { validateSuggestionDraft } from './suggestion-service';

const categories: SuggestionCategory[] = ['Saran', 'Keluhan', 'Masukan'];

export default function SuggestionBox({
  onSubmit,
}: {
  onSubmit?: (draft: SuggestionDraft) => Promise<void> | void;
}) {
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
      setErrors([error instanceof Error ? error.message : 'Saran gagal dikirim. Coba lagi.']);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <section className="portal-card suggestion-box suggestion-success" aria-live="polite">
        <div className="suggestion-success-icon" aria-hidden="true">✓</div>
        <span className="card-kicker">TERKIRIM</span>
        <h2>Saran berhasil dikirim</h2>
        <p>Masukan Anda sudah diterima HR dan dapat ditindaklanjuti sesuai proses internal.</p>
        <button type="button" className="portal-primary" onClick={() => {
          setSent(false);
          setErrors([]);
          setDraft({ title: '', content: '', category: 'Saran' });
        }}>Kirim saran lain</button>
      </section>
    );
  }

  return (
    <form className="portal-card suggestion-box employee-form" onSubmit={submit} aria-label="Kotak Saran">
      <div className="suggestion-header">
        <div>
          <span className="card-kicker">KOTAK SARAN</span>
          <h2>Sampaikan Masukan</h2>
          <p className="muted">Sampaikan saran, keluhan, atau ide perbaikan kepada HR.</p>
        </div>
        <span className="suggestion-security">Untuk HR</span>
      </div>

      {errors.length > 0 && (
        <div className="portal-error compact" role="alert">
          {errors.map((x) => <div key={x}>{x}</div>)}
        </div>
      )}

      <div className="form-two suggestion-form-grid">
        <label>Judul
          <input aria-invalid={errors.some((x) => x.includes('Judul'))} maxLength={150} minLength={3} required value={draft.title} onChange={(e) => update({ title: e.target.value })} placeholder="Contoh: Usulan perbaikan ruang istirahat" />
        </label>
        <label>Kategori
          <select value={draft.category} onChange={(e) => update({ category: e.target.value as SuggestionCategory })}>
            {categories.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <label>Isi Masukan
        <textarea maxLength={5000} minLength={5} required rows={7} value={draft.content}
          onChange={(e) => update({ content: e.target.value })} placeholder="Tuliskan saran, keluhan, atau masukan Anda..." />
        <small>{draft.content.length}/5000 karakter</small>
      </label>

      <div className="suggestion-footer">
        <small>Jangan masukkan kata sandi, PIN, atau data finansial sensitif.</small>
        <button type="submit" className="portal-primary" disabled={busy}>{busy ? 'Mengirim...' : 'Kirim Saran'}</button>
      </div>
    </form>
  );
}
