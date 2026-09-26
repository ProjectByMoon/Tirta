import type { Announcement } from './types';
import { useTranslation } from '../../locales/LanguageContext';

const categoryKeys: Record<Announcement['category'], string> = {
  general: 'announcement_general',
  hr: 'announcement_hr',
  attendance: 'announcement_attendance',
  holiday: 'announcement_holiday',
  important: 'announcement_important',
  urgent: 'announcement_urgent',
};
const priorityKeys: Record<Announcement['priority'], string> = {
  normal: 'announcement_normal',
  important: 'announcement_important',
  urgent: 'announcement_urgent',
};

export default function EmployeeAnnouncementCenter({
  announcements,
  onRead,
}: {
  announcements: Announcement[];
  onRead?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const unread = announcements.filter(a => !a.isRead).length;

  return (
    <section aria-label={t('announcement_center')}>
      <header>
        <h2>📢 {t('announcements')}</h2>
        <p>{unread > 0 ? t('announcement_unread').replace('{count}', String(unread)) : t('announcement_all_read')}</p>
      </header>
      {announcements.length === 0 ? <p>{t('announcement_none')}</p> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {announcements.map((a) => (
            <article key={a.id} aria-label={a.title}>
              <div>
                {a.pinned && <strong>📌 {t('announcement_pinned')} </strong>}
                <strong>{a.title}</strong>
              </div>
              <small>
                {t(categoryKeys[a.category])} · {t(priorityKeys[a.priority])} · {a.publishedAt || ''}
              </small>
              <p>{a.body}</p>
              <button type="button" disabled={!!a.isRead} onClick={() => onRead?.(a.id)}>
                {a.isRead ? t('announcement_already_read') : t('announcement_mark_read')}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
