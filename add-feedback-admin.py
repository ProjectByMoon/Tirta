from pathlib import Path

p = Path("src/components/admin/dashboard/DashboardAdmin.tsx")
s = p.read_text()

# 1. Tambahkan MenuKey feedback
old = """| 'reports' | 'settings' | 'roles' | 'audit' | 'notifications' | 'system-health'"""
new = """| 'reports' | 'settings' | 'roles' | 'audit' | 'notifications' | 'feedback' | 'system-health'"""
if old in s and "'feedback'" not in s[s.find("type MenuKey"):s.find("const isoToday")]:
    s = s.replace(old, new, 1)

# 2. Feedback masuk grup SYSTEM
old = """['notifications', t('notifications'), 'bell'] as [MenuKey, string, string],
        ['system-health', t('system_health'), 'health'] as [MenuKey, string, string],"""
new = """['notifications', t('notifications'), 'bell'] as [MenuKey, string, string],
        ['feedback', 'Kotak Saran', 'request'] as [MenuKey, string, string],
        ['system-health', t('system_health'), 'health'] as [MenuKey, string, string],"""
if old in s and "['feedback', 'Kotak Saran'" not in s:
    s = s.replace(old, new, 1)

# 3. menuGroup feedback = system
old = """key === 'notifications' ? 'notifications' :
                            key === 'system-health' ? 'system' :"""
new = """key === 'notifications' ? 'notifications' :
                            key === 'feedback' ? 'system' :
                            key === 'system-health' ? 'system' :"""
if old in s and "key === 'feedback' ? 'system'" not in s:
    s = s.replace(old, new, 1)

# 4. Izinkan Super Admin/Admin/HRD melihat menu feedback
old = """const menuPermissionForRole = (key: MenuKey, role: string, dbPerms: string[] = []) => {
  if (role === 'Super Admin' || requiredPermission(key) === '' || dbPerms.includes('*')) return true;"""
new = """const menuPermissionForRole = (key: MenuKey, role: string, dbPerms: string[] = []) => {
  if (key === 'feedback') return ['Super Admin', 'Admin', 'HRD'].includes(role);
  if (role === 'Super Admin' || requiredPermission(key) === '' || dbPerms.includes('*')) return true;"""
if old in s and "if (key === 'feedback') return" not in s:
    s = s.replace(old, new, 1)

# 5. Tambahkan komponen FeedbackAdmin sebelum DashboardAdmin
marker = "export default function DashboardAdmin() {"

component = r'''
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
      alert(`Gagal menyimpan: ${error.message}`);
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
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="card">
        <div className="card-title">
          <div>
            <span className="card-kicker">KOTAK SARAN</span>
            <h2>Masukan Karyawan</h2>
          </div>
          <button
            type="button"
            className="portal-secondary"
            onClick={loadFeedback}
            disabled={loading}
          >
            {loading ? 'Memuat...' : 'Refresh'}
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
            placeholder="Cari karyawan, judul, atau isi..."
          />

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option>Semua</option>
            <option>Baru</option>
            <option>Diproses</option>
            <option>Selesai</option>
          </select>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option>Semua</option>
            <option>Saran</option>
            <option>Keluhan</option>
            <option>Masukan</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Memuat kotak saran...</div>
        ) : filtered.length === 0 ? (
          <div className="muted">Belum ada masukan yang sesuai filter.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Kategori</th>
                  <th>Judul</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
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
        <div className="card">
          <div className="card-title">
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
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--panel-soft, rgba(127,127,127,.08))',
              marginBottom: 16,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6
            }}
          >
            {selected.isi}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <label>
              <strong>Status</strong>
              <select
                value={selected.status}
                onChange={e =>
                  setSelected({
                    ...selected,
                    status: e.target.value as FeedbackAdminRow['status']
                  })
                }
              >
                <option>Baru</option>
                <option>Diproses</option>
                <option>Selesai</option>
              </select>
            </label>

            <label>
              <strong>Tanggapan HR</strong>
              <textarea
                rows={5}
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Tulis tanggapan untuk karyawan..."
                maxLength={5000}
              />
            </label>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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

'''

if marker in s and "function FeedbackAdmin({ employees }: { employees: Karyawan[] })" not in s:
    s = s.replace(marker, component + marker, 1)

# 6. Render halaman feedback
old = """{menu==='notifications'&&<Notifications/>} {menu==='system-health'&&<SystemHealth/>}"""
new = """{menu==='notifications'&&<Notifications/>}
{menu==='feedback'&&<FeedbackAdmin employees={employees}/>}
{menu==='system-health'&&<SystemHealth/>}"""
if old in s and "{menu==='feedback'&&<FeedbackAdmin" not in s:
    s = s.replace(old, new, 1)

p.write_text(s)
print("DashboardAdmin.tsx berhasil diperbarui.")
