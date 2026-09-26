import PayrollIndonesiaV23 from '../payroll/PayrollIndonesiaV23';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode, type CSSProperties } from 'react';
import { isSupabaseConfigured, supabase } from '../../../lib/supabase/client';
import { signIn, signOut } from '../../../lib/auth';
import { rupiah as money } from '../../../lib/hris';
import { canDelete, canWrite, hasPermission } from '../../../lib/security';
import '../../../styles/admin/admin.css';
import MasterData from '../employee/MasterData';
import { PayrollEnterprise, RecruitmentEnterprise, RoleEditorEnterprise, ApprovalCenter } from '../enterprise/EnterpriseModules';
import { PayrollEngineV9 } from '../payroll/PayrollEngineV9';
import Employee360 from '../employee/Employee360';
import HRISCore from '../core/HRISCore';
import ProductionHR from '../payroll/ProductionHR';
import EnterpriseV20 from '../enterprise/EnterpriseV20';
import SecurityCenterV21 from '../security/SecurityCenterV21';
import PayrollProductionV22 from '../payroll/PayrollProductionV22';
import RecruitmentATSv25 from '../recruitment/RecruitmentATSv25';
import EnterpriseRoadmapV26V35 from '../enterprise/EnterpriseRoadmapV26V35';
import ProfessionalSuite from '../enterprise/ProfessionalSuite';
import moonLogo from '../../../assets/moon-logo.svg';
import IDCardModule from '../employee/IDCardModule';
import '../../../styles/admin/id-card.css';
import { useTranslation } from '../../../locales/LanguageContext';
import { appAlert, appConfirm, appPrompt } from '../../../lib/app-dialog';
import AdminAnnouncementManager from '../../../features/announcements/AdminAnnouncementManager';
import type { Announcement } from '../../../features/announcements/types';
import AttendanceUnified from './AttendanceUnified';

type Karyawan = {
  id: string;
  id_karyawan?: string;
  nama: string;
  jabatan?: string;
  departemen?: string;
  email?: string;
  no_telp?: string;
  alamat_rumah?: string;
  nik_ktp?: string;
  tempat_lahir?: string;
  bank_name?: string;
  bank_account?: string;
  nama_ibu_kandung?: string;
  jenis_kelamin?: string;
  status_pernikahan?: string;
  gaji_pokok?: number;
  tanggal_lahir?: string;
  tanggal_masuk?: string;
  status_aktif?: boolean;
  status_karyawan?: string;
  role?: string;
  auth_user_id?: string | null;
  email_terverifikasi?: boolean;
  foto_url?: string | null;
  created_at?: string;
};

interface Absensi {
  id?: string | number;
  id_karyawan?: string;
  nama?: string;
  tanggal?: string;
  jam_masuk?: string;
  jam_pulang?: string;
  total_jam?: string;
  status?: string;
  lokasi?: string;
  lokasi_masuk?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  accuracy?: number | string | null;
  akurasi_masuk?: number | string | null;
  akurasi_pulang?: number | string | null;
  latitude_masuk?: number | string | null;
  longitude_masuk?: number | string | null;
  accuracy_masuk?: number | string | null;
  keterlambatan_menit?: number | string;
  lembur_menit?: number | string;
  foto?: string;
  selfie_masuk?: string;
  keterangan?: string | null;
}

type MenuKey =
  | 'overview' | 'employees' | 'employee-new' | 'employee-360' | 'employee-add' | 'id-card' | 'organization' | 'hr-operations'
  | 'attendance' | 'attendance-today' | 'late' | 'leave' | 'overtime' | 'selfie' | 'gps'
  | 'schedule' | 'shift' | 'holiday' | 'leave-request' | 'leave-balance' | 'approvals'
  | 'payroll' | 'production-hr' | 'payroll-engine' | 'payroll-production-v22' | 'payroll-components' | 'payroll-overtime' | 'payslip'
  | 'performance' | 'kpi' | 'recruitment-v25' | 'recruitment' | 'candidates'
  | 'reports' | 'settings' | 'roles' | 'audit' | 'notifications' | 'feedback' | 'announcements' | 'system-health'
  | 'professional-suite' | 'enterprise-v20' | 'security-v21' | 'payroll-indonesia-v23'
  | `enterprise-v${26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35}`;

const isoToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

const rolePermissions: Record<string, string[]> = {
  'Super Admin': ['*'],
  'Admin': ['people', 'attendance', 'schedule', 'leave', 'payroll', 'talent', 'reports', 'system'],
  'HRD': ['people', 'attendance', 'schedule', 'leave', 'talent', 'reports'],
  'Payroll': ['people.read', 'attendance.read', 'payroll', 'reports.payroll'],
  'Supervisor': ['people.read', 'attendance.read', 'schedule.read', 'leave.read', 'leave.approve', 'reports.attendance'],
  'Karyawan': []
};

const menuGroup = (key: MenuKey) => 
  ['professional-suite'].includes(key) ? 'system' : 
  ['employees', 'employee-new', 'id-card', 'employee-360', 'employee-add', 'organization'].includes(key) ? 'people' :
  ['attendance', 'attendance-today', 'late', 'leave', 'overtime', 'selfie'].includes(key) ? 'attendance' : 
  ['schedule', 'shift', 'holiday'].includes(key) ? 'schedule' : 
  ['leave-request', 'leave-balance', 'approvals'].includes(key) ? 'leave' : 
  ['payroll', 'payroll-components', 'payroll-overtime', 'payslip', 'production-hr', 'payroll-engine', 'payroll-production-v22'].includes(key) ? 'payroll' : 
  ['performance', 'kpi'].includes(key) ? 'talent' : 
  ['recruitment', 'candidates', 'recruitment-v25'].includes(key) ? 'recruitment' : 
  ['enterprise-v26', 'enterprise-v27', 'enterprise-v28', 'enterprise-v29', 'enterprise-v30', 'enterprise-v31', 'enterprise-v32', 'enterprise-v33', 'enterprise-v34', 'enterprise-v35'].includes(key) ? 'system' : 
  key === 'reports' ? 'reports' : 
  key === 'settings' ? 'settings' : 
  key === 'roles' ? 'roles' : 
  key === 'audit' ? 'audit' : 
  key === 'notifications' ? 'notifications' : 
  key === 'system-health' ? 'system' : 
  (key === 'enterprise-v26' || key === 'payroll-indonesia-v23' || key === 'security-v21') ? 'system' : 'overview';

const requiredPermission = (key: MenuKey) => {
  if (key === 'professional-suite') return 'system.health';
  if (key === 'hr-operations') return 'people.read';
  if (key === 'production-hr' || key === 'payroll-engine' || key === 'payroll-production-v22') return 'payroll.read';
  
  const g = menuGroup(key); 
  if (key === 'employee-add') return 'people.write'; 
  if (key === 'roles') return 'roles.read'; 
  if (key === 'settings') return 'settings.write'; 
  if (key === 'audit') return 'audit.read'; 
  if (key === 'approvals') return 'approval.read'; 
  if (key === 'notifications') return 'notifications.read'; 
  if (key === 'system-health') return 'system.health';
  if ((key === 'enterprise-v26' || key === 'payroll-indonesia-v23')) return 'system.health'; 
  if (key === 'security-v21') return 'security.read'; 
  if (key.startsWith('enterprise-v')) return 'system.health'; 
  if (key === 'overtime') return 'overtime.read'; 
  if (key === 'reports') return 'reports.read'; 
  if (g === 'recruitment') return 'recruitment.read'; 
  if (g === 'talent') return 'talent.read'; 
  return g === 'overview' ? '' : `${g}.read`;
};

const menuPermissionForRole = (key: MenuKey, role: string, dbPerms: string[] = []) => {
  if (key === 'feedback') {
    return role === 'Super Admin'
      || dbPerms.includes('feedback.read')
      || hasPermission(dbPerms, 'feedback.read', role)
      || hasPermission(rolePermissions[role] || [], 'feedback.read', role);
  }
  if (key === 'announcements') {
    return role === 'Super Admin'
      || dbPerms.includes('announcements.read')
      || hasPermission(dbPerms, 'announcements.read', role)
      || hasPermission(rolePermissions[role] || [], 'announcements.read', role);
  }
  if (role === 'Super Admin' || requiredPermission(key) === '' || dbPerms.includes('*')) return true;
  const req = requiredPermission(key);
  if (key === 'approvals') return ['approval.read', 'leave.approve', 'overtime.approve', 'payroll.approve', 'recruitment.approve'].some(p => hasPermission(dbPerms, p, role) || hasPermission(rolePermissions[role] || [], p, role));
  return hasPermission(dbPerms, req, role) || hasPermission(dbPerms, menuGroup(key), role) || hasPermission(rolePermissions[role] || [], req, role) || hasPermission(rolePermissions[role] || [], menuGroup(key), role);
};

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    chevronDown: 'M6 9l6 6 6-6', chevronRight: 'M9 6l6 6-6 6', logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9', menu: 'M4 6h16M4 12h16M4 18h16', refresh: 'M20 11a8 8 0 1 0 1 4m-1-4v-5m0 5h-5', search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16m10 2-4.3-4.3', home: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m6-3a4 4 0 0 1 4 4m-1-8a3 3 0 0 1 0 6', plus: 'M12 5v14M5 12h14', org: 'M4 4h16v16H4zM8 8h3v3H8zm5 0h3v3h-3zM8 13h3v3H8zm5 0h3v3h-3z', clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', check: 'm5 12 4 4L19 6', alert: 'M12 9v4m0 4h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0', leave: 'M7 3h10v18H7zM10 12h7m0 0-3-3m3 3-3 3', arrow: 'M5 12h14m-6-6 6 6-6 6', camera: 'M4 7h3l2-2h6l2 2h3v12H4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8', calendar: 'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16', shift: 'M6 4h12v16H6zM9 8h6M9 12h6M9 16h4', holiday: 'M12 2l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6-5.8-3.5-5.8 3.5 1.6-6.6-5.2-4.4 6.8-.5z', request: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h4', balance: 'M5 4h14v16H5zM9 8h6M9 12h3', payroll: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5', components: 'M5 5h14M5 12h14M5 19h14', kpi: 'M5 20V10m7 10V4m7 16v-7', recruitment: 'M4 6h16v12H4zM8 10h8M8 14h5', report: 'M5 4h14v16H5zM8 9h8M8 13h8M8 17h5', settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0-6v3m0 14v3m10-10h-3M5 12H2m17.1-7.1-2.1 2.1M7 17l-2.1 2.1m12.2 0L15 17M7 7 4.9 4.9', bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h6', health: 'M20 12h-4l-2 7-4-14-2 7H4', card: 'M5 4h14v16H5zM8 8h8M8 12h5M8 16h8', dashboard: 'M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z'
  };
  const d = paths[name] || paths.home; 
  return <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d}/></svg>;
}

type FeedbackAdminRow = {
  id: string;
  id_karyawan: string;
  kategori: 'Saran' | 'Keluhan' | 'Masukan';
  judul: string;
  isi: string;
  status: 'Baru' | 'Diproses' | 'Selesai';
  tanggapan_hr?: string | null;
  created_at: string;
  updated_at: string;
};

function FeedbackAdmin({ employees }: { employees: Karyawan[] }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<FeedbackAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FeedbackAdminRow | null>(null);
  const [reply, setReply] = useState('');

  const loadFeedback = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('hris_employee_feedback')
      .select('id,id_karyawan,kategori,judul,isi,status,tanggapan_hr,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      setRows([]);
    } else {
      setRows((data || []) as FeedbackAdminRow[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const employeeName = (id: string) => {
    const emp = employees.find(x => x.id_karyawan === id);
    return emp?.nama || id;
  };

  const filtered = rows.filter(x => {
    const q = search.trim().toLowerCase();

    const matchesSearch =
      !q ||
      x.judul.toLowerCase().includes(q) ||
      x.isi.toLowerCase().includes(q) ||
      employeeName(x.id_karyawan).toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'Semua' || x.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'Semua' || x.kategori === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const openFeedback = (row: FeedbackAdminRow) => {
    setSelected(row);
    setReply(row.tanggapan_hr || '');
  };

  const updateFeedback = async (
    id: string,
    status: FeedbackAdminRow['status'],
    tanggapan_hr: string
  ) => {
    setSaving(id);

    const { data, error } = await supabase
      .from('hris_employee_feedback')
      .update({
        status,
        tanggapan_hr: tanggapan_hr.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id,id_karyawan,kategori,judul,isi,status,tanggapan_hr,created_at,updated_at')
      .single();

    if (error) {
      await appAlert(`Gagal menyimpan: ${error.message}`);
      setSaving('');
      return;
    }

    const updated = data as FeedbackAdminRow;

    setRows(prev => prev.map(x => x.id === id ? updated : x));
    setSelected(updated);
    setReply(updated.tanggapan_hr || '');
    setSaving('');
  };

  return (
    <div className="feedback-module">
      <div className="card feedback-list-card">
        <div className="card-title feedback-card-title">
          <div>
            <span className="card-kicker">{t("feedback_inbox")}</span>
            <h2>{t("employee_feedback")}</h2>
          </div>
          <button
            type="button"
            className="portal-secondary"
            onClick={loadFeedback}
            disabled={loading}
          >
            {loading ? t('loading') : t('reload')}
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(180px, 1fr) 150px 150px',
            gap: 10,
            marginBottom: 16
          }}
        >
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("search_feedback")}
          />

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option>{t('all')}</option>
            <option>{t('new')}</option>
            <option>{t('processing')}</option>
            <option>{t('completed')}</option>
          </select>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option>{t('all')}</option>
            <option>{t('suggestion')}</option>
            <option>{t('complaint')}</option>
            <option>{t('feedback')}</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">{t("loading_feedback")}</div>
        ) : filtered.length === 0 ? (
          <div className="muted">{t("no_feedback_match")}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('employee')}</th>
                  <th>{t('category')}</th>
                  <th>{t('title')}</th>
                  <th>{t('status')}</th>
                  <th>{t('date')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    <td>
                      <strong>{employeeName(row.id_karyawan)}</strong>
                      <div className="muted">{row.id_karyawan}</div>
                    </td>
                    <td>{row.kategori}</td>
                    <td>{row.judul}</td>
                    <td>
                      <span className="status-badge">{row.status}</span>
                    </td>
                    <td>
                      {new Date(row.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="portal-secondary"
                        onClick={() => openFeedback(row)}
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="card feedback-detail-card">
          <div className="card-title feedback-card-title">
            <div>
              <span className="card-kicker">{selected.kategori.toUpperCase()}</span>
              <h2>{selected.judul}</h2>
              <div className="muted">
                Dari: {employeeName(selected.id_karyawan)} ·{' '}
                {new Date(selected.created_at).toLocaleString('id-ID')}
              </div>
            </div>

            <button
              type="button"
              className="portal-secondary"
              onClick={() => setSelected(null)}
            >
              Tutup
            </button>
          </div>

          <div
            className="feedback-message"
          >
            {selected.isi}
          </div>

          <div className="feedback-form">
            <label className="feedback-field">
              <strong>Status</strong>
              <select className="feedback-control"
                value={selected.status}
                onChange={e =>
                  setSelected({
                    ...selected,
                    status: e.target.value as FeedbackAdminRow['status']
                  })
                }
              >
                <option>{t('new')}</option>
                <option>{t('processing')}</option>
                <option>{t('completed')}</option>
              </select>
            </label>

            <label className="feedback-field">
              <strong>{t('reply')}</strong>
              <textarea className="feedback-control feedback-textarea"
                rows={5}
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder={t("feedback_response_placeholder")}
                maxLength={5000}
              />
            </label>

            <div className="feedback-actions">
              <button
                type="button"
                className="portal-primary"
                disabled={saving === selected.id}
                onClick={() =>
                  updateFeedback(selected.id, selected.status, reply)
                }
              >
                {saving === selected.id ? 'Menyimpan...' : 'Simpan Tanggapan'}
              </button>

              <button
                type="button"
                className="portal-secondary"
                disabled={saving === selected.id}
                onClick={() =>
                  updateFeedback(selected.id, 'Diproses', reply)
                }
              >
                Tandai Diproses
              </button>

              <button
                type="button"
                className="portal-secondary"
                disabled={saving === selected.id}
                onClick={() =>
                  updateFeedback(selected.id, 'Selesai', reply)
                }
              >
                Tandai Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardAdmin() {
  const { t, lang, setLang } = useTranslation();

  // 1. Deklarasi State diletakkan paling atas di dalam komponen
  const [logged, setLogged] = useState(false);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [menu, setMenu] = useState<MenuKey>('overview');
  const [sidebar, setSidebar] = useState(() => window.innerWidth >= 900);
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const pendingEmployees = useMemo(() => employees.filter(k => k.status_aktif === false && String(k.status_karyawan || '').toLowerCase() === 'menunggu verifikasi'), [employees]);

  // FLOATING_NOTIFICATION_GROUP_START
  const [notificationUnread, setNotificationUnread] = useState(0);
  const [feedbackUnread, setFeedbackUnread] = useState(0);

  useEffect(() => {
    if (!logged || !isSupabaseConfigured) return;

    let cancelled = false;

    const loadNotificationCounts = async () => {
      const [
        { count: notificationCount },
        { count: feedbackCount }
      ] = await Promise.all([
        supabase
          .from('hris_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false),

        supabase
          .from('hris_employee_feedback')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Baru')
      ]);

      if (cancelled) return;

      setNotificationUnread(notificationCount || 0);
      setFeedbackUnread(feedbackCount || 0);
    };

    void loadNotificationCounts();

    const timer = window.setInterval(loadNotificationCounts, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [logged]);
  // FLOATING_NOTIFICATION_GROUP_END

  const [attendance, setAttendance] = useState<Absensi[]>([]);

  // NOTIFICATION_DROPDOWN_STATE_START
  type AdminNotificationPanel = 'employee' | 'feedback' | 'notifications' | null;
  const [notificationPanel, setNotificationPanel] = useState<AdminNotificationPanel>(null);
  const [feedbackPreview, setFeedbackPreview] = useState<any[]>([]);
  const [notificationPreview, setNotificationPreview] = useState<any[]>([]);

  const openNotificationPanel = async (panel: Exclude<AdminNotificationPanel, null>) => {
    setNotificationPanel(prev => prev === panel ? null : panel);

    if (panel === 'feedback') {
      const { data } = await supabase
        .from('hris_employee_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      setFeedbackPreview(data || []);
    }

    if (panel === 'notifications') {
      const { data } = await supabase
        .from('hris_notifications')
        .select('*')
        .eq('recipient_email', email)
        .order('created_at', { ascending: false })
        .limit(6);

      setNotificationPreview(data || []);
    }
  };

  const openAdminNotification = async (row: any) => {
    if (row?.id) {
      await supabase
        .from('hris_notifications')
        .update({ is_read: true })
        .eq('id', row.id)
        .eq('recipient_email', email);
    }

    setNotificationPanel(null);

    const text = `${row?.type || ''} ${row?.title || ''} ${row?.message || ''} ${row?.link || ''}`.toLowerCase();

    if (text.includes('feedback') || text.includes('saran') || text.includes('kotak')) {
      setMenu('feedback');
      return;
    }

    if (
      text.includes('karyawan') ||
      text.includes('employee') ||
      text.includes('menunggu verifikasi')
    ) {
      setMenu('employee-new');
      return;
    }

    if (
      text.includes('cuti') ||
      text.includes('sakit') ||
      text.includes('leave')
    ) {
      setMenu('attendance');
      return;
    }

    if (
      text.includes('lembur') ||
      text.includes('overtime') ||
      text.includes('absensi') ||
      text.includes('terlambat') ||
      text.includes('attendance') ||
      text.includes('absen')
    ) {
      setMenu('attendance');
      return;
    }

    setMenu('notifications');
  };
  // NOTIFICATION_DROPDOWN_STATE_END


  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState<Karyawan | null>(null);
  const [userRole, setUserRole] = useState('');
  const [profileOpen, setProfileOpen] = useState(false); const [languageOpen, setLanguageOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [dbPerms, setDbPerms] = useState<string[]>([]);
  const [sessionChecking, setSessionChecking] = useState(true);

  // Terapkan tema tersimpan sejak Dashboard pertama kali dimuat.
  // Settings tetap menangani editor/pilihan tema; effect ini memastikan
  // tema juga aktif di seluruh Dashboard tanpa harus membuka Settings.
  useEffect(() => {
    const DEFAULT_GLOBAL_THEME = {
      primary: '#101a33',
      accent: '#d6ae58',
      background: '#f6f7fb',
      surface: '#ffffff',
      text: '#172033',
      border: '#d6ae58'
    };

    let theme = DEFAULT_GLOBAL_THEME;
    const saved = localStorage.getItem('moonx-theme');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        theme = {
          ...DEFAULT_GLOBAL_THEME,
          ...parsed
        };
      } catch {
        theme = DEFAULT_GLOBAL_THEME;
      }
    }

    const root = document.documentElement;

    const vars: Record<string, string> = {
      '--mx-primary': theme.primary,
      '--mx-primary-contrast': '#ffffff',
      '--mx-accent': theme.accent,
      '--mx-background': theme.background,
      '--mx-surface': theme.surface,
      '--mx-surface-alt': theme.background,
      '--mx-text': theme.text,
      '--mx-text-secondary': '#667085',
      '--mx-text-muted': '#98a2b3',
      '--mx-control-bg': theme.surface,
      '--mx-control-text': theme.text,
      '--mx-control-border': theme.border,
      '--mx-border': theme.border,
      '--mx-border-strong': theme.accent,
      '--mx-focus': theme.accent,
      '--mx-blue': theme.primary,
      '--mx-blue-soft': theme.background,
      '--blue': theme.primary,
      '--blue2': theme.primary,
      '--blue-soft': theme.background,
      '--ink': theme.text,
      '--line': theme.border,
      '--surface': theme.surface,
      '--bg': theme.background
    };

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);
  const [roleOpen, setRoleOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [, setAnnouncementsLoading] = useState(false);

  const loadAnnouncements = async () => {
    if (!isSupabaseConfigured) return;

    setAnnouncementsLoading(true);

    const { data, error } = await supabase
      .from('hris_announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal memuat pengumuman:', error);
      setAnnouncementsLoading(false);
      return;
    }

    setAnnouncements((data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      category: a.category,
      priority: a.priority,
      status: a.status,
      audience: a.audience || { type: 'all' },
      pinned: !!a.pinned,
      publishedAt: a.published_at || undefined,
      expiresAt: a.expires_at || undefined,
      attachmentCount: Number(a.attachment_count || 0),
      imageUrl: a.image_url || undefined,
      createdBy: a.created_by || undefined,
      createdAt: a.created_at,
      updatedAt: a.updated_at || undefined,
    })));

    setAnnouncementsLoading(false);
  };

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  // 2. Deklarasi menuGroups
  const menuGroups = useMemo(() => [
    {
      title: t('main'),
      items: [
        ['overview', t('home'), 'home'] as [MenuKey, string, string],
        ['professional-suite', t('professional_operations'), 'kpi'] as [MenuKey, string, string],
        ['attendance', t('attendance'), 'clock'] as [MenuKey, string, string],
        ['reports', t('reports'), 'report'] as [MenuKey, string, string],
        ['feedback', t('feedback_inbox'), 'request'] as [MenuKey, string, string],
        ['announcements', t('announcements'), 'bell'] as [MenuKey, string, string],
      ],
    },
    {
      title: t('people'),
      items: [
        ['employees', 'Semua Karyawan', 'users'] as [MenuKey, string, string],
        ['employee-new', `Karyawan Baru${pendingEmployees.length ? ` (${pendingEmployees.length})` : ''}`, 'users'] as [MenuKey, string, string],
        ['id-card', t('id_card'), 'card'] as [MenuKey, string, string],
        ['employee-360', t('employee_360'), 'users'] as [MenuKey, string, string],
        ['organization', t('organization'), 'org'] as [MenuKey, string, string],
        ['hr-operations', t('hr_operations'), 'settings'] as [MenuKey, string, string],
      ],
    },
    {
      title: t('payroll') || 'PAYROLL',
      items: [
        ['payroll', t('monthly_payroll'), 'payroll'] as [MenuKey, string, string],
        ['production-hr', t('hr_transaction_center'), 'settings'] as [MenuKey, string, string],
        ['payroll-production-v22', t('payroll_control'), 'payroll'] as [MenuKey, string, string],
        ['payroll-components', t('salary_components'), 'components'] as [MenuKey, string, string],
        ['payroll-overtime', t('overtime_payroll'), 'arrow'] as [MenuKey, string, string],
        ['payslip', t('payslip'), 'calendar'] as [MenuKey, string, string],
      ],
    },
    {
      title: t('talent'),
      items: [
        ['performance', t('performance'), 'arrow'] as [MenuKey, string, string],
        ['kpi', t('kpi_target'), 'kpi'] as [MenuKey, string, string],
        ['recruitment-v25', t('recruitment_ats') || 'Rekrutmen', 'recruitment'] as [MenuKey, string, string],
        ['candidates', t('candidates'), 'users'] as [MenuKey, string, string],
      ],
    },
    {
      title: t('system'),
      items: [
        ['approvals', t('approvals'), 'check'] as [MenuKey, string, string],
        ['notifications', t('notifications'), 'bell'] as [MenuKey, string, string],
        ['system-health', t('system_health'), 'health'] as [MenuKey, string, string],
        ['settings', t('settings'), 'settings'] as [MenuKey, string, string],
        ['roles', t('roles_permissions'), 'users'] as [MenuKey, string, string],
        ['audit', t('audit_log'), 'request'] as [MenuKey, string, string],
      ],
    },
  ], [t]);

  const visibleMenuGroups = useMemo(() =>
    menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          menuPermissionForRole(item[0], userRole, dbPerms)
        ),
      }))
      .filter((group) => group.items.length > 0),
    [menuGroups, userRole, dbPerms]
  );

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      setSessionChecking(true);
      if (!isSupabaseConfigured) { setError('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY pada environment deployment.'); setSessionChecking(false); return; }
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (data.user?.email) {
        const { data: p } = await supabase.from('hris_users').select('nama,role,status').eq('email', data.user.email).maybeSingle();
        if (active && p?.status === 'Aktif') {
          setUserRole(p.role || '');
          setProfileName(p.nama || '');
          const { data: rp } = await supabase.from('hris_role_permissions').select('permission_code').eq('role_name', p.role);
          loadProfilePhoto();
          if (active) { setDbPerms((rp || []).map(x => x.permission_code)); setEmail(data.user.email); setLogged(true); }
        } else if (active) { await supabase.auth.signOut(); setLogged(false); }
      }
      if (active) setSessionChecking(false);
    };
    loadSession();
    if (!isSupabaseConfigured) return () => { active = false };
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) { setLogged(false); setUserRole(''); setProfileName(''); setDbPerms([]); setSessionChecking(false); }
    });
    return () => { active = false; listener.subscription.unsubscribe() };
  }, []);

  useEffect(() => { if (logged) refresh() }, [logged]);
  const [employee360Id, setEmployee360Id] = useState('');

  useEffect(() => {
    const read = () => {
      const raw = location.hash.replace(/^#\//, '');
      const parts = raw.split('/').filter(Boolean);
      const candidate = parts[0] as MenuKey;
      const employeeId = candidate === 'employee-360' ? (parts[1] || '') : '';

      setEmployee360Id(employeeId);

      if (
        candidate &&
        menuGroups.flatMap(g => g.items).some(x => x[0] === candidate) &&
        menuPermissionForRole(candidate, userRole, dbPerms)
      ) {
        setMenu(candidate);
      }
    };

    read();
    window.addEventListener('hashchange', read);

    return () => window.removeEventListener('hashchange', read);
  }, [userRole, dbPerms, menuGroups]);
  
  const navigate = (next: MenuKey) => { setMenu(next); location.hash = `/${next}`; if (window.innerWidth < 900) setSidebar(false) };


  async function refresh() {
    setLoading(true); setError('');
    const [k, a] = await Promise.all([
      supabase.from('karyawan').select('*').order('nama'),
      supabase.from('absensi').select('*').order('created_at', { ascending: false }).limit(2000)
    ]);
    if (k.error) setError(`Karyawan: ${k.error.message}`); else setEmployees(k.data || []);
    if (a.error) setError(v => v ? `${v}\nAbsensi: ${a.error.message}` : `Absensi: ${a.error.message}`); else setAttendance(a.data || []);
    setLoading(false);
  }

  async function loadProfilePhoto() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase.storage.from("profile-photos").createSignedUrl(`${uid}/avatar.jpg`, 3600);
    if (data?.signedUrl) setProfilePhotoUrl(`${data.signedUrl}&v=${Date.now()}`);
  }

  async function uploadProfilePhoto(file: File) {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) { setError("Sesi login tidak ditemukan."); return; }
    if (!file.type.startsWith("image/")) { setError("File harus berupa gambar."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Ukuran foto maksimal 5 MB."); return; }
    const path = `${uid}/avatar.jpg`;
    const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { setError("Gagal mengunggah foto: " + uploadError.message); return; }
    await loadProfilePhoto(); setToast(t("profile_photo_updated"));
  }

  async function saveProfileName() {
    const nextName = profileName.trim();
    if (nextName.length === 0) { setError("Nama profil wajib diisi."); return; }
    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData.user?.email;
    if (!userEmail) { setError("Sesi login tidak ditemukan."); return; }
    const { error: profileError } = await supabase.from("hris_users").update({ nama: nextName }).eq("email", userEmail);
    if (profileError) { setError("Gagal menyimpan nama profil: " + profileError.message); return; }
    setProfileName(nextName);
    setProfilePanelOpen(false);
    setToast(t("profile_name_updated"));
  }

  async function login(e: FormEvent) {
    e.preventDefault(); setError('');
    if (!isSupabaseConfigured) { setError('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY pada environment deployment.'); return }
    setLoading(true);
    const { data, error: e2 } = await signIn(email, pin);
    setLoading(false);
    if (e2 || !data.user) { setError(e2?.message || 'Email atau password tidak valid.'); return; }
    const { data: profile, error: pe } = await supabase.from('hris_users').select('nama,role,status').ilike('email', data.user.email || '').maybeSingle();
    if (pe) { await signOut(); setError('Profil akses HR tidak dapat diverifikasi. Coba lagi atau hubungi administrator.'); return; }
    if (!profile || profile.status !== 'Aktif') {
      await signOut(); setError('Akun tidak memiliki akses Dashboard HR.'); return;
    }
    setUserRole(profile.role);
    setProfileName(profile.nama || '');
    const { data: rp } = await supabase.from('hris_role_permissions').select('permission_code').eq('role_name', profile.role);
    setDbPerms((rp || []).map(x => x.permission_code));
    setLogged(true);
  }

  async function removeEmployee(k: Karyawan) {
    if (!menuPermissionForRole('employees', userRole, dbPerms) || !canDelete(dbPerms, 'people', userRole)) { setError('Anda tidak memiliki permission people.delete.'); return }
    if (!await appConfirm(`Hapus ${k.nama}?`)) return;
    const { error: e } = await supabase.from('karyawan').delete().eq('id', k.id);
    if (e) setError(e.message); else { setToast(t("employee_deleted")); refresh() }
  }

  async function saveEdit(payload: Record<string, unknown>) {
    if (!canWrite(dbPerms, 'people', userRole)) { setError('Anda tidak memiliki permission people.write.'); return }
    if (!editing) return;
    if (payload.id_karyawan !== undefined) {
      const nextId = String(payload.id_karyawan || '').trim().toUpperCase();
      if (!nextId) { setError('ID Karyawan wajib diisi.'); return; }
      const { data: duplicate } = await supabase.from('karyawan').select('id').eq('id_karyawan', nextId).neq('id', editing.id).maybeSingle();
      if (duplicate) { setError(`ID Karyawan ${nextId} sudah digunakan.`); return; }
      payload.id_karyawan = nextId;
    }
    const { error: e } = await supabase.from('karyawan').update(payload).eq('id', editing.id);
    if (e) setError(e.message); else { setEditing(null); setToast(t("employee_saved")); refresh() }
  }

  const payroll = employees.reduce((s, k) => s + Number(k.gaji_pokok || 0), 0);
  const activeLabel = menuGroups.flatMap(g => g.items).find((x) => x[0] === menu)?.[1] || 'Overview';
  
  const exportCsv = (rows: Record<string, unknown>[], filename: string, columns?: string[]) => {
    if (!rows.length) { setToast(t("no_data_export")); return; }
    const keys = columns?.length ? columns : Object.keys(rows[0]);
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [keys.join(';'), ...rows.map(r => keys.map(k => esc(r[k])).join(';'))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = filename;
    a.click(); URL.revokeObjectURL(a.href);
    setToast(`Export ${keys.length} kolom berhasil dibuat.`);
  };

  const exportExcel = (rows: Record<string, unknown>[], filename: string, columns: string[]) => {
    if (!rows.length) { setToast(t("no_data_export")); return; }
    const escHtml = (v: unknown) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const html = `<html><head><meta charset="utf-8"></head><body><table><thead><tr>${columns.map(k=>`<th>${escHtml(fieldLabel(k))}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${columns.map(k=>`<td>${escHtml(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel' }));
    a.download = filename; a.click(); URL.revokeObjectURL(a.href);
    setToast(t("excel_created"));
  };

  if (sessionChecking) return <div className="login-wrap"><div className="login-card"><div className="loading">Memeriksa sesi keamanan...</div></div></div>;
  if (!logged) return <Login email={email} pin={pin} setEmail={setEmail} setPin={setPin} onSubmit={login} loading={loading} error={error}/>;
  return (
   <div className="talenta-shell">

    {/* FLOATING_NOTIFICATION_GROUP_START */}
    <div className="admin-floating-notification-group" aria-label="Pusat notifikasi">
      <button
        type="button"
        className={`admin-floating-action ${notificationPanel === 'employee' ? 'active' : ''}`}
        onClick={() => openNotificationPanel('employee')}
        aria-label="Karyawan Baru"
        title="Karyawan Baru"
      >
        <span className="admin-floating-action-icon">👤</span>
        {pendingEmployees.length > 0 && (
          <span className="admin-floating-action-badge">
            {pendingEmployees.length > 99 ? '99+' : pendingEmployees.length}
          </span>
        )}
      </button>

      <button
        type="button"
        className={`admin-floating-action ${notificationPanel === 'feedback' ? 'active' : ''}`}
        onClick={() => openNotificationPanel('feedback')}
        aria-label="Kotak Saran"
        title="Kotak Saran"
      >
        <span className="admin-floating-action-icon">💌</span>
        {feedbackUnread > 0 && (
          <span className="admin-floating-action-badge">
            {feedbackUnread > 99 ? '99+' : feedbackUnread}
          </span>
        )}
      </button>

      <button
        type="button"
        className={`admin-floating-action ${notificationPanel === 'notifications' ? 'active' : ''}`}
        onClick={() => openNotificationPanel('notifications')}
        aria-label="Semua Notifikasi"
        title="Semua Notifikasi"
      >
        <span className="admin-floating-action-icon">🔔</span>
        {notificationUnread > 0 && (
          <span className="admin-floating-action-badge">
            {notificationUnread > 99 ? '99+' : notificationUnread}
          </span>
        )}
      </button>

      {notificationPanel === 'employee' && (
        <div className="admin-notification-dropdown admin-notification-dropdown-employee">
          <div className="admin-notification-dropdown-head">
            <strong>Karyawan Baru</strong>
            <span>{pendingEmployees.length} menunggu verifikasi</span>
          </div>

          <div className="admin-notification-dropdown-list">
            {pendingEmployees.slice(0, 6).map((row: any) => (
              <button
                key={row.id}
                type="button"
                className="admin-notification-dropdown-item"
                onClick={() => {
                  setNotificationPanel(null);
                  setMenu('employee-new');
                }}
              >
                <span className="admin-notification-dropdown-avatar">👤</span>
                <span className="admin-notification-dropdown-copy">
                  <strong>{row.nama || row.email || row.id_karyawan}</strong>
                  <small>{row.id_karyawan || 'Karyawan baru'} · Menunggu verifikasi</small>
                </span>
              </button>
            ))}

            {pendingEmployees.length === 0 && (
              <div className="admin-notification-empty">Tidak ada karyawan baru.</div>
            )}
          </div>

          <button
            type="button"
            className="admin-notification-dropdown-all"
            onClick={() => {
              setNotificationPanel(null);
              setMenu('employee-new');
            }}
          >
            Lihat semua karyawan baru
          </button>
        </div>
      )}

      {notificationPanel === 'feedback' && (
        <div className="admin-notification-dropdown admin-notification-dropdown-feedback">
          <div className="admin-notification-dropdown-head">
            <strong>Kotak Saran</strong>
            <span>{feedbackUnread} baru</span>
          </div>

          <div className="admin-notification-dropdown-list">
            {feedbackPreview.map((row: any) => (
              <button
                key={row.id}
                type="button"
                className={`admin-notification-dropdown-item ${row.status === 'Baru' ? 'unread' : ''}`}
                onClick={() => {
                  setNotificationPanel(null);
                  setMenu('feedback');
                }}
              >
                <span className="admin-notification-dropdown-avatar">💌</span>
                <span className="admin-notification-dropdown-copy">
                  <strong>{row.judul || 'Saran baru'}</strong>
                  <small>{row.kategori || 'Masukan'} · {row.status || 'Baru'}</small>
                  <span>{row.isi || ''}</span>
                </span>
              </button>
            ))}

            {feedbackPreview.length === 0 && (
              <div className="admin-notification-empty">Belum ada saran.</div>
            )}
          </div>

          <button
            type="button"
            className="admin-notification-dropdown-all"
            onClick={() => {
              setNotificationPanel(null);
              setMenu('feedback');
            }}
          >
            Lihat semua kotak saran
          </button>
        </div>
      )}

      {notificationPanel === 'notifications' && (
        <div className="admin-notification-dropdown admin-notification-dropdown-notifications">
          <div className="admin-notification-dropdown-head">
            <strong>Notifikasi</strong>
            <span>{notificationUnread} belum dibaca</span>
          </div>

          <div className="admin-notification-dropdown-list">
            {notificationPreview.map((row: any) => (
              <button
                key={row.id}
                type="button"
                className={`admin-notification-dropdown-item ${row.is_read ? '' : 'unread'}`}
                onClick={() => openAdminNotification(row)}
              >
                <span className="admin-notification-dropdown-avatar">
                  {row.type === 'feedback' ? '💌'
                    : row.type === 'employee' ? '👤'
                    : row.type === 'attendance' ? '⏰'
                    : row.type === 'leave' ? '🏖️'
                    : row.type === 'overtime' ? '⏱️'
                    : '🔔'}
                </span>
                <span className="admin-notification-dropdown-copy">
                  <strong>{row.title || 'Notifikasi'}</strong>
                  <small>{row.type || 'system'}</small>
                  <span>{row.message || ''}</span>
                </span>
              </button>
            ))}

            {notificationPreview.length === 0 && (
              <div className="admin-notification-empty">Tidak ada notifikasi.</div>
            )}
          </div>

          <button
            type="button"
            className="admin-notification-dropdown-all"
            onClick={() => {
              setNotificationPanel(null);
              setMenu('notifications');
            }}
          >
            Lihat semua notifikasi
          </button>
        </div>
      )}
    </div>
    {/* FLOATING_NOTIFICATION_GROUP_END */}



    <aside className={`sidebar ${sidebar ? "open" : "collapsed"}`}>
      <div className="sidebar-head">
        <div className="brand">
          <div className="brand-mark"><img src={moonLogo} alt="Project by Tirta" /></div>
          {sidebar && <div><b>Project by Tirta</b><small>People Platform</small></div>}
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Menu utama">
  {visibleMenuGroups.map((group) => {
    const visibleItems = group.items.filter((item) =>
      menuPermissionForRole(item[0], userRole, dbPerms)
    );

    if (!visibleItems.length) return null;
return (
            <div className="nav-group" key={group.title}>
              {sidebar && (
                <button
                  type="button"
                  className="nav-title"
                  onClick={() =>
                    setCollapsedGroups((prev) => ({
                      ...prev,
                      [group.title]: !prev[group.title],
                    }))
                  }
                  aria-expanded={!collapsedGroups[group.title]}
                >
                  <span>{group.title}</span>
                  <Icon
                    name={collapsedGroups[group.title] ? 'chevronRight' : 'chevronDown'}
                  />
                </button>
              )}

              {!collapsedGroups[group.title] && (
                <div className="nav-group-items">
                  {visibleItems.map(([key, label, icon]) => (
                    <button
                      key={key}
                      className={`nav-item ${menu === key ? 'active' : ''}`}
                      onClick={() => navigate(key)}
                      title={!sidebar ? label : undefined}
                      type="button"
                    >
                      <Icon name={icon} />
                      {sidebar && <span>{label}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

     
      
      {/* ===== BAGIAN BAWAH SIDEBAR ===== */}
      <div className="sidebar-bottom">
        <button className="logout" onClick={async () => {
          await signOut();
          setLogged(false);
          setUserRole("");
          setDbPerms([]);
          setMenu("overview");
          location.hash = "/home";
        }}>
          <Icon name="logout"/>{sidebar && "Keluar"}
        </button>
      </div>
      {/* ======================================================== */}
    </aside>
   <main className="talenta-main"><header className="topbar">
<button className="icon-btn" aria-label="Buka menu" onClick={()=>setSidebar(v=>!v)}><Icon name="menu"/></button>
<div className="crumb"><span>Project by Tirta</span><b>/</b>{activeLabel}</div>
  {roleOpen && <div className="role-menu"><small>ROLE AKTIF</small>{['Super Admin','Admin','HRD','Payroll','Supervisor','Karyawan'].map(r=><button type="button" key={r} className={r===userRole?'selected':''} onClick={()=>{setRoleOpen(false); if(r!==userRole)setToast(`Role ${r} hanya dapat diubah melalui Peran & Hak Akses.`)}}>{r===userRole?'✓':' '} {r}</button>)}</div>}
<div className="top-actions"><div className="search-global"><span><Icon name="search"/></span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('search_data')}/></div><button className="icon-btn" aria-label="Muat ulang" onClick={()=>refresh()}><Icon name="refresh"/></button><div className="profile-trigger-wrap"><button type="button" className="avatar avatar-button" aria-label={t('open_profile')} aria-expanded={profileOpen} onClick={()=>setProfileOpen(v=>!v)}>{profilePhotoUrl ? <img src={profilePhotoUrl} alt={t('profile')} /> : (profileName || "HR").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}</button>{profileOpen && <div className="profile-menu"><div className="profile-menu-header"><div className="profile-avatar-large">{(profileName || "HR").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}</div><div><strong>{profileName || email || "Pengguna"}</strong><small>{userRole || "Pengguna"}</small></div></div><div className="profile-menu-divider"/><button type="button" onClick={()=>{setProfileOpen(false);setProfilePanelOpen(true)}}><span>👤</span>{t('profile')}</button><button type="button" onClick={()=>{setProfileOpen(false);navigate("roles")}}><span>🛡️</span>{t('role')}</button><div className="profile-language">
  <button type="button" onClick={()=>setLanguageOpen(v=>!v)}><span>🌐</span>{t('language')} <small>{lang.toUpperCase()} ▾</small></button>
  {languageOpen && <div className="profile-language-options">
    {([['id','Indonesia'],['en','English'],['ja','日本語'],['ko','한국어'],['zh','中文']] as const).map(([code,name])=>
      <button type="button" key={code} className={lang===code?'selected':''} onClick={async()=>{await setLang(code);setProfileOpen(false)}}>
        {lang===code?'✓':' '} {name}
      </button>
    )}
  </div>}
</div><button type="button" onClick={()=>{setProfileOpen(false);navigate("settings")}}><span>⚙️</span>{t('settings_menu')}</button><div className="profile-menu-divider"/><button type="button" className="profile-logout" onClick={async()=>{setProfileOpen(false);await signOut();setLogged(false);setEmail("");setUserRole("");setProfileName("");setDbPerms([])}}><span>🚪</span>{t('logout')}</button></div>}</div></div></header>
              {profilePanelOpen && <div className="profile-panel-overlay" onClick={()=>setProfilePanelOpen(false)}>
                <div className="profile-panel" onClick={e=>e.stopPropagation()}>
                  <div className="profile-panel-head">
                    <div>
                      <h3>{t('profile_title')}</h3>
                      <p>{t('profile_desc')}</p>
                    </div>
                    <button type="button" className="profile-panel-close" onClick={()=>setProfilePanelOpen(false)}>×</button>
                  </div>
                  <div className="profile-panel-body">
                    <div className="profile-photo-area">
                      <div className="profile-photo-placeholder">{profilePhotoUrl ? <img src={profilePhotoUrl} alt={t('profile')} /> : (profileName || "HR").split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase()}</div>
                      <input id="profile-photo-input" type="file" accept="image/png,image/jpeg,image/webp" style={{display:"none"}} onChange={e=>{const file=e.target.files?.[0]; if(file) uploadProfilePhoto(file)}} /><button type="button" className="profile-photo-button" onClick={()=>document.getElementById("profile-photo-input")?.click()}>Ganti Foto</button>
                    </div>
                    <label className="profile-field">
                      <span>{t("name")}</span>
                      <input value={profileName} onChange={e=>setProfileName(e.target.value)} placeholder="Masukkan nama" />
                    </label>
                    <label className="profile-field">
                      <span>{t("email")}</span>
                      <input value={email} readOnly />
                    </label>
                    <label className="profile-field">
                      <span>{t("role")}</span>
                      <input value={userRole || "Pengguna"} readOnly />
                    </label>
                  </div>
                  <div className="profile-panel-footer">
                    <button type="button" className="profile-btn-secondary" onClick={()=>setProfilePanelOpen(false)}>{t("cancel")}</button>
                    <button type="button" className="profile-btn-primary" onClick={saveProfileName}>Simpan</button>
                  </div>
                </div>
              </div>}

    <section className="page admin-page-frame">{loading&&<div className="loading">Memuat data…</div>}{error&&<div className="alert">{error}</div>}
    {menu==='overview'&&<Overview employees={employees} attendance={attendance} payroll={payroll} onNavigate={navigate} profileName={profileName}/>}
    {menu==='professional-suite'&&<ProfessionalSuite employees={employees} attendance={attendance} onNavigate={navigate}/>}
    {menu==='id-card'&&<IDCardModule employees={employees} companyName="Project by Tirta" logoUrl={moonLogo}/> }
    {menu==='employees'&&<Employees data={employees.filter(k => k.status_aktif !== false)} onDelete={removeEmployee} onEdit={setEditing} onExport={(columns, format)=>format==='excel' ? exportExcel(employees.filter(k => k.status_aktif !== false) as any,'database-karyawan.xls',columns) : exportCsv(employees.filter(k => k.status_aktif !== false) as any,'database-karyawan.csv',columns)} onAdd={()=>navigate('employee-add')} />}
    {menu==='employee-new'&&<NewEmployees data={pendingEmployees} onRefresh={refresh} />}
    {menu==='employee-360'&&<Employee360 employees={employees} initialEmployeeId={employee360Id}/>}
    {menu==='employee-add'&&<AddEmployee refresh={refresh} onDone={()=>navigate('employees')}/>} {menu==='hr-operations'&&<HRISCore employees={employees}/>} {menu==='production-hr'&&<ProductionHR employees={employees}/>} 
    {menu==='organization'&&<MasterData initialTab="cabang"/>}
    {menu==='attendance'&&<AttendanceUnified />}
    {menu==='schedule'&&<MasterData initialTab="jadwal"/>}{menu==='shift'&&<MasterData initialTab="shift"/>}
    {menu==='holiday'&&<HolidayModule/>}
    {['leave-request','leave-balance'].includes(menu)&&<LeaveModule initial={menu}/>}
    {menu==='payroll'&&<PayrollEnterprise employees={employees} view="payroll"/>}
    {menu==='payroll-components'&&<PayrollEnterprise employees={employees} view="components"/>}
    {menu==='payroll-overtime'&&<PayrollEnterprise employees={employees} view="overtime"/>}
    {menu==='payslip'&&<PayrollEnterprise employees={employees} view="payslip"/>}
    {menu==='payroll-engine'&&<PayrollEngineV9/>}{menu==='payroll-production-v22'&&<PayrollProductionV22/>}{menu==='payroll-indonesia-v23'&&<PayrollIndonesiaV23/>}
    {['performance','kpi'].includes(menu)&&<TalentModule key={menu} initial={menu} employees={employees}/>} {menu==='recruitment-v25'&&<RecruitmentATSv25/>} {menu.startsWith('enterprise-v')&&menu!=='enterprise-v20'&&<EnterpriseRoadmapV26V35 version={menu.replace('enterprise-','') as any}/>} {['recruitment','candidates'].includes(menu)&&<RecruitmentEnterprise/>}

    {menu==='reports'&&<Reports employees={employees} attendance={attendance} onExport={exportCsv}/>}
    {menu==='settings'&&<Settings/>}{menu==='roles'&&<RoleEditorEnterprise userRole={userRole}/>} {menu==='audit'&&<Audit/>}{menu==='approvals'&&<ApprovalCenter/>}{menu==='notifications'&&<Notifications/>}
{menu==='feedback'&&<FeedbackAdmin employees={employees}/>}
{menu==='announcements'&&<AdminAnnouncementManager
      announcements={announcements}
      onCreate={async (draft) => {
        if (!isSupabaseConfigured) {
          appAlert('Supabase belum dikonfigurasi.');
          return;
        }

        const { data: authData } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from('hris_announcements')
          .insert({
            title: draft.title.trim(),
            body: draft.body.trim(),
            category: draft.category,
            priority: draft.priority,
            audience: draft.audience,
            pinned: draft.pinned,
            publish_at: draft.publishAt || null,
            expires_at: draft.expiresAt || null,
            attachment_count: 0,
            created_by: authData.user?.id || null,
            status: 'draft',
          })
          .select('*')
          .single();

        if (error) {
          appAlert(`Gagal menyimpan draft: ${error.message}`);
          return;
        }

        if (data) {
          setAnnouncements((prev) => [{
            id: data.id,
            title: data.title,
            body: data.body,
            category: data.category,
            priority: data.priority,
            status: data.status,
            audience: data.audience || { type: 'all' },
            pinned: !!data.pinned,
            publishedAt: data.published_at || undefined,
            expiresAt: data.expires_at || undefined,
            attachmentCount: Number(data.attachment_count || 0),
            imageUrl: data.image_url || undefined,
            createdBy: data.created_by || undefined,
            createdAt: data.created_at,
            updatedAt: data.updated_at || undefined,
          }, ...prev]);
        }
      }}
      onTerbitkan={async (id) => {
        const { data, error } = await supabase
          .rpc('hris_announcement_publish', { p_id: id });

        if (error) {
          appAlert(`Gagal menerbitkan pengumuman: ${error.message}`);
          return;
        }

        if (data) {
          const row = Array.isArray(data) ? data[0] : data;
          if (row) {
            setAnnouncements((prev) => prev.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: 'published',
                    publishedAt: row.published_at || new Date().toISOString(),
                    updatedAt: row.updated_at || new Date().toISOString(),
                  }
                : a
            ));
          }
        } else {
          await loadAnnouncements();
        }
      }}
      onArchive={async (id) => {
        const { data, error } = await supabase
          .rpc('hris_announcement_archive', { p_id: id });

        if (error) {
          appAlert(`Gagal mengarsipkan pengumuman: ${error.message}`);
          return;
        }

        if (data) {
          const row = Array.isArray(data) ? data[0] : data;
          if (row) {
            setAnnouncements((prev) => prev.map((a) =>
              a.id === id
                ? {
                    ...a,
                    status: 'archived',
                    updatedAt: row.updated_at || new Date().toISOString(),
                  }
                : a
            ));
          }
        } else {
          await loadAnnouncements();
        }
      }}
    />}
    {menu==='system-health'&&<SystemHealth/>}
    {menu==='enterprise-v20'&&<EnterpriseV20 employees={employees}/>}
    {menu==='security-v21'&&<SecurityCenterV21/>}  
    {editing&&<EmployeeEditor employee={editing} onClose={()=>setEditing(null)} onSave={saveEdit}/>}
    {toast&&<button className="toast" onClick={()=>setToast('')}>{toast} ×</button>}
      </section>
    </main>
   </div>
  );
};

function Login(p:{email:string;pin:string;setEmail:(v:string)=>void;setPin:(v:string)=>void;onSubmit:(e:FormEvent)=>void;error:string;loading:boolean}){
  const { t } = useTranslation();
 return <div className="login-wrap"><div className="login-card"><div className="brand center"><div className="brand-mark"><img src={moonLogo} alt="Project by Tirta" /></div><div><b>Project by Tirta</b><small>People Platform</small></div></div><h1>{t('welcome_back')}</h1><p>{t('login_to_dashboard')}</p><form onSubmit={p.onSubmit}><label>Email<input value={p.email} onChange={e=>p.setEmail(e.target.value)} required/></label><label>Password<input type="password" value={p.pin} onChange={e=>p.setPin(e.target.value)} required/></label>{p.error&&<div className="form-error">{p.error}</div>}<button className="primary full" disabled={p.loading}>{p.loading ? t('checking') : t('login_to_dashboard_button')}</button></form><small className="security-note">{t('security_note')}</small></div></div>
}

function Heading({
  title,
  desc,
  action,
  onAction,
}: {
  title: string;
  desc: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>

      {action && (
        <button className="primary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

function Overview({employees,attendance,payroll,onNavigate,profileName}:{employees:Karyawan[];attendance:Absensi[];payroll:number;onNavigate:(m:MenuKey)=>void;profileName:string}){
  const { t } = useTranslation();
 
 const active = employees.filter(k => k.status_aktif !== false).length;
 const inactive = Math.max(0, employees.length - active);

 // Attendance hari ini: satu karyawan dihitung satu kali.
 const todayAttendance = attendance.filter(a => a.tanggal === isoToday());
 const attendanceByEmployee = new Map<string, Absensi>();

 todayAttendance.forEach(a => {
   const key = a.id_karyawan || a.nama || String(a.id || Math.random());
   if (!attendanceByEmployee.has(key)) {
     attendanceByEmployee.set(key, a);
   }
 });

 const todayRows = Array.from(attendanceByEmployee.values());

 const lateToday = todayRows.filter(a =>
   (a.status || '').toLowerCase().includes('terlambat') ||
   Number(a.keterlambatan_menit || 0) > 0
 );

 const presentToday = todayRows.filter(a =>
   !lateToday.includes(a) &&
   ['Hadir', 'Tepat Waktu'].includes(a.status || '')
 );

 const presentCount = presentToday.length;
 const lateCount = lateToday.length;
 const absentCount = Math.max(0, active - presentCount - lateCount);

 const attendanceRate = active
   ? Math.min(100, Math.round(((presentCount + lateCount) / active) * 100))
   : 0;

 const recent = attendance.slice(0,6);
 const dept=employees.reduce<Record<string,number>>((a,k)=>{const d=k.departemen||'Belum diatur';a[d]=(a[d]||0)+1;return a},{});
 const deptRows=Object.entries(dept).sort((a,b)=>b[1]-a[1]).slice(0,5);
 const maxDept=Math.max(1,...deptRows.map(x=>x[1]));
 return <div className="executive-dashboard">
  <Heading title={profileName || t("hr_control_center")} desc={t("hr_control_desc")} action={t("add_employee")} onAction={()=>onNavigate('employee-add')}/>
  <div className="command-strip">
   <div><span className="eyebrow">{t("operational_status")}</span><strong>{t("system_status")}</strong><small>{t("database_connected")}</small></div>
   <div className="strip-meta"><span className="status green">Operational</span><span>{t("auto_update_on_load")}</span></div>
  </div>
  <div className="stat-grid executive-stats">
   <Stat title={t("total_employees")} value={String(employees.length)} hint={`${active} ${t("active")} · ${inactive} ${t("inactive")}`} icon="users"/>
   <Stat title={t("attendance_today")} value={`${attendanceRate}%`} hint={`${presentCount} ${t("present")} · ${lateCount} ${t("late")}`} icon="check"/>
   <Stat title={t("total_basic_salary")} value={money(payroll)} hint={t("from_active_employee_master")} icon="payroll"/>
   <Stat title={t("attendance_data")} value={String(attendance.length)} hint={t("data_saved")} icon="clock"/>
  </div>
  <div className="dashboard-grid-top">
   <div className="panel executive-chart">
    <div className="panel-head"><div><span className="eyebrow">{t("workforce")}</span><h2>{t("workforce_composition")}</h2><p>{t("employee_distribution_by_department")}</p></div><button className="link-btn" onClick={()=>onNavigate("employees")}>{t("open_master")}</button></div>
    <div className="department-bars">{deptRows.length?deptRows.map(([name,count])=><div className="dept-row" key={name}><div className="dept-label"><span>{name}</span><b>{count}</b></div><div className="progress"><span style={{width:`${Math.round(count/maxDept*100)}%`}}/></div></div>):<div className="empty-module"><h3>{t("no_workforce_data")}</h3><p>{t("add_employee_to_view")}</p></div>}</div>
   </div>
   <div className="panel attendance-health">
    <div className="panel-head"><div><span className="eyebrow">{t("today")}</span><h2>{t("attendance_status")}</h2><p>{t("attendance_status_today")}</p></div></div>
    <div className="health-ring" style={{'--rate':`${attendanceRate*3.6}deg`} as CSSProperties}><div><strong>{attendanceRate}%</strong><small>{t("present")}</small></div></div>
    <div className="health-legend"><div><i className="dot present"/><span>{t("present")}</span><b>{presentCount}</b></div><div><i className="dot late"/><span>{t("late")}</span><b>{lateCount}</b></div><div><i className="dot absent"/><span>{t("not_recorded")}</span><b>{absentCount}</b></div></div>
   </div>
  </div>
  <div className="dashboard-grid-bottom">
   <div className="panel"><div className="panel-head"><div><span className="eyebrow">{t("recent_activity")}</span><h2>{t("recent_attendance_activity")}</h2><p>{t("recent_attendance_data")}</p></div><button className="link-btn" onClick={()=>onNavigate("attendance")}>{t("view_all")}</button></div><AttendanceMini rows={recent}/></div>
   <div className="panel quick executive-quick"><div className="panel-head"><div><span className="eyebrow">{t("quick_access")}</span><h2>{t("quick_access")}</h2><p>{t("quick_access_desc")}</p></div></div><Quick label={t("add_employee")} icon="users" onClick={()=>onNavigate('employee-add')}/><Quick label={t("work_schedule")} icon="calendar" onClick={()=>onNavigate('schedule')}/><Quick label={t("payroll")} icon="payroll" onClick={()=>onNavigate('payroll')}/><Quick label={t("leave_request")} icon="request" onClick={()=>onNavigate('leave-request')}/></div>
  </div>
 </div>
}
function Stat({title,value,hint,icon}:{title:string;value:string;hint:string;icon:string}){return <div className="stat-card"><div className="stat-icon"><Icon name={icon}/></div><div><span>{title}</span><strong>{value}</strong><small>{hint}</small></div></div>}
function Quick({label,icon,onClick}:{label:string;icon:string;onClick:()=>void}){return <button className="quick-action" onClick={onClick}><span className="quick-icon"><Icon name={icon}/></span>{label}<span aria-hidden="true">›</span></button>}
function AttendanceMini({rows}:{rows:Absensi[]}){const { t } = useTranslation(); return <div className="table-wrap"><table><thead><tr><th>{t('employee')}</th><th>{t('date')}</th><th>{t('check_in')}</th><th>{t('check_out')}</th><th>{t('status')}</th></tr></thead><tbody>{rows.length?rows.map((a,i)=><tr key={a.id||i}><td><b>{a.nama||'-'}</b><small>{a.id_karyawan||''}</small></td><td>{a.tanggal||'-'}</td><td className="green">{a.jam_masuk||'-'}</td><td>{a.jam_pulang||'-'}</td><td><Status value={a.status||'Hadir'}/></td></tr>):<Empty cols={5}/>}</tbody></table></div>}

function Employees({data,onDelete,onEdit,onExport,onAdd}:{data:Karyawan[];onDelete:(k:Karyawan)=>void;onEdit:(k:Karyawan)=>void;onExport:(columns:string[],format:'csv'|'excel')=>void;onAdd:()=>void}){
  const { t } = useTranslation();
 const [open,setOpen]=useState(false);
  const [detail,setDetail]=useState<Karyawan|null>(null);
 const available=[
  ["id_karyawan","ID Karyawan"],
  ["nama","Nama"],
  ["nik_ktp","NIK KTP"],
  ["tempat_lahir","Tempat Lahir"],
  ["tanggal_lahir","Tanggal Lahir"],
  ["jenis_kelamin","Jenis Kelamin"],
  ["status_pernikahan","Status Pernikahan"],
["bank_name","Bank"],
  ["bank_account","No. Rekening"],
  ["nama_ibu_kandung","Nama Ibu Kandung"],
  ["jabatan","Jabatan"],
  ["departemen","Departemen"],
  ["email","Email"],
  ["no_telp","No. Telp"],
  ["alamat_rumah","Alamat Rumah"],
  ["tanggal_masuk","Tanggal Masuk"],
  ["status_karyawan","Status Karyawan"],
  ["status_aktif","Status Aktif"],
  ["gaji_pokok","Gaji Pokok"],
  ["role","Role"],
  ["email_terverifikasi","Email Terverifikasi"]
 ] as const;
 const [selected,setSelected]=useState<string[]>(available.slice(0,9).map(x=>x[0]));
 const toggle=(key:string)=>setSelected(v=>v.includes(key)?v.filter(x=>x!==key):[...v,key]);
 return <><Heading title={t('employees')} desc={t("employees_desc")} action={t("add_employee")} onAction={onAdd}/>
 <div className="toolbar"><b>{data.length} {t("employees").toLowerCase()}</b><button className="secondary" onClick={()=>setOpen(true)}>{t("export_data")}</button></div>
 {open&&<div className="export-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setOpen(false)}}>
   <div className="export-card">
    <div className="export-head"><div><span>{t("people_export")}</span><h2>{t("export_employee_database")}</h2><p>{t("select_columns_for_file")}</p></div><button className="icon-btn" onClick={()=>setOpen(false)}>×</button></div>
    <div className="export-actions-top"><button type="button" className="link-btn" onClick={()=>setSelected(available.map(x=>x[0]))}>{t("select_all")}</button><button type="button" className="link-btn" onClick={()=>setSelected([])}>{t("clear_all")}</button><strong>{selected.length} {t("columns")}</strong></div>
    <div className="export-columns">{available.map(([key,label])=><label key={key} className="export-check"><input type="checkbox" checked={selected.includes(key)} onChange={()=>toggle(key)}/><span>{label}</span></label>)}</div>
    <div className="export-foot"><button className="secondary" onClick={()=>setOpen(false)}>{t("cancel")}</button><button className="secondary" disabled={!selected.length} onClick={()=>{onExport(selected,'csv');setOpen(false)}}>{t("download_csv")}</button><button className="primary" disabled={!selected.length} onClick={()=>{onExport(selected,'excel');setOpen(false)}}>{t("download_excel")}</button></div>
   </div>
 </div>}
   {detail&&(
  <div className="export-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setDetail(null)}}>
    <div className="export-card employee-detail-card">
      <div className="export-head">
        <div>
          <span>{t("people_detail")}</span>
          <h2>{t("employee_detail")}</h2>
          <p>{t("employee_detail_desc")}</p>
        </div>
        <button className="icon-btn" onClick={()=>setDetail(null)}>×</button>
      </div>

      <div className="employee-detail-grid">

        <div className="detail-section">
          <h3>{t("identity")}</h3>
          <div className="detail-item"><span>{t("employee_id")}</span><b>{detail.id_karyawan||'—'}</b></div>
          <div className="detail-item"><span>Nama</span><b>{detail.nama||'—'}</b></div>
          <div className="detail-item"><span>{t("national_id")}</span><b>{detail.nik_ktp||'—'}</b></div>
          <div className="detail-item"><span>{t("birth_place")}</span><b>{detail.tempat_lahir||'—'}</b></div>
          <div className="detail-item"><span>{t("birth_date")}</span><b>{detail.tanggal_lahir||'—'}</b></div>
          <div className="detail-item"><span>{t("gender")}</span><b>{detail.jenis_kelamin||'—'}</b></div>
          <div className="detail-item"><span>{t("marital_status")}</span><b>{detail.status_pernikahan||'—'}</b></div>
          <div className="detail-item"><span>{t("mother_name")}</span><b>{detail.nama_ibu_kandung||'—'}</b></div>
        </div>

        <div className="detail-section">
          <h3>{t("employment")}</h3>
          <div className="detail-item"><span>{t("position")}</span><b>{detail.jabatan||'—'}</b></div>
          <div className="detail-item"><span>{t("department")}</span><b>{detail.departemen||'—'}</b></div>
          <div className="detail-item"><span>{t("join_date")}</span><b>{detail.tanggal_masuk||'—'}</b></div>
          <div className="detail-item"><span>{t("employee_status")}</span><b>{detail.status_karyawan||'—'}</b></div>
          <div className="detail-item"><span>{t("active_status")}</span><b>{detail.status_aktif===true?t('active'):detail.status_aktif===false?t('inactive'):'—'}</b></div>
          <div className="detail-item"><span>Role</span><b>{detail.role||'—'}</b></div>
        </div>

        <div className="detail-section">
          <h3>{t("contact")}</h3>
          <div className="detail-item"><span>Email</span><b>{detail.email||'—'}</b></div>
          <div className="detail-item"><span>{t("email_verified")}</span><b>{detail.email_terverifikasi===true?t('verified'):detail.email_terverifikasi===false?t('not_verified'):'—'}</b></div>
          <div className="detail-item"><span>{t("phone")}</span><b>{detail.no_telp||'—'}</b></div>
          <div className="detail-item"><span>{t("home_address")}</span><b>{detail.alamat_rumah||'—'}</b></div>
        </div>

        <div className="detail-section">
          <h3>{t("bank_payroll")}</h3>
          <div className="detail-item"><span>{t("bank")}</span><b>{detail.bank_name||'—'}</b></div>
          <div className="detail-item"><span>{t("bank_account")}</span><b>{detail.bank_account||'—'}</b></div>
          <div className="detail-item"><span>{t("basic_salary")}</span><b>{detail.gaji_pokok!=null?money(Number(detail.gaji_pokok)):'—'}</b></div>
        </div>

      </div>

      <div className="export-foot">
        <button className="secondary" onClick={()=>setDetail(null)}>{t("close")}</button>
        <button className="primary" onClick={()=>{onEdit(detail);setDetail(null)}}>{t("edit_data")}</button>
      </div>
    </div>
  </div>
)}
 <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>{t("name")}</th><th>{t("id")}</th><th>{t("position")}</th><th>{t("department")}</th><th>{t("status")}</th><th>{t("basic_salary")}</th><th>{t("actions")}</th></tr></thead><tbody>{data.length?data.map(k=><tr key={k.id}><td><div className="person"><div className="mini-avatar">{k.nama?.[0]||'K'}</div><b>{k.nama}</b></div></td><td>{k.id_karyawan||'-'}</td><td>{k.jabatan||'-'}</td><td>{k.departemen||'-'}</td><td><Status value={k.status_aktif===false?t('inactive'):t('active')}/></td><td>{money(Number(k.gaji_pokok||0))}</td><td>
  <div className="row-actions">
  <button className="link-btn" onClick={()=>setDetail(k)}>
    Detail
  </button>
  <button className="link-btn" onClick={()=>onEdit(k)}>
    Edit
  </button>

    <button className="danger-text" onClick={()=>onDelete(k)}>{t("delete")}</button>
  </div>
</td></tr>):<Empty cols={7}/>}</tbody></table></div></div></>
}
function NewEmployees({data,onRefresh}:{data:Karyawan[];onRefresh:()=>void}) {
  const [selected,setSelected]=useState<Karyawan|null>(null);
  const [photoUrl,setPhotoUrl]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    let active=true;
    const load=()=>{
      setPhotoUrl('');
      const path=selected?.foto_url;
      if(!path) return;

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path);

      if(active && data?.publicUrl) {
        setPhotoUrl(data.publicUrl);
      }
    };

    load();
    return()=>{active=false};
  },[selected?.id,selected?.foto_url]);

  const decide=async(decision:'Terima'|'Tolak')=>{
    if(!selected) return;
    setBusy(true);
    const update = decision==='Terima'
      ? { status_aktif:true, status_karyawan: selected.status_karyawan && selected.status_karyawan !== 'Menunggu Verifikasi' ? selected.status_karyawan : 'Tetap' }
      : { status_aktif:false, status_karyawan:'Ditolak' };
    const {error}=await supabase.from('karyawan').update(update).eq('id',selected.id);
    if(error){ await appAlert(error.message); setBusy(false); return; }
    setSelected(null); setBusy(false); onRefresh();
  };

  return <>
    <Heading title="Karyawan Baru" desc="Pendaftar baru yang menunggu pemeriksaan dan konfirmasi." />
    <div className="toolbar"><b>{data.length} pendaftar menunggu konfirmasi</b></div>
    <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Foto</th><th>Nama</th><th>ID Karyawan</th><th>Departemen</th><th>Jabatan</th><th>Tanggal Daftar</th><th>Aksi</th></tr></thead><tbody>
      {data.length ? data.map(k=><tr key={k.id}>
        <td><div className="mini-avatar">{k.nama?.[0]||'K'}</div></td>
        <td><b>{k.nama||'—'}</b><small>{k.email||'—'}</small></td>
        <td>{k.id_karyawan||'—'}</td><td>{k.departemen||'—'}</td><td>{k.jabatan||'—'}</td><td>{k.created_at ? new Date(k.created_at).toLocaleDateString('id-ID') : '—'}</td>
        <td><button className="link-btn" onClick={()=>setSelected(k)}>Lihat Detail</button></td>
      </tr>) : <Empty cols={7}/>}</tbody></table></div></div>
    {selected&&<div className="profile-panel-overlay" onClick={()=>!busy&&setSelected(null)}><div className="export-card employee-detail-card" onClick={e=>e.stopPropagation()}>
      <div className="export-head"><div><span className="eyebrow">PENDAFTARAN BARU</span><h2>{selected.nama||'Karyawan Baru'}</h2><p>Periksa seluruh data yang diisi pada form pendaftaran.</p></div><button className="icon-btn" onClick={()=>!busy&&setSelected(null)}>×</button></div>
      <div style={{display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap',marginBottom:20}}>
        <div style={{width:150,height:190,borderRadius:14,overflow:'hidden',background:'#eef2f7',display:'flex',alignItems:'center',justifyContent:'center'}}>{photoUrl?<img src={photoUrl} alt="Foto pendaftar" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:48,color:'#98a2b3'}}>{selected.nama?.[0]||'K'}</span>}</div>
        <div className="employee-detail-grid" style={{flex:1,minWidth:280}}>{[
          ['NIK KTP',selected.nik_ktp],['ID Karyawan',selected.id_karyawan],['Nama',selected.nama],['Tempat Lahir',selected.tempat_lahir],['Tanggal Lahir',selected.tanggal_lahir],['Jenis Kelamin',selected.jenis_kelamin],['Alamat Rumah',selected.alamat_rumah],['No. Telepon',selected.no_telp],['Email',selected.email],['Status Pernikahan',selected.status_pernikahan],['Nama Ibu Kandung',selected.nama_ibu_kandung],['Departemen',selected.departemen],['Jabatan',selected.jabatan],['Status Karyawan',selected.status_karyawan],['Tanggal Masuk',selected.tanggal_masuk],['Gaji Pokok',selected.gaji_pokok!=null?money(Number(selected.gaji_pokok)):null],['Nama Bank',selected.bank_name],['Nomor Rekening',selected.bank_account]
        ].map(([label,value])=><div className="detail-item" key={label}><span>{label}</span><b>{value||'—'}</b></div>)}</div>
      </div>
      <div className="export-foot"><button className="secondary" disabled={busy} onClick={()=>setSelected(null)}>Tutup</button><button className="danger-text" disabled={busy} onClick={()=>decide('Tolak')}>Tolak</button><button className="primary" disabled={busy} onClick={()=>decide('Terima')}>{busy?'Memproses…':'Terima'}</button></div>
    </div></div>}
  </>;
}

function AddEmployee({onDone,refresh}:{onDone:()=>void;refresh:()=>void}) {
  const { t } = useTranslation();
  const [f,setF]=useState({
    nik_ktp:'',
    id_karyawan:'',
    nama:'',
    tempat_lahir:'',
    tanggal_lahir:'',
    alamat_rumah:'',
    no_telp:'',
    email:'',
    nama_ibu_kandung:'',
    departemen:'',
    jabatan:'',
    status_karyawan:'Tetap',
    tanggal_masuk:'',
    gaji_pokok:'',
    bank_name:'',
    bank_account:''
  }),[saving,setSaving]=useState(false),[msg,setMsg]=useState('');

  async function save(e:FormEvent){
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const payload={
      ...f,
      gaji_pokok:Number(f.gaji_pokok||0),
      status_aktif:true
    };

    const {error:e2}=await supabase.from('karyawan').insert(payload);

    setSaving(false);

    if(e2)setMsg(e2.message);
    else{
      refresh();
      onDone();
    }
  }

  const labels:Record<string,string>={
    nik_ktp:t("national_id"),
    id_karyawan:t("employee_id"),
    nama:t("name"),
    tempat_lahir:t("birth_place"),
    tanggal_lahir:t("birth_date"),
    alamat_rumah:t("home_address"),
    no_telp:t("phone"),
    email:t("email"),
    nama_ibu_kandung:t("mother_name"),
    departemen:t("department"),
    jabatan:t("position"),
    status_karyawan:t("employee_status"),
    tanggal_masuk:t("join_date"),
    gaji_pokok:t("basic_salary"),
    bank_name:t("bank"),
    bank_account:t("bank_account")
  };

  return <><Heading title={t("add_employee")} desc={t("add_employee_desc")}/>
    <div className="panel form-panel">
      <form className="form-grid" onSubmit={save}>
        {Object.entries(f).map(([k,v])=>
          <label key={k}>{labels[k]||fieldLabel(k)}
            {k==='status_karyawan' ? (
              <select value={String(v??'')} onChange={e=>setF({...f,[k]:e.target.value})}>
                <option value="Tetap">Tetap</option>
                <option value="Kontrak">Kontrak</option>
                <option value="Harian">Harian</option>
                <option value="Probation">Probation</option>
              </select>
            ) : (
              <input
                required={['id_karyawan','nama'].includes(k)}
                type={k==='gaji_pokok'?'number':(['tanggal_lahir','tanggal_masuk'].includes(k)?'date':k==='email'?'email':'text')}
                value={String(v??'')}
                onChange={e=>setF({...f,[k]:e.target.value})}
              />
            )}
          </label>
        )}
        {msg&&<div className="form-error full-span">{msg}</div>}
        <div className="full-span form-actions">
          <button type="button" className="secondary" onClick={onDone}>Batal</button>
          <button className="primary" disabled={saving}>
            {saving ? t('saving') : t('save_employee')}
          </button>
        </div>
      </form>
    </div>
  </>
}

function EmployeeEditor({ employee, onClose, onSave }: { employee: Karyawan; onClose: () => void; onSave: (p: Record<string, unknown>) => void }) {
  const { t } = useTranslation();
  const [f, setF] = useState({
    nik_ktp: employee.nik_ktp || '',
    id_karyawan: employee.id_karyawan || '',
    nama: employee.nama || '',
    tempat_lahir: employee.tempat_lahir || '',
    tanggal_lahir: employee.tanggal_lahir || '',
    jenis_kelamin: employee.jenis_kelamin || '',
    alamat_rumah: employee.alamat_rumah || '',
    no_telp: employee.no_telp || '',
    email: employee.email || '',
    status_pernikahan: employee.status_pernikahan || '',
    nama_ibu_kandung: employee.nama_ibu_kandung || '',
    departemen: employee.departemen || '',
    jabatan: employee.jabatan || '',
    status_karyawan: employee.status_karyawan || 'Tetap',
    tanggal_masuk: employee.tanggal_masuk || '',
    gaji_pokok: String(employee.gaji_pokok || 0),
    bank_name: employee.bank_name || '',
    bank_account: employee.bank_account || '',
    status_aktif: employee.status_aktif !== false
  });

  const setField=(key:string,value:string|boolean)=>{
    setF(prev=>({...prev,[key]:value}));
  };

  return (
    <div className="drawer-backdrop" onMouseDown={e => { if (e.currentTarget === e.target) onClose(); }}>
      <aside className="edit-drawer">
        <div className="drawer-head">
          <div>
            <span>{t('employee_profile')}</span>
            <h2>{t('edit_employee')}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} type="button">×</button>
        </div>

        <div className="drawer-body">
          <label>NIK KTP
            <input value={f.nik_ktp} onChange={e=>setField('nik_ktp',e.target.value)} />
          </label>

          <label>ID Karyawan
            <input value={f.id_karyawan} onChange={e=>setField('id_karyawan',e.target.value)} />
          </label>

          <label>Nama
            <input value={f.nama} onChange={e=>setField('nama',e.target.value)} />
          </label>

          <label>Tempat Lahir
            <input value={f.tempat_lahir} onChange={e=>setField('tempat_lahir',e.target.value)} />
          </label>

          <label>Tanggal Lahir
            <input type="date" value={f.tanggal_lahir} onChange={e=>setField('tanggal_lahir',e.target.value)} />
          </label>

          <label>Jenis Kelamin
            <select value={f.jenis_kelamin} onChange={e=>setField('jenis_kelamin',e.target.value)}>
              <option value="">Pilih Jenis Kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </label>

          <label>Alamat
            <input value={f.alamat_rumah} onChange={e=>setField('alamat_rumah',e.target.value)} />
          </label>

          <label>No. Telepon
            <input value={f.no_telp} onChange={e=>setField('no_telp',e.target.value)} />
          </label>

          <label>Email
            <input type="email" value={f.email} onChange={e=>setField('email',e.target.value)} />
          </label>

          <label>Status Pernikahan
            <select value={f.status_pernikahan} onChange={e=>setField('status_pernikahan',e.target.value)}>
              <option value="">Pilih Status Pernikahan</option>
              <option value="Belum Menikah">Belum Menikah</option>
              <option value="Menikah">Menikah</option>
              <option value="Cerai">Cerai</option>
            </select>
          </label>

          <label>Nama Ibu Kandung
            <input value={f.nama_ibu_kandung} onChange={e=>setField('nama_ibu_kandung',e.target.value)} />
          </label>

          <label>Departemen
            <input value={f.departemen} onChange={e=>setField('departemen',e.target.value)} />
          </label>

          <label>Jabatan
            <input value={f.jabatan} onChange={e=>setField('jabatan',e.target.value)} />
          </label>

          <label>Status Karyawan
            <select value={f.status_karyawan} onChange={e=>setField('status_karyawan',e.target.value)}>
              <option value="Tetap">Tetap</option>
              <option value="Kontrak">Kontrak</option>
              <option value="Harian">Harian</option>
              <option value="Probation">Probation</option>
            </select>
          </label>

          <label>Tanggal Masuk
            <input type="date" value={f.tanggal_masuk} onChange={e=>setField('tanggal_masuk',e.target.value)} />
          </label>

          <label>Gaji Pokok
            <input type="number" value={f.gaji_pokok} onChange={e=>setField('gaji_pokok',e.target.value)} />
          </label>

          <label>Nama Bank
            <input value={f.bank_name} onChange={e=>setField('bank_name',e.target.value)} />
          </label>

          <label>Nomor Rekening
            <input value={f.bank_account} onChange={e=>setField('bank_account',e.target.value)} />
          </label>

          <label className="switch-row">
            <span>{t('active_status')}</span>
            <input
              type="checkbox"
              checked={f.status_aktif}
              onChange={e=>setField('status_aktif',e.target.checked)}
            />
          </label>
        </div>

        <div className="drawer-foot">
          <button type="button" className="secondary" onClick={onClose}>Batal</button>
          <button
            type="button"
            className="primary"
            onClick={async () => {
              if (!f.id_karyawan.trim()) {
                await appAlert(t('employee_id_required'));
                return;
              }
              onSave({
                ...f,
                id_karyawan: f.id_karyawan.trim().toUpperCase(),
                gaji_pokok: Number(f.gaji_pokok || 0)
              });
            }}
          >
            Simpan Perubahan
          </button>
        </div>
      </aside>
    </div>
  );
}
function Branch({title,desc,items,tab,setTab,action,onAction,children}:{title:string;desc:string;items:{key:string;label:string;icon:string}[];tab:string;setTab:(v:string)=>void;action?:string;onAction?:()=>void;children:ReactNode}){return <><Heading title={title} desc={desc} action={action} onAction={onAction}/><div className="branch-nav">{items.map(i=><button key={i.key} className={tab===i.key?'active':''} onClick={()=>setTab(i.key)}><span>{i.icon}</span>{i.label}</button>)}</div>{children}</>}

function HolidayModule(){const {t}=useTranslation();
 const [rows,setRows]=useState<any[]>([]),[modal,setModal]=useState(false),[f,setF]=useState({tanggal:isoToday(),nama:'',tipe:'Nasional'}),[msg,setMsg]=useState('');
 const load=async()=>{const {data,error}=await supabase.from('hris_hari_libur').select('*').order('tanggal');if(error)setMsg(error.message);else setRows(data||[])};useEffect(()=>{load()},[]);
 const save=async(e:FormEvent)=>{e.preventDefault();const {error}=await supabase.from('hris_hari_libur').insert(f);if(error)setMsg(error.message);else{setModal(false);setF({tanggal:isoToday(),nama:'',tipe:'Nasional'});load()}};
 const del=async(id:string)=>{if(await appConfirm(t('delete_holiday_confirm'))){const {error}=await supabase.from('hris_hari_libur').delete().eq('id',id);if(error)setMsg(error.message);else load()}};
 return <><Heading title={t('holidays')} desc={t('holidays_desc')} action={t('add_holiday')} onAction={()=>setModal(true)}/>{msg&&<div className="alert">{msg}</div>}<div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>{t('date')}</th><th>{t('name')}</th><th>{t('type')}</th><th>{t('actions')}</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td>{r.tanggal}</td><td><b>{r.nama}</b></td><td><Status value={r.tipe}/></td><td><button className="danger-text" onClick={()=>del(r.id)}>{t('delete')}</button></td></tr>):<Empty cols={4}/>}</tbody></table></div></div>{modal&&<SimpleModal title={t('add_holiday')} onClose={()=>setModal(false)} onSave={save}><label>{t('date')}<input type="date" value={f.tanggal} onChange={e=>setF({...f,tanggal:e.target.value})}/></label><label>{t('holiday_name')}<input required value={f.nama} onChange={e=>setF({...f,nama:e.target.value})}/></label><label>{t('type')}<select value={f.tipe} onChange={e=>setF({...f,tipe:e.target.value})}><option>Nasional</option><option>Perusahaan</option></select></label></SimpleModal>}</>
}

function LeaveModule({initial}:{initial:MenuKey}){const {t}=useTranslation();
 const [tab,setTab]=useState(initial==='leave-balance'?'balance':'requests'),[rows,setRows]=useState<any[]>([]),[balances,setBalances]=useState<any[]>([]),[modal,setModal]=useState(false),[employees,setEmployees]=useState<Karyawan[]>([]);
 const [f,setF]=useState({id_karyawan:'',jenis:'Tahunan',tanggal_mulai:isoToday(),tanggal_selesai:isoToday(),jumlah_hari:'1',alasan:'',status:'Menunggu'});
 const load=async()=>{const [a,b,c]=await Promise.all([supabase.from('hris_cuti').select('*').order('created_at',{ascending:false}),supabase.from('hris_saldo_cuti').select('*').eq('tahun',new Date().getFullYear()),supabase.from('karyawan').select('*').order('nama')]);if(!a.error)setRows(a.data||[]);if(!b.error)setBalances(b.data||[]);if(!c.error)setEmployees(c.data||[])};useEffect(()=>{load()},[]);
 const save=async(e:FormEvent)=>{e.preventDefault();const {data,error}=await supabase.from('hris_cuti').insert({...f,jumlah_hari:Number(f.jumlah_hari)}).select('id').single();if(error){await appAlert(error.message);return}if(data){const a=await supabase.rpc('hris_submit_approval',{p_modul:'leave',p_record_id:String(data.id)});if(a.error){await supabase.from('hris_cuti').delete().eq('id',data.id);await appAlert(a.error.message);return}}setModal(false);load()};
 const update=async(id:string,status:string)=>{const {data:req,error:e1}=await supabase.from('hris_approval_requests').select('id').eq('modul','leave').eq('record_id',id).eq('status','Menunggu').maybeSingle();if(e1||!req){await appAlert(e1?.message||t('approval_workflow_not_found'));return}const {error}=await supabase.rpc('hris_decide_approval',{p_id:req.id,p_status:status,p_catatan:status==='Ditolak'?(await appPrompt(t('rejection_reason_prompt'),'')||null):null});if(error)await appAlert(error.message);else load()};
 const ensureBalance=async(k:string)=>{const found=balances.find(x=>x.id_karyawan===k);if(found)return found;const {data,error}=await supabase.from('hris_saldo_cuti').insert({id_karyawan:k,tahun:new Date().getFullYear(),jenis:'Tahunan',saldo:12,terpakai:0}).select().single();if(error) return null;return data};
 const items=[['inbox',t('approval_inbox'),'request'],['requests',t('new_request'),'＋'],['history',t('history'),'calendar'],['balance',t('leave_balance'),'balance']].map(([key,label,icon])=>({key,label,icon}));
 return <Branch title={t('leave')} desc={t('leave_desc')} items={items} tab={tab} setTab={setTab} action={tab==='requests'?'＋ Buat Pengajuan':undefined} onAction={()=>setModal(true)}>{tab==='balance'?<div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>{t('employee')}</th><th>{t('type')}</th><th>{t('quota')}</th><th>{t('used')}</th><th>{t('remaining')}</th><th>{t('actions')}</th></tr></thead><tbody>{employees.map(k=>{const b=balances.find(x=>x.id_karyawan===k.id_karyawan);const quota=Number((b?.saldo??12))+Number(b?.terpakai??0);const used=Number(b?.terpakai??0);return <tr key={k.id}><td><b>{k.nama}</b><small>{k.id_karyawan}</small></td><td>Tahunan</td><td>{quota}</td><td>{used}</td><td><Status value={String(Math.max(0,quota-used))}/></td><td><button className="link-btn" onClick={()=>k.id_karyawan && ensureBalance(k.id_karyawan).then(load)}>{t('initialize')}</button></td></tr>})}</tbody></table></div></div>:<div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>{t('employee')}</th><th>{t('type')}</th><th>{t('date')}</th><th>{t('reason')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td>{r.id_karyawan}</td><td>{r.jenis}</td><td>{r.tanggal_mulai} s/d {r.tanggal_selesai}</td><td>{r.alasan||'-'}</td><td><Status value={r.status}/></td><td>{r.status==='Menunggu'&&<><button className="link-btn" onClick={()=>update(r.id,'Disetujui')}>{t('approve')}</button> <button className="danger-text" onClick={()=>update(r.id,'Ditolak')}>{t('reject')}</button></>}</td></tr>):<Empty cols={6}/>}</tbody></table></div></div>}{modal&&<SimpleModal title={t('leave_request')} onClose={()=>setModal(false)} onSave={save}><label>{t('employee')}<select required value={f.id_karyawan} onChange={e=>setF({...f,id_karyawan:e.target.value})}><option value="">{t('select_employee')}</option>{employees.map(k=><option key={k.id_karyawan} value={k.id_karyawan}>{k.nama} — {k.id_karyawan}</option>)}</select></label><label>{t('type')}<select value={f.jenis} onChange={e=>setF({...f,jenis:e.target.value})}><option>Tahunan</option><option>Sakit</option><option>Khusus</option></select></label><label>{t('start_date')}<input type="date" value={f.tanggal_mulai} onChange={e=>setF({...f,tanggal_mulai:e.target.value})}/></label><label>{t('end_date')}<input type="date" value={f.tanggal_selesai} onChange={e=>setF({...f,tanggal_selesai:e.target.value})}/></label><label>{t('days')}<input type="number" min="0.5" step="0.5" value={f.jumlah_hari} onChange={e=>setF({...f,jumlah_hari:e.target.value})}/></label><label>{t('reason')}<textarea value={f.alasan} onChange={e=>setF({...f,alasan:e.target.value})}/></label></SimpleModal>}</Branch>
}

function TalentModule({initial,employees}:{initial:MenuKey;employees:Karyawan[]}){const {t}=useTranslation();
 const [tab,setTab]=useState(initial==='kpi'?'kpi':initial==='recruitment'?'vacancies':initial==='candidates'?'candidates':'performance'),[rows,setRows]=useState<any[]>([]),[modal,setModal]=useState(false);
 const load=async()=>{const table=tab==='kpi'?'hris_kpi':tab==='vacancies'?'hris_lowongan':tab==='candidates'?'hris_kandidat':tab==='interviews'?'hris_interview':'hris_performance';const {data,error}=await supabase.from(table).select('*').order('created_at',{ascending:false});if(!error)setRows(data||[]);else setRows([])};useEffect(()=>{load()},[tab]);
 const items=[
  ['performance',t('performance'),'arrow'],
  ['kpi',t('kpi_target'),'kpi'],
  ['vacancies',t('vacancies'),'recruitment'],
  ['candidates',t('candidates'),'users'],
  ['interviews',t('interviews'),'calendar']
].map(([key,label,icon])=>({key,label,icon}));
 return <Branch title={t('talent')} desc={t('talent_desc')} items={items} tab={tab} setTab={setTab} action={`＋ ${t('add')}`} onAction={()=>setModal(true)}>{<TalentTable tab={tab} rows={rows}/>} {modal&&<TalentForm tab={tab} employees={employees} onClose={()=>setModal(false)} onSaved={()=>{setModal(false);load()}}/>}</Branch>

}
function TalentTable({tab,rows}:{tab:string;rows:any[]}){let cols:string[]=[];if(tab==='kpi')cols=['id_karyawan','periode','indikator','target','realisasi','skor','status'];else if(tab==='vacancies')cols=['posisi','departemen','jumlah_kebutuhan','status','tanggal_buka','tanggal_tutup'];else if(tab==='candidates')cols=['nama','email','no_telp','posisi','tahap','status'];else if(tab==='interviews')cols=['kandidat','tanggal','jam','interviewer','hasil','status'];else cols=['id_karyawan','periode','nilai','catatan','status'];return <div className="panel table-panel"><div className="table-wrap"><table><thead><tr>{cols.map(c=><th key={c}>{fieldLabel(c)}</th>)}</tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}>{cols.map(c=><td key={c}>{c==='status'?<Status value={String(r[c]??'-')}/>:String(r[c]??'-')}</td>)}</tr>):<Empty cols={cols.length}/>}</tbody></table></div></div>}
function TalentForm({tab,employees,onClose,onSaved}:{tab:string;employees:Karyawan[];onClose:()=>void;onSaved:()=>void}){const {t}=useTranslation();
 const [f,setF]=useState<any>(tab==='kpi'?{id_karyawan:'',periode:new Date().toISOString().slice(0,7),indikator:'',target:'',realisasi:'',bobot:'0',skor:'0',status:'Draft'}:tab==='vacancies'?{posisi:'',departemen:'',jumlah_kebutuhan:'1',status:'Open',tanggal_buka:isoToday(),tanggal_tutup:'',deskripsi:''}:tab==='candidates'?{nama:'',email:'',no_telp:'',posisi:'',sumber:'',tahap:'Screening',status:'Aktif',catatan:''}:tab==='interviews'?{kandidat:'',tanggal:isoToday(),jam:'09:00',interviewer:'',hasil:'',status:'Terjadwal'}:{id_karyawan:'',periode:new Date().toISOString().slice(0,7),nilai:'0',catatan:'',status:'Draft'});
 const table=tab==='kpi'?'hris_kpi':tab==='vacancies'?'hris_lowongan':tab==='candidates'?'hris_kandidat':tab==='interviews'?'hris_interview':'hris_performance';
 const save=async(e:FormEvent)=>{e.preventDefault();const numeric=['target','realisasi','bobot','skor','jumlah_kebutuhan','nilai'];const payload={...f};numeric.forEach(k=>{if(k in payload)payload[k]=Number(payload[k]||0)});const {error}=await supabase.from(table).insert(payload);if(error)await appAlert(error.message);else onSaved()};
 return <SimpleModal title={`${t('add')} ${tab==='kpi'?t('kpi'):tab==='vacancies'?t('vacancies'):tab==='candidates'?t('candidates'):tab==='interviews'?t('interviews'):t('performance')}`} onClose={onClose} onSave={save}>{Object.entries(f).map(([k,v])=><label key={k}>{fieldLabel(k)}{k==='id_karyawan'?<select required value={String(v)} onChange={e=>setF({...f,[k]:e.target.value})}><option value="">{t('select_employee')}</option>{employees.map(x=><option key={x.id_karyawan} value={x.id_karyawan}>{x.nama} — {x.id_karyawan}</option>)}</select>:<input required={['nama','posisi','indikator','kandidat'].includes(k)} type={['target','realisasi','bobot','skor','jumlah_kebutuhan','nilai'].includes(k)?'number':k==='tanggal'||k.includes('tanggal')?'date':k==='jam'?'time':'text'} value={String(v??'')} onChange={e=>setF({...f,[k]:e.target.value})}/>}</label>)}</SimpleModal>
}
function Reports({employees,attendance,onExport}:{employees:Karyawan[];attendance:Absensi[];onExport:(r:any[],f:string)=>void}){const {t}=useTranslation();const [tab,setTab]=useState('overview'),[payroll,setPayroll]=useState<any[]>([]);useEffect(()=>{if(tab==='payroll')supabase.from('hris_payroll').select('*').order('created_at',{ascending:false}).limit(2000).then(({data})=>setPayroll(data||[]))},[tab]);const items=[['overview',t('analytics'),'report'],['attendance',t('attendance_report'),'clock'],['payroll',t('payroll_report'),'payroll'],['people',t('employee_report'),'users']].map(([key,label,icon])=>({key,label,icon}));return <Branch title={t('reports')} desc={t('reports_desc')} items={items} tab={tab} setTab={setTab}>{tab==='overview'?<div className="report-grid"><ReportCard name={t('master_employees')} count={employees.length} onClick={()=>onExport(employees,'laporan-karyawan.csv')}/><ReportCard name={t('attendance')} count={attendance.length} onClick={()=>onExport(attendance,'laporan-absensi.csv')}/><ReportCard name={t('payroll')} count={payroll.length} onClick={()=>onExport(payroll,'laporan-payroll.csv')}/></div>:tab==='attendance'?<ReportCard name={t('attendance_report')} count={attendance.length} onClick={()=>onExport(attendance,'laporan-absensi.csv')}/>:tab==='people'?<ReportCard name={t('employee_report')} count={employees.length} onClick={()=>onExport(employees,'laporan-karyawan.csv')}/>:<ReportCard name={t('payroll_report')} count={payroll.length} onClick={()=>onExport(payroll,'laporan-payroll.csv')}/>}</Branch>}
function ReportCard({name,count,onClick}:{name:string;count:number;onClick:()=>void}){const {t}=useTranslation();return <div className="report-card"><span>{t('reports')||'LAPORAN'}</span><h3>{name}</h3><b>{count}</b><p>{t('data_available')||'data tersedia'}</p><button className="primary" onClick={onClick}>{t('export_csv')||'Export CSV'}</button></div>}
function Settings(){
  const { t } = useTranslation();
  const [f,setF]=useState<any>({
    company_name:'Project by Tirta',
    work_start:'07:00',
    work_end:'16:00',
    break_minutes:60,
    payday_day:'Jumat',
    currency:'IDR',
    timezone:'Asia/Jakarta',
    overtime_multiplier:2,
    late_tolerance_minutes:10,
    attendance_radius_meters:100,
    attendance_latitude:'',
    attendance_longitude:'',
    attendance_max_accuracy_meters:100,
    auto_approve_attendance:false,
    notify_late:true,
    notify_leave:true,
    maintenance_mode:false
  });

  const [tab,setTab]=useState('Perusahaan');
  const [msg,setMsg]=useState('');

  type ThemeDefinition = {
    id:string;
    name:string;
    description:string;
    primary:string;
    accent:string;
    background:string;
    surface:string;
    text:string;
    border:string;
    sidebar:string;
    sidebarText:string;
    sidebarMuted:string;
    sidebarActive:string;
    sidebarActiveText:string;
  };

  const DEFAULT_THEME: ThemeDefinition = {
    id:'moon',
    name:'Project by Tirta — Navy Gold',
    description:'Tema utama enterprise Project by Tirta.',
    primary:'#101a33', accent:'#d6ae58', background:'#f6f7fb',
    surface:'#ffffff', text:'#172033', border:'#d6ae58',
    sidebar:'#101a33', sidebarText:'#ffffff',
    sidebarMuted:'#cbd5e1', sidebarActive:'#d6ae58',
    sidebarActiveText:'#101a33'
  };

  const [customTheme,setCustomTheme]=useState({
    primary:DEFAULT_THEME.primary,
    accent:DEFAULT_THEME.accent,
    background:DEFAULT_THEME.background,
    surface:DEFAULT_THEME.surface,
    text:DEFAULT_THEME.text,
    border:DEFAULT_THEME.border,
    sidebar:DEFAULT_THEME.sidebar,
    sidebarText:DEFAULT_THEME.sidebarText,
    sidebarMuted:DEFAULT_THEME.sidebarMuted,
    sidebarActive:DEFAULT_THEME.sidebarActive,
    sidebarActiveText:DEFAULT_THEME.sidebarActiveText
  });
  const [activeThemeId,setActiveThemeId]=useState('moon');

  const themes:ThemeDefinition[]=[
    DEFAULT_THEME,
    {id:'blue',name:'Corporate Blue',description:'Tampilan profesional biru korporat.',primary:'#123b63',accent:'#2f80ed',background:'#f4f7fb',surface:'#ffffff',text:'#172033',border:'#b8cee5',
    sidebar:'#123b63',sidebarText:'#ffffff',sidebarMuted:'#dbeafe',
    sidebarActive:'#2f80ed',sidebarActiveText:'#ffffff'},
    {id:'green',name:'Professional Green',description:'Tema untuk operasional dan workforce.',primary:'#174d3b',accent:'#2e9d68',background:'#f4f8f6',surface:'#ffffff',text:'#172033',border:'#a9d7c0',
    sidebar:'#174d3b',sidebarText:'#ffffff',sidebarMuted:'#d1fae5',
    sidebarActive:'#2e9d68',sidebarActiveText:'#ffffff'},
    {id:'purple',name:'Modern Purple',description:'Tema modern untuk HR dan talent.',primary:'#3b2a63',accent:'#7c3aed',background:'#f7f5fb',surface:'#ffffff',text:'#172033',border:'#c8b8e8',
    sidebar:'#3b2a63',sidebarText:'#ffffff',sidebarMuted:'#ede9fe',
    sidebarActive:'#7c3aed',sidebarActiveText:'#ffffff'},
    {id:'dark',name:'Dark Enterprise',description:'Mode gelap untuk penggunaan malam.',primary:'#0b132b',accent:'#d6ae58',background:'#101827',surface:'#172033',text:'#f8fafc',border:'#334155',
    sidebar:'#0b132b',sidebarText:'#f8fafc',sidebarMuted:'#cbd5e1',
    sidebarActive:'#d6ae58',sidebarActiveText:'#0b132b'},
    {id:'light',name:'Light Enterprise',description:'Tampilan terang dan minimalis.',primary:'#1f2937',accent:'#2563eb',background:'#f8fafc',surface:'#ffffff',text:'#111827',border:'#dbe3ee',
    sidebar:'#1f2937',sidebarText:'#ffffff',sidebarMuted:'#d1d5db',
    sidebarActive:'#2563eb',sidebarActiveText:'#ffffff'}
  ];

  const isHexColor=(value:string)=>/^#[0-9a-f]{6}$/i.test(value);
  const normalizeTheme=(theme:Partial<ThemeDefinition>|null|undefined):ThemeDefinition=>{
    const values={...DEFAULT_THEME,...(theme||{})};
    return {
      id: typeof values.id==='string' ? values.id : DEFAULT_THEME.id,
      name: typeof values.name==='string' ? values.name : DEFAULT_THEME.name,
      description: typeof values.description==='string' ? values.description : DEFAULT_THEME.description,
      primary:isHexColor(values.primary)?values.primary:DEFAULT_THEME.primary,
      accent:isHexColor(values.accent)?values.accent:DEFAULT_THEME.accent,
      background:isHexColor(values.background)?values.background:DEFAULT_THEME.background,
      surface:isHexColor(values.surface)?values.surface:DEFAULT_THEME.surface,
      text:isHexColor(values.text)?values.text:DEFAULT_THEME.text,
      border:isHexColor(values.border)?values.border:DEFAULT_THEME.border,
      sidebar:isHexColor(values.sidebar)?values.sidebar:DEFAULT_THEME.sidebar,
      sidebarText:isHexColor(values.sidebarText)?values.sidebarText:DEFAULT_THEME.sidebarText,
      sidebarMuted:isHexColor(values.sidebarMuted)?values.sidebarMuted:DEFAULT_THEME.sidebarMuted,
      sidebarActive:isHexColor(values.sidebarActive)?values.sidebarActive:DEFAULT_THEME.sidebarActive,
      sidebarActiveText:isHexColor(values.sidebarActiveText)?values.sidebarActiveText:DEFAULT_THEME.sidebarActiveText
    };
  };

  const hexToRgb=(hex:string)=>{
    const h=hex.replace('#','').trim();
    if(h.length!==6) return null;
    const n=parseInt(h,16);
    if(Number.isNaN(n)) return null;
    return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
  };

  const relativeLuminance=(hex:string)=>{
    const rgb=hexToRgb(hex);
    if(!rgb) return 1;
    const channel=(v:number)=>{
      const c=v/255;
      return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4);
    };
    return 0.2126*channel(rgb.r)+0.7152*channel(rgb.g)+0.0722*channel(rgb.b);
  };

  const contrastRatio=(foreground:string,background:string)=>{
    const a=relativeLuminance(foreground);
    const b=relativeLuminance(background);
    const light=Math.max(a,b);
    const dark=Math.min(a,b);
    return (light+0.05)/(dark+0.05);
  };

  const getReadableText=(background:string,preferred:string)=>{
    const white='#ffffff';
    const black='#111827';
    if(contrastRatio(preferred,background)>=4.5) return preferred;
    return contrastRatio(black,background)>=contrastRatio(white,background)
      ? black
      : white;
  };

  const applyTheme=(input:Partial<ThemeDefinition>,persist=true)=>{
    const theme=normalizeTheme(input);
    const root=document.documentElement;
    const vars:Record<string,string>={
      '--mx-primary':theme.primary,
      '--mx-primary-contrast':getReadableText(theme.primary,'#ffffff'),
      '--mx-accent':theme.accent,
      '--mx-background':theme.background,
      '--mx-surface':theme.surface,
      '--mx-surface-alt':theme.background,
      '--mx-text':getReadableText(theme.background,theme.text),
      '--mx-text-secondary':getReadableText(theme.surface,'#667085'),
      '--mx-text-muted':getReadableText(theme.surface,'#98a2b3'),
                      '--muted':getReadableText(theme.background,'#667085'),
                      '--green':getReadableText(theme.background,'#16845a'),
                      '--red':getReadableText(theme.background,'#b42318'),
                      '--orange':getReadableText(theme.background,'#b7791f'),
      '--mx-control-bg':theme.surface,
      '--mx-control-text':getReadableText(theme.surface,theme.text),
      '--mx-control-border':theme.border,
      '--mx-sidebar':theme.sidebar,
      '--mx-sidebar-text':getReadableText(theme.sidebar,theme.sidebarText),
      '--mx-sidebar-muted':getReadableText(theme.sidebar,theme.sidebarMuted),
      '--mx-sidebar-active':theme.sidebarActive,
      '--mx-sidebar-active-text':getReadableText(theme.sidebarActive,theme.sidebarActiveText),
      '--mx-border':theme.border,
      '--mx-border-strong':theme.accent,
      '--mx-focus':theme.accent,
      '--mx-blue':theme.primary,
      '--mx-blue-soft':theme.background,
      '--mx-success':'#16845a',
      '--mx-warning':'#b7791f',
      '--mx-danger':'#b42318',
      '--mx-info':'#2563eb',
      '--blue':theme.primary,
      '--blue2':theme.primary,
      '--blue-soft':theme.background,
      '--ink':theme.text,
      '--line':theme.border,
      '--surface':theme.surface,
      '--bg':theme.background
    };
    Object.entries(vars).forEach(([key,value])=>root.style.setProperty(key,value));
    setCustomTheme({
      primary:theme.primary,
      accent:theme.accent,
      background:theme.background,
      surface:theme.surface,
      text:theme.text,
      border:theme.border,
      sidebar:theme.sidebar,
      sidebarText:theme.sidebarText,
      sidebarMuted:theme.sidebarMuted,
      sidebarActive:theme.sidebarActive,
      sidebarActiveText:theme.sidebarActiveText
    });
    setActiveThemeId(theme.id);
    if(persist){
      localStorage.setItem('moonx-theme',JSON.stringify(theme));
      setMsg(`Tema "${theme.name || 'Tema Kustom'}" berhasil diterapkan.`);
    }
  };

  const updateCustomColor=(key:keyof typeof customTheme,value:string)=>{
    if(!isHexColor(value)) return;
    setCustomTheme(prev=>({...prev,[key]:value}));
    applyTheme({id:'custom',name:'Tema Kustom',description:'Tema kustom Project by Tirta',...customTheme,[key]:value},false);
    setActiveThemeId('custom');
  };

  useEffect(()=>{
    supabase.from('hris_company_settings').select('*').eq('id',1).maybeSingle().then(({data})=>{if(data)setF(data);});
    const saved=localStorage.getItem('moonx-theme');
    if(saved){
      try { applyTheme(JSON.parse(saved),false); }
      catch { applyTheme(DEFAULT_THEME,false); }
    } else applyTheme(DEFAULT_THEME,false);
  },[]);

  const save=async()=>{
    const {error}=await supabase.from('hris_company_settings').upsert({...f,id:1});
    setMsg(error?error.message:'Pengaturan berhasil disimpan.');
  };

  const saveCustomTheme=()=>{
    applyTheme({id:'custom',name:'Tema Kustom',description:'Tema kustom Project by Tirta',...customTheme},true);
    setMsg('Tema kustom berhasil disimpan dan diterapkan.');
  };

  const groups:any={
    'Perusahaan':[
      'company_name',
      'currency',
      'timezone'
    ],
    'Jam Kerja':[
      'work_start',
      'work_end',
      'break_minutes',
      'late_tolerance_minutes'
    ],
    'Payroll':[
      'payday_day',
      'overtime_multiplier'
    ],
    'Absensi':[
      'attendance_radius_meters',
      'attendance_latitude',
      'attendance_longitude',
      'attendance_max_accuracy_meters',
      'auto_approve_attendance'
    ],
    'Notifikasi':[
      'notify_late',
      'notify_leave'
    ],
    'Keamanan':[
      'maintenance_mode'
    ]
  };

  const labels:any={
    company_name:'Nama Perusahaan',
    currency:'Mata Uang',
    timezone:'Zona Waktu',
    work_start:'Jam Masuk',
    work_end:'Jam Pulang',
    break_minutes:'Istirahat (menit)',
    late_tolerance_minutes:'Toleransi Terlambat (menit)',
    payday_day:'Hari Gajian',
    overtime_multiplier:'Pengali Lembur',
    attendance_radius_meters:'Radius Absensi (meter)',
    attendance_latitude:'Latitude Lokasi Absensi',
    attendance_longitude:'Longitude Lokasi Absensi',
    attendance_max_accuracy_meters:'Maksimal Akurasi GPS (meter)',
    auto_approve_attendance:'Auto Approve Absensi',
    notify_late:'Notifikasi Keterlambatan',
    notify_leave:'Notifikasi Cuti',
    maintenance_mode:'Mode Maintenance'
  };

  return (
    <>
      <Heading
        title="Pengaturan"
        desc="Kelola konfigurasi perusahaan, operasional, payroll, absensi, keamanan, dan tampilan sistem."
        action="Simpan Perubahan"
        onAction={save}
      />

      {msg&&(
        <div className="theme-message">
          {msg}
        </div>
      )}

      <div className="settings-tabs">
        {Object.keys(groups).map(x=>(
          <button
            key={x}
            type="button"
            className={tab===x?'active':''}
            onClick={()=>setTab(x)}
          >
            {x}
          </button>
        ))}

        <button
          type="button"
          className={tab==='Tampilan & Tema'?'active':''}
          onClick={()=>setTab('Tampilan & Tema')}
        >
          🎨 Tampilan & Tema
        </button>
      </div>

      {tab==='Tampilan & Tema' ? (
        <div className="theme-manager">

          <div className="theme-manager-header">
            <div>
              <h2>{t('appearance_theme')}</h2>
              <p>
                Pilih tampilan visual yang digunakan oleh HRIS Project by Tirta.
              </p>
            </div>
          </div>

          <div className="theme-grid">
            {themes.map(theme=>(
              <button
                type="button"
                key={theme.id}
                className={`theme-card ${activeThemeId===theme.id?'active':''}`}
                aria-pressed={activeThemeId===theme.id}
                onClick={()=>applyTheme(theme,true)}
              >
                <div
                  className="theme-preview"
                  style={{
                    background:theme.background
                  }}
                >
                  <div
                    className="theme-preview-sidebar"
                    style={{
                      background:theme.primary
                    }}
                  >
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  <div className="theme-preview-content">

                    <div
                      className="theme-preview-top"
                      style={{
                        borderColor:theme.border
                      }}
                    ></div>

                    <div className="theme-preview-cards">
                      <i
                        style={{
                          background:theme.accent
                        }}
                      ></i>

                      <i
                        style={{
                          background:theme.primary
                        }}
                      ></i>

                      <i
                        style={{
                          background:theme.border
                        }}
                      ></i>
                    </div>

                    <div
                      className="theme-preview-line"
                      style={{
                        background:theme.accent
                      }}
                    ></div>

                  </div>
                </div>

                <div className="theme-card-body">
                  <div>
                    <strong>
                      {theme.name}
                    </strong>

                    <small>
                      {theme.description}
                    </small>
                  </div>

                  {activeThemeId===theme.id && (
                    <span className="theme-active-badge">✓ Aktif</span>
                  )}

                  <span
                    className="theme-color-dot"
                    style={{
                      background:theme.accent
                    }}
                  ></span>
                </div>
              </button>
            ))}
          </div>

          <div className="custom-theme-panel">

            <div>
              <h3>{t('custom_theme')}</h3>
              <p>
                Gunakan warna pilihan Anda untuk tampilan HRIS.
              </p>
            </div>

            <div className="custom-theme-controls">

              <label>
                Primary
                <input
                  type="color"
                  value={customTheme.primary}
                  onChange={e=>
                    updateCustomColor(
                      'primary',
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Accent
                <input
                  type="color"
                  value={customTheme.accent}
                  onChange={e=>
                    updateCustomColor(
                      'accent',
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Background
                <input
                  type="color"
                  value={customTheme.background}
                  onChange={e=>
                    updateCustomColor(
                      'background',
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Surface
                <input
                  type="color"
                  value={customTheme.surface}
                  onChange={e=>
                    updateCustomColor(
                      'surface',
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Text
                <input
                  type="color"
                  value={customTheme.text}
                  onChange={e=>
                    updateCustomColor(
                      'text',
                      e.target.value
                    )
                  }
                />
              </label>

              <label>
                Border
                <input
                  type="color"
                  value={customTheme.border}
                  onChange={e=>
                    updateCustomColor(
                      'border',
                      e.target.value
                    )
                  }
                />
              </label>

            </div>

            <div className="custom-theme-actions">
              <button
                type="button"
                className="primary theme-save-button"
                onClick={saveCustomTheme}
              >
                Simpan Tema Kustom
              </button>
            </div>

          </div>

        </div>
      ) : (

        <div className="panel form-panel settings-content">

          <div className="form-grid">

            {groups[tab].map((k:string)=>{

              const v=f[k];

              const bool=[
                'auto_approve_attendance',
                'notify_late',
                'notify_leave',
                'maintenance_mode'
              ].includes(k);

              return (
                <label key={k}>

                  {labels[k]}

                  {bool ? (

                    <input
                      type="checkbox"
                      checked={!!v}
                      onChange={e=>
                        setF({
                          ...f,
                          [k]:e.target.checked
                        })
                      }
                    />

                  ) : (

                    <input
                      type={
                        [
                          'break_minutes',
                          'late_tolerance_minutes',
                          'attendance_radius_meters',
                          'attendance_max_accuracy_meters',
                          'attendance_latitude',
                          'attendance_longitude'
                        ].includes(k)
                          ? 'number'
                          : k.includes('start')||k.includes('end')
                            ? 'time'
                            : 'text'
                      }
                      value={String(v??'')}
                      onChange={e=>
                        setF({
                          ...f,
                          [k]:
                            [
                              'break_minutes',
                              'late_tolerance_minutes',
                              'attendance_radius_meters',
                              'attendance_max_accuracy_meters',
                              'attendance_latitude',
                              'attendance_longitude'
                            ].includes(k)
                              ? Number(e.target.value)
                              : e.target.value
                        })
                      }
                    />

                  )}

                </label>
              );
            })}

          </div>

        </div>
      )}

    </>
  );
}
function Audit() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [selected, setSelected] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;

    const loadAudit = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('hris_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (mounted) {
        setRows(error ? [] : data || []);
        setLoading(false);
      }
    };

    loadAudit();

    return () => {
      mounted = false;
    };
  }, []);

  const normalize = (value: any) => {
    if (value === null || value === undefined) return '-';

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  const getChangedFields = (row: any) => {
    const oldValue =
      row?.old ??
      row?.old_data ??
      row?.old_values ??
      row?.metadata?.old ??
      {};

    const newValue =
      row?.new ??
      row?.new_data ??
      row?.new_values ??
      row?.metadata?.new ??
      {};

    const oldObj =
      oldValue && typeof oldValue === 'object' ? oldValue : {};

    const newObj =
      newValue && typeof newValue === 'object' ? newValue : {};

    const keys = Array.from(
      new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
    );

    return keys
      .filter(
        (key) =>
          JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])
      )
      .map((key) => ({
        field: key,
        oldValue: oldObj[key],
        newValue: newObj[key],
      }));
  };

  const formatDate = (value: any) => {
    if (!value) return '-';

    try {
      return new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return String(value);
    }
  };

  const actionLabel = (action: any) => {
    const value = String(action || '-').toUpperCase();

    if (value === 'INSERT' || value === 'CREATE') return 'CREATE';
    if (value === 'UPDATE') return 'UPDATE';
    if (value === 'DELETE') return 'DELETE';

    return value;
  };

  const actionClass = (action: any) => {
    const value = actionLabel(action);

    if (value === 'CREATE') return 'audit-badge audit-create';
    if (value === 'UPDATE') return 'audit-badge audit-update';
    if (value === 'DELETE') return 'audit-badge audit-delete';

    return 'audit-badge';
  };

  const filteredRows = rows.filter((row) => {
    const action = actionLabel(row.action);
    const module = String(row.module || '-');

    const keyword = search.trim().toLowerCase();

    const searchable = [
      row.actor_email,
      row.actor_name,
      row.action,
      row.module,
      row.description,
      row.entity_id,
      row.entity_type,
      JSON.stringify(row.details || {}),
      JSON.stringify(row.old || {}),
      JSON.stringify(row.new || {}),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch =
      !keyword || searchable.includes(keyword);

    const matchesAction =
      actionFilter === 'ALL' || action === actionFilter;

    const matchesModule =
      moduleFilter === 'ALL' || module === moduleFilter;

    return matchesSearch && matchesAction && matchesModule;
  });

  const modules = Array.from(
    new Set(
      rows
        .map((row) => String(row.module || '-'))
        .filter(Boolean)
    )
  );

  return (
    <>
      <Heading
        title="Log Audit"
        desc="Riwayat aktivitas dan perubahan data yang tercatat di database."
      />

      <div className="panel" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(220px, 1fr) 180px 180px auto',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari actor, action, module, ID..."
            style={{
              width: '100%',
              padding: '11px 13px',
              borderRadius: 10,
              border: '1px solid #d9dee8',
              outline: 'none',
            }}
          />

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              padding: '11px 13px',
              borderRadius: 10,
              border: '1px solid #d9dee8',
              background: '#fff',
            }}
          >
            <option value="ALL">Semua Aksi</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{
              padding: '11px 13px',
              borderRadius: 10,
              border: '1px solid #d9dee8',
              background: '#fff',
            }}
          >
            <option value="ALL">Semua Module</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>

          <div
            style={{
              fontSize: 13,
              color: '#667085',
              whiteSpace: 'nowrap',
            }}
          >
            {filteredRows.length} aktivitas
          </div>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('time')}</th>
                <th>{t('actor')}</th>
                <th>{t('actions')}</th>
                <th>{t('module')}</th>
                <th>{t('entity')}</th>
                <th>{t('change')}</th>
                <th style={{ textAlign: 'center' }}>Detail</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: 'center',
                      padding: 30,
                    }}
                  >
                    Memuat Log Audit...
                  </td>
                </tr>
              ) : filteredRows.length ? (
                filteredRows.map((row) => {
                  const changes = getChangedFields(row);

                  return (
                    <tr key={row.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(row.created_at)}
                      </td>

                      <td>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#101828',
                          }}
                        >
                          {row.actor_email ||
                            row.actor_name ||
                            '-'}
                        </div>
                      </td>

                      <td>
                        <span className={actionClass(row.action)}>
                          {actionLabel(row.action)}
                        </span>
                      </td>

                      <td>
                        {row.module || '-'}
                      </td>

                      <td>
                        <div>
                          <strong>
                            {row.entity_type || '-'}
                          </strong>
                        </div>

                        {row.entity_id && (
                          <small
                            style={{
                              color: '#667085',
                              wordBreak: 'break-all',
                            }}
                          >
                            {row.entity_id}
                          </small>
                        )}
                      </td>

                      <td>
                        {changes.length ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                          >
                            {changes
                              .slice(0, 3)
                              .map((change) => (
                                <div
                                  key={change.field}
                                  style={{
                                    fontSize: 12,
                                  }}
                                >
                                  <strong>
                                    {change.field}
                                  </strong>
                                  :{' '}
                                  <span
                                    style={{
                                      color: '#b42318',
                                    }}
                                  >
                                    {normalize(
                                      change.oldValue
                                    )}
                                  </span>
                                  {' → '}
                                  <span
                                    style={{
                                      color: '#027a48',
                                    }}
                                  >
                                    {normalize(
                                      change.newValue
                                    )}
                                  </span>
                                </div>
                              ))}

                            {changes.length > 3 && (
                              <small
                                style={{
                                  color: '#667085',
                                }}
                              >
                                +{changes.length - 3} perubahan
                                lainnya
                              </small>
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              color: '#98a2b3',
                            }}
                          >
                            Tidak ada perubahan field
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelected(row)}
                          style={{
                            border: '1px solid #d0d5dd',
                            background: '#fff',
                            borderRadius: 8,
                            padding: '7px 11px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <Empty cols={7} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(1000px, 100%)',
              maxHeight: '85vh',
              overflow: 'auto',
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,.2)',
              padding: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                  }}
                >
                  Audit Detail
                </h2>

                <div
                  style={{
                    marginTop: 5,
                    color: '#667085',
                    fontSize: 13,
                  }}
                >
                  {formatDate(selected.created_at)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{
                  border: 'none',
                  background: '#f2f4f7',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(4, minmax(0, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <small>Pelaku</small>
                <div style={{ fontWeight: 600 }}>
                  {selected.actor_email ||
                    selected.actor_name ||
                    '-'}
                </div>
              </div>

              <div>
                <small>Aksi</small>
                <div style={{ marginTop: 5 }}>
                  <span
                    className={actionClass(selected.action)}
                  >
                    {actionLabel(selected.action)}
                  </span>
                </div>
              </div>

              <div>
                <small>Module</small>
                <div style={{ fontWeight: 600 }}>
                  {selected.module || '-'}
                </div>
              </div>

              <div>
                <small>Entity</small>
                <div style={{ fontWeight: 600 }}>
                  {selected.entity_type || '-'}
                </div>
              </div>
            </div>

            <h3
              style={{
                margin: '0 0 12px',
                fontSize: 16,
              }}
            >
              Perubahan Data
            </h3>

            <div
              style={{
                border: '1px solid #eaecf0',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <table>
                <thead>
                  <tr>
                    <th>{t('field')}</th>
                    <th>{t('old_value')}</th>
                    <th>{t('new_value')}</th>
                  </tr>
                </thead>

                <tbody>
                  {getChangedFields(selected).length ? (
                    getChangedFields(selected).map(
                      (change) => (
                        <tr key={change.field}>
                          <td>
                            <strong>
                              {change.field}
                            </strong>
                          </td>

                          <td>
                            <span
                              style={{
                                color: '#b42318',
                                wordBreak: 'break-word',
                              }}
                            >
                              {normalize(
                                change.oldValue
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              style={{
                                color: '#027a48',
                                wordBreak: 'break-word',
                              }}
                            >
                              {normalize(
                                change.newValue
                              )}
                            </span>
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          textAlign: 'center',
                          padding: 20,
                        }}
                      >
                        Tidak ada perubahan field.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selected.details && (
              <details style={{ marginTop: 20 }}>
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Raw Details
                </summary>

                <pre
                  style={{
                    marginTop: 10,
                    background: '#101828',
                    color: '#f8fafc',
                    padding: 15,
                    borderRadius: 10,
                    overflow: 'auto',
                    fontSize: 12,
                  }}
                >
                  {JSON.stringify(
                    selected.details,
                    null,
                    2
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
    </>
  );
}
function Notifications(){const [rows,setRows]=useState<any[]>([]),[loading,setLoading]=useState(true);const load=async()=>{setLoading(true);const {data}=await supabase.from('hris_notifications').select('*').order('created_at',{ascending:false}).limit(100);setRows(data||[]);setLoading(false)};useEffect(()=>{load()},[]);const mark=async(id:string)=>{await supabase.from('hris_notifications').update({is_read:true}).eq('id',id);load()};return <><Heading title="Notifikasi" desc="Pusat pemberitahuan HRIS untuk approval, cuti, payroll, dan aktivitas penting."/><div className="panel table-panel"><div className="panel-head"><div><h2>Kotak Masuk HR</h2><p>{rows.filter(r=>!r.is_read).length} belum dibaca</p></div><button className="secondary" onClick={load}>Muat Ulang</button></div><div className="notification-list">{loading?<div className="loading">Memuat…</div>:rows.length?rows.map(r=><button key={r.id} className={`notification-item ${r.is_read?'read':''}`} onClick={()=>mark(r.id)}><span className="notification-dot"/><span><b>{r.title}</b><small>{r.message}</small><em>{r.created_at?.replace('T',' ').slice(0,19)}</em></span></button>):<div className="empty-module"><h3>Tidak ada notifikasi</h3><p>Notifikasi sistem akan muncul di sini.</p></div>}</div></div></>}
function SystemHealth(){const [h,setH]=useState<any>(null),[err,setErr]=useState('');const load=async()=>{const {data,error}=await supabase.from('hris_system_health').select('*').maybeSingle();if(error)setErr(error.message);else setH(data)};useEffect(()=>{load()},[]);const cards=[['active_employees','Karyawan Aktif'],['pending_leave','Cuti Menunggu'],['pending_overtime','Lembur Menunggu'],['pending_payroll','Payroll Menunggu'],['pending_approvals','Approval Menunggu'],['unread_notifications','Notifikasi Belum Dibaca']];return <><Heading title="Kesehatan Sistem" desc="Ringkasan kesehatan operasional HRIS dari database." action="Muat Ulang" onAction={load}/>{err&&<div className="alert">{err}</div>}<div className="mini-kpi-row">{cards.map(([k,l])=><div className="stat-card" key={k}><span>{l}</span><strong>{h?.[k]??'—'}</strong></div>)}</div><div className="panel"><h3>Status layanan</h3><p>Database: <b>{h?'Operasional':'Memeriksa…'}</b></p><p>Terakhir diperiksa: {h?.checked_at?.replace('T',' ').slice(0,19)||'—'}</p></div></>}

function SimpleModal({title,onClose,onSave,children}:{title:string;onClose:()=>void;onSave:(e:FormEvent)=>void;children:ReactNode}){return <div className="drawer-backdrop"><aside className="edit-drawer"><div className="drawer-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}>×</button></div><form className="drawer-body" onSubmit={onSave}>{children}<div className="drawer-foot"><button type="button" className="secondary" onClick={onClose}>Batal</button><button className="primary">Simpan</button></div></form></aside></div>}
function Status({value}:{value:string}){const v=value.toLowerCase();const cls=v.includes('non')||v.includes('tolak')||v.includes('sakit')?'red':v.includes('terlambat')||v.includes('draft')||v.includes('menunggu')?'orange':v.includes('izin')?'blue':'green';return <span className={`status ${cls}`}>{value}</span>}
function Empty({cols}:{cols:number}){return <tr><td colSpan={cols} className="empty-cell">Belum ada data.</td></tr>}
function fieldLabel(k:string){return ({id_karyawan:'ID Karyawan',nama:'Nama Lengkap',jabatan:'Jabatan',email:'Email',no_telp:'No. Telepon',departemen:'Departemen',tanggal_masuk:'Tanggal Masuk',gaji_pokok:'Gaji Pokok',periode:'Periode',indikator:'Indikator',target:'Target',realisasi:'Realisasi',bobot:'Bobot',skor:'Skor',jumlah_kebutuhan:'Jumlah Kebutuhan',tanggal_buka:'Tanggal Buka',tanggal_tutup:'Tanggal Tutup',deskripsi:'Deskripsi',posisi:'Posisi',sumber:'Sumber',tahap:'Tahap',catatan:'Catatan',nilai:'Nilai',kandidat:'Kandidat',jam:'Jam',interviewer:'Pewawancara',hasil:'Hasil',company_name:'Nama Perusahaan',work_start:'Jam Masuk',work_end:'Jam Pulang',break_minutes:'Istirahat (menit)',payday_day:'Hari Gajian',currency:'Mata Uang',timezone:'Timezone'})[k]||k}
