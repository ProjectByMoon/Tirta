import { useState } from 'react';
import type { Announcement, AnnouncementCategory, AnnouncementPriority, AnnouncementAudience } from './types';
import { validateAnnouncementDraft } from './service';

export default function AdminAnnouncementManager({
  announcements,
  onCreate,
  onTerbitkan,
  onArchive,
}: {
  announcements: Announcement[];
  onCreate?: (draft: {
    title: string;
    body: string;
    category: AnnouncementCategory;
    priority: AnnouncementPriority;
    audience: AnnouncementAudience;
    pinned: boolean;
    publishAt?: string;
    expiresAt?: string;
  }) => Promise<void> | void;
  onTerbitkan?: (id: string) => void;
  onArchive?: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('general');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [pinned, setPinned] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  async function create() {
    const draft = { title, body, category, priority, audience: {type:'all'} as const, pinned };
    const e = validateAnnouncementDraft(draft);
    setErrors(e);
    if (e.length) return;
    await onCreate?.(draft);
    setMessage('Draft pengumuman berhasil dibuat.');
    setTitle(''); setBody('');
  }

  return (
    <section className="announcement-module" aria-label="Announcement Management">
      <div className="announcement-hero">
        <div>
          <span className="announcement-kicker">PENGUMUMAN</span>
          <h2>Kelola Pengumuman</h2>
          <p>Buat, terbitkan, dan kelola informasi resmi untuk karyawan.</p>
        </div>
        <div className="announcement-hero-icon" aria-hidden="true">📢</div>
      </div>

      {message && <div className="announcement-success" role="status">✓ {message}</div>}
      {errors.length > 0 && (
        <div className="announcement-error" role="alert">
          <strong>Periksa kembali:</strong>
          {errors.map(x => <div key={x}>{x}</div>)}
        </div>
      )}

      <div className="announcement-compose">
        <div className="announcement-section-head">
          <div>
            <span className="announcement-kicker">BUAT BARU</span>
            <h3>Draft Pengumuman</h3>
          </div>
          <span className="announcement-audience">Semua Karyawan</span>
        </div>

        <div className="announcement-form-grid">
          <label className="announcement-field announcement-field-wide">
            <span>Judul Pengumuman</span>
            <input maxLength={200} value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Informasi perubahan jadwal kerja" />
          </label>
          <label className="announcement-field">
            <span>Kategori</span>
            <select value={category} onChange={e => setCategory(e.target.value as AnnouncementCategory)}>
              <option value="general">Umum</option><option value="hr">HR</option>
              <option value="attendance">Kehadiran</option><option value="holiday">Libur</option>
              <option value="important">Penting</option><option value="urgent">Mendesak</option>
            </select>
          </label>
          <label className="announcement-field">
            <span>Prioritas</span>
            <select value={priority} onChange={e => setPriority(e.target.value as AnnouncementPriority)}>
              <option value="normal">Normal</option><option value="important">Penting</option><option value="urgent">Mendesak</option>
            </select>
          </label>
          <label className="announcement-field announcement-field-wide">
            <span>Isi Pengumuman</span>
            <textarea maxLength={20000} rows={8} value={body} onChange={e => setBody(e.target.value)} placeholder="Tulis informasi yang ingin disampaikan kepada karyawan..." />
          </label>
        </div>

        <div className="announcement-compose-footer">
          <label className="announcement-pin">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} />
            <span>Sematkan pengumuman di atas</span>
          </label>
          <button type="button" className="announcement-primary" onClick={create}>Simpan Draft</button>
        </div>
      </div>

      <div className="announcement-list-card">
        <div className="announcement-section-head">
          <div>
            <span className="announcement-kicker">ARSIP & PUBLIKASI</span>
            <h3>Daftar Pengumuman</h3>
          </div>
          <span className="announcement-count">{announcements.length} item</span>
        </div>

        {announcements.length === 0 ? (
          <div className="announcement-empty">Belum ada pengumuman. Buat draft pertama dari panel di atas.</div>
        ) : (
          <div className="announcement-list">
            {announcements.map(a => (
              <article key={a.id} className="announcement-item">
                <div className="announcement-item-main">
                  <div className="announcement-item-title-row">
                    {a.pinned && <span className="announcement-pinned">📌 Tersemat</span>}
                    <strong>{a.title}</strong>
                  </div>
                  <div className="announcement-meta">
                    <span>{a.category}</span><span>•</span><span>{a.priority}</span><span>•</span><span className={`announcement-status status-${a.status}`}>{a.status}</span>
                    {a.recipientCount !== undefined && <><span>•</span><span>Dibaca {a.readCount ?? 0}/{a.recipientCount}</span></>}
                  </div>
                </div>
                <div className="announcement-item-actions">
                  {a.status === 'draft' && <button type="button" className="announcement-secondary" onClick={() => onTerbitkan?.(a.id)}>Terbitkan</button>}
                  {a.status !== 'archived' && <button type="button" className="announcement-archive" onClick={() => onArchive?.(a.id)}>Arsipkan</button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
