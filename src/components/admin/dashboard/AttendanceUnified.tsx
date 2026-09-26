import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useTranslation } from '../../../locales/LanguageContext';

type AttendanceRow = {
  id: string;
  id_karyawan: string;
  karyawan_id?: string | null;
  nama?: string | null;
  jabatan?: string | null;
  tanggal: string;
  jam_masuk?: string | null;
  jam_pulang?: string | null;
  total_jam?: string | null;
  status?: string | null;
  lokasi?: string | null;
  lokasi_masuk?: string | null;
  lokasi_pulang?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  akurasi_masuk?: number | null;
  akurasi_pulang?: number | null;
  selfie_masuk?: string | null;
  selfie_pulang?: string | null;
  sumber?: string | null;
  keterlambatan_menit?: number | null;
  lembur_menit?: number | null;
  keterangan?: string | null;
};

const statusText = (row: AttendanceRow) => String(row.status || '').trim() || 'Hadir';

const attendanceType = (row: AttendanceRow) => {
  const source = String(row.sumber || '').toLowerCase();
  if (source.includes('gps')) return 'GPS';
  if (row.selfie_masuk || row.selfie_pulang) return 'Selfie';
  return row.sumber || 'Manual';
};

export default function AttendanceUnified() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [department, setDepartment] = useState('');
  const [employee, setEmployee] = useState('');
  const [status, setStatus] = useState('');
  const [kind, setKind] = useState('');
  const [selected, setSelected] = useState<AttendanceRow | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('absensi')
      .select('*')
      .order('tanggal', { ascending: false })
      .order('jam_masuk', { ascending: false })
      .limit(1000);

    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data || []) as AttendanceRow[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const departments = useMemo(
    () => Array.from(new Set(rows.map(row => String(row.jabatan || '').trim()).filter(Boolean))).sort(),
    [rows]
  );

  const employees = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map(row => `${row.id_karyawan}|||${row.nama || ''}`)
            .filter(Boolean)
        )
      ).sort(),
    [rows]
  );

  const statuses = useMemo(
    () => Array.from(new Set(rows.map(statusText))).sort(),
    [rows]
  );

  const kinds = useMemo(
    () => Array.from(new Set(rows.map(attendanceType))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter(row => {
      if (dateFrom && row.tanggal < dateFrom) return false;
      if (dateTo && row.tanggal > dateTo) return false;
      if (department && String(row.jabatan || '') !== department) return false;
      if (employee && `${row.id_karyawan}|||${row.nama || ''}` !== employee) return false;
      if (status && statusText(row) !== status) return false;
      if (kind && attendanceType(row) !== kind) return false;
      return true;
    });
  }, [rows, dateFrom, dateTo, department, employee, status, kind]);

  const summary = useMemo(() => {
    const hadir = filtered.filter(row => {
      const s = statusText(row).toLowerCase();
      return s.includes('hadir');
    }).length;

    const terlambat = filtered.filter(
      row =>
        Number(row.keterlambatan_menit || 0) > 0 ||
        statusText(row).toLowerCase().includes('terlambat')
    ).length;

    const tidakHadir = filtered.filter(row =>
      ['tidak hadir', 'alpha', 'alpa', 'mangkir'].includes(statusText(row).toLowerCase())
    ).length;

    const cuti = filtered.filter(row =>
      statusText(row).toLowerCase().includes('cuti')
    ).length;

    const sakit = filtered.filter(row =>
      statusText(row).toLowerCase().includes('sakit')
    ).length;

    const lembur = filtered.filter(row => Number(row.lembur_menit || 0) > 0).length;

    return { total: filtered.length, hadir, terlambat, tidakHadir, cuti, sakit, lembur };
  }, [filtered]);

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setDepartment('');
    setEmployee('');
    setStatus('');
    setKind('');
  };

  return (
    <section>
      <div className="panel-head">
        <div>
          <h2>{t('attendance')}</h2>
          <p>{t('attendance_unified_desc')}</p>
        </div>
        <button type="button" className="secondary" onClick={load}>
          {t('reload')}
        </button>
      </div>

      <div className="attendance-summary-grid">
        <div className="stat-card"><span>{t('total')}</span><strong>{summary.total}</strong></div>
        <div className="stat-card"><span>{t('present')}</span><strong>{summary.hadir}</strong></div>
        <div className="stat-card"><span>{t('late')}</span><strong>{summary.terlambat}</strong></div>
        <div className="stat-card"><span>{t('absent')}</span><strong>{summary.tidakHadir}</strong></div>
        <div className="stat-card"><span>{t('leave')}</span><strong>{summary.cuti}</strong></div>
        <div className="stat-card"><span>{t('sick')}</span><strong>{summary.sakit}</strong></div>
        <div className="stat-card"><span>{t('overtime')}</span><strong>{summary.lembur}</strong></div>
      </div>

      <div className="panel table-panel">
        <div className="attendance-filter-grid">
          <label>
            {t('start_date')}
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </label>

          <label>
            {t('end_date')}
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </label>

          <label>
            {t('department')}
            <select value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">{t('all')}</option>
              {departments.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label>
            Karyawan
            <select value={employee} onChange={e => setEmployee(e.target.value)}>
              <option value="">{t('all')}</option>
              {employees.map(item => {
                const [id, name] = item.split('|||');
                return <option key={item} value={item}>{id} · {name || '-'}</option>;
              })}
            </select>
          </label>

          <label>
            Status
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">{t('all')}</option>
              {statuses.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <label>
            {t('attendance_type')}
            <select value={kind} onChange={e => setKind(e.target.value)}>
              <option value="">{t('all')}</option>
              {kinds.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <div className="attendance-filter-actions">
          <button type="button" className="secondary" onClick={resetFilters}>
            Reset Filter
          </button>
          <span>{filtered.length} record</span>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>ID/NIK</th>
                <th>{t('department')}</th>
                <th>Tanggal</th>
                <th>Jam Masuk</th>
                <th>Jam Pulang</th>
                <th>Status</th>
                <th>Keterlambatan</th>
                <th>Lembur</th>
                <th>Selfie</th>
                <th>GPS</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11}>Belum ada data absensi.</td>
                </tr>
              )}

              {filtered.map(row => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(row)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{row.nama || '-'}</td>
                  <td>{row.id_karyawan || '-'}</td>
                  <td>{row.jabatan || '-'}</td>
                  <td>{row.tanggal || '-'}</td>
                  <td>{row.jam_masuk || '-'}</td>
                  <td>{row.jam_pulang || '-'}</td>
                  <td>{statusText(row)}</td>
                  <td>{Number(row.keterlambatan_menit || 0)} mnt</td>
                  <td>{Number(row.lembur_menit || 0)} mnt</td>
                  <td>{row.selfie_masuk || row.selfie_pulang ? '✓' : '-'}</td>
                  <td>{row.latitude != null && row.longitude != null ? '✓' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <div>
                <h2>Detail Absensi</h2>
                <p>{selected.nama || selected.id_karyawan}</p>
              </div>
              <button type="button" className="secondary" onClick={() => setSelected(null)}>
                Tutup
              </button>
            </div>

            <div className="detail-grid">
              <div><strong>Nama</strong><span>{selected.nama || '-'}</span></div>
              <div><strong>ID Karyawan</strong><span>{selected.id_karyawan || '-'}</span></div>
              <div><strong>Tanggal</strong><span>{selected.tanggal || '-'}</span></div>
              <div><strong>Jam Masuk</strong><span>{selected.jam_masuk || '-'}</span></div>
              <div><strong>Jam Pulang</strong><span>{selected.jam_pulang || '-'}</span></div>
              <div><strong>Status</strong><span>{statusText(selected)}</span></div>
              <div><strong>Keterlambatan</strong><span>{Number(selected.keterlambatan_menit || 0)} menit</span></div>
              <div><strong>Lembur</strong><span>{Number(selected.lembur_menit || 0)} menit</span></div>
              <div><strong>Latitude</strong><span>{selected.latitude ?? '-'}</span></div>
              <div><strong>Longitude</strong><span>{selected.longitude ?? '-'}</span></div>
              <div><strong>Akurasi Masuk</strong><span>{selected.akurasi_masuk ?? '-'} m</span></div>
              <div><strong>Akurasi Pulang</strong><span>{selected.akurasi_pulang ?? '-'} m</span></div>
              <div><strong>Sumber</strong><span>{selected.sumber || '-'}</span></div>
              <div><strong>Keterangan</strong><span>{selected.keterangan || '-'}</span></div>
            </div>

            <div className="attendance-media-grid">
              {selected.selfie_masuk && (
                <div>
                  <strong>Selfie Masuk</strong>
                  <img src={selected.selfie_masuk} alt="Selfie masuk" />
                </div>
              )}
              {selected.selfie_pulang && (
                <div>
                  <strong>Selfie Pulang</strong>
                  <img src={selected.selfie_pulang} alt="Selfie pulang" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
