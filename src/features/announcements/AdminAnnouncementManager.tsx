import { useState } from 'react';
import type { Announcement, AnnouncementCategory, AnnouncementPriority, AnnouncementAudience } from './types';
import { validateAnnouncementDraft } from './service';
import { useTranslation } from '../../locales/LanguageContext';

const categoryKeys: Record<AnnouncementCategory, string> = {
  general: 'announcement_general',
  hr: 'announcement_hr',
  attendance: 'announcement_attendance',
  holiday: 'announcement_holiday',
  important: 'announcement_important',
  urgent: 'announcement_urgent',
};
const priorityKeys: Record<AnnouncementPriority, string> = {
  normal: 'announcement_normal',
  important: 'announcement_important',
  urgent: 'announcement_urgent',
};
const statusKeys: Record<Announcement['status'], string> = {
  draft: 'announcement_status_draft',
  published: 'announcement_status_published',
  expired: 'announcement_status_expired',
  archived: 'announcement_status_archived',
};

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
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('general');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [pinned, setPinned] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  async function create() {
    const draft = { title, body, category, priority, audience: { type: 'all' } as const, pinned };
    const e = validateAnnouncementDraft(draft);
    setErrors(e);
    if (e.length) return;
    await onCreate?.(draft);
    setMessage(t('announcement_created'));
    setTitle('');
    setBody('');
  }

  const label = (key: string) => t(key);

  return (
    <section className="announcement-module" aria-label={t('announcement_management')}>
      <div className="announcement-hero">
        <div>
          <span className="announcement-kicker">{t('announcement_kicker')}</span>
          <h2>{t('announcement_management')}</h2>
          <p>{t('announcement_description')}</p>
        </div>
        <div className="announcement-hero-icon" aria-hidden="true">📢</div>
      </div>

      {message && <div className="announcement-success" role="status">✓ {message}</div>}
      {errors.length > 0 && (
        <div className="announcement-error" role="alert">
          <strong>{t('announcement_check_again')}</strong>
          {errors.map((key) => <div key={key}>{t(key)}</div>)}
        </div>
      )}

      <div className="announcement-compose">
        <div className="announcement-section-head">
          <div>
            <span className="announcement-kicker">{t('announcement_create_new')}</span>
            <h3>{t('announcement_draft')}</h3>
          </div>
          <span className="announcement-audience">{t('announcement_all_employees')}</span>
        </div>

        <div className="announcement-form-grid">
          <label className="announcement-field announcement-field-wide">
            <span>{t('announcement_title')}</span>
            <input
              maxLength={200}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('announcement_title_placeholder')}
            />
          </label>
          <label className="announcement-field">
            <span>{t('announcement_category')}</span>
            <select value={category} onChange={e => setCategory(e.target.value as AnnouncementCategory)}>
              {(Object.keys(categoryKeys) as AnnouncementCategory[]).map((value) => (
                <option key={value} value={value}>{label(categoryKeys[value])}</option>
              ))}
            </select>
          </label>
          <label className="announcement-field">
            <span>{t('announcement_priority')}</span>
            <select value={priority} onChange={e => setPriority(e.target.value as AnnouncementPriority)}>
              {(Object.keys(priorityKeys) as AnnouncementPriority[]).map((value) => (
                <option key={value} value={value}>{label(priorityKeys[value])}</option>
              ))}
            </select>
          </label>
          <label className="announcement-field announcement-field-wide">
            <span>{t('announcement_body')}</span>
            <textarea
              maxLength={20000}
              rows={8}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={t('announcement_body_placeholder')}
            />
          </label>
        </div>

        <div className="announcement-compose-footer">
          <label className="announcement-pin">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} />
            <span>{t('announcement_pin')}</span>
          </label>
          <button type="button" className="announcement-primary" onClick={create}>{t('announcement_save_draft')}</button>
        </div>
      </div>

      <div className="announcement-list-card">
        <div className="announcement-section-head">
          <div>
            <span className="announcement-kicker">{t('announcement_archive_publish')}</span>
            <h3>{t('announcement_list')}</h3>
          </div>
          <span className="announcement-count">{announcements.length} {t('announcement_item')}</span>
        </div>

        {announcements.length === 0 ? (
          <div className="announcement-empty">{t('announcement_empty')}</div>
        ) : (
          <div className="announcement-list">
            {announcements.map(a => (
              <article key={a.id} className="announcement-item">
                <div className="announcement-item-main">
                  <div className="announcement-item-title-row">
                    {a.pinned && <span className="announcement-pinned">📌 {t('announcement_pinned')}</span>}
                    <strong>{a.title}</strong>
                  </div>
                  <div className="announcement-meta">
                    <span>{t(categoryKeys[a.category])}</span>
                    <span>•</span>
                    <span>{t(priorityKeys[a.priority])}</span>
                    <span>•</span>
                    <span className={`announcement-status status-${a.status}`}>{t(statusKeys[a.status])}</span>
                    {a.recipientCount !== undefined && (
                      <><span>•</span><span>{t('announcement_read')} {a.readCount ?? 0}/{a.recipientCount}</span></>
                    )}
                  </div>
                </div>
                <div className="announcement-item-actions">
                  {a.status === 'draft' && (
                    <button type="button" className="announcement-secondary" onClick={() => onTerbitkan?.(a.id)}>{t('announcement_publish')}</button>
                  )}
                  {a.status !== 'archived' && (
                    <button type="button" className="announcement-archive" onClick={() => onArchive?.(a.id)}>{t('announcement_archive')}</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
