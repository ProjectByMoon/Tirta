import { useEffect, useState } from 'react';
import { useTranslation } from '../../../locales/LanguageContext';
import { supabase } from '../../../lib/supabase/client';

type EmployeeBPJS = {
  id: string;
  id_karyawan: string;
  nama: string;
  departemen?: string;
  jabatan?: string;
  nomor_bpjs_kesehatan?: string;
  nomor_bpjs_ketenagakerjaan?: string;
  bpjs_kesehatan?: string;
  bpjs_ketenagakerjaan?: string;
};

export default function BPJSModule() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<EmployeeBPJS[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({ bpjs_kes: '', bpjs_ket: '' });

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('karyawan')
      .select('id, id_karyawan, nama, departemen, jabatan, nomor_bpjs_kesehatan, nomor_bpjs_ketenagakerjaan, bpjs_kesehatan, bpjs_ketenagakerjaan')
      .order('nama', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEdit = (emp: EmployeeBPJS) => {
    setEditingId(emp.id);
    setFormValues({
      bpjs_kes: emp.nomor_bpjs_kesehatan || emp.bpjs_kesehatan || '',
      bpjs_ket: emp.nomor_bpjs_ketenagakerjaan || emp.bpjs_ketenagakerjaan || '',
    });
  };

  const handleSave = async (id: string) => {
    setError('');
    setNotice('');

    const { error: updateError } = await supabase
      .from('karyawan')
      .update({
        nomor_bpjs_kesehatan: formValues.bpjs_kes,
        nomor_bpjs_ketenagakerjaan: formValues.bpjs_ket,
      })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setNotice('Nomor BPJS berhasil diperbarui.');
      setEditingId(null);
      fetchEmployees();
    }
  };

  const filtered = employees.filter(e =>
    `${e.nama} ${e.id_karyawan} ${e.departemen || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalKes = employees.filter(e => (e.nomor_bpjs_kesehatan || e.bpjs_kesehatan)).length;
  const totalKet = employees.filter(e => (e.nomor_bpjs_ketenagakerjaan || e.bpjs_ketenagakerjaan)).length;

  return (
    <div className="panel" style={{ padding: '24px' }}>
      <div className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>{t('bpjs_compliance_title')}</h2>
          <p style={{ color: '#667085', fontSize: '13px' }}>{t('bpjs_compliance_desc')}</p>
        </div>
      </div>

      {/* Ringkasan Statistik BPJS */}
      <div className="mini-kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div className="stat-card" style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #d8dee8' }}>
          <span style={{ fontSize: '12px', color: '#667085' }}>{t('total_employees')}</span>
          <strong style={{ fontSize: '22px', display: 'block', marginTop: '4px' }}>{employees.length}</strong>
        </div>
        <div className="stat-card" style={{ padding: '16px', background: '#ecfdf3', borderRadius: '12px', border: '1px solid #abefc6' }}>
          <span style={{ fontSize: '12px', color: '#087443' }}>{t('bpjs_health_registered')}</span>
          <strong style={{ fontSize: '22px', display: 'block', marginTop: '4px', color: '#087443' }}>{totalKes} / {employees.length}</strong>
        </div>
        <div className="stat-card" style={{ padding: '16px', background: '#eff8ff', borderRadius: '12px', border: '1px solid #b2ddff' }}>
          <span style={{ fontSize: '12px', color: '#175cd3' }}>{t('bpjs_work_registered')}</span>
          <strong style={{ fontSize: '22px', display: 'block', marginTop: '4px', color: '#175cd3' }}>{totalKet} / {employees.length}</strong>
        </div>
      </div>

      {notice && <div style={{ padding: '10px 14px', background: '#ecfdf3', color: '#087443', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>{notice}</div>}
      {error && <div style={{ padding: '10px 14px', background: '#fef3f2', color: '#b42318', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>{error}</div>}

      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder={t("search_employee_id_department")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: '380px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d8dee8', fontSize: '13px' }}
        />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '30px', color: '#667085' }}>{t('loading_bpjs')}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #d8dee8', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>{t('employee')}</th>
                <th style={{ padding: '12px' }}>{t('department_position')}</th>
                <th style={{ padding: '12px' }}>{t('bpjs_health_number')}</th>
                <th style={{ padding: '12px' }}>{t('bpjs_work_number')}</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => {
                const isEditing = editingId === emp.id;
                const noKes = emp.nomor_bpjs_kesehatan || emp.bpjs_kesehatan;
                const noKet = emp.nomor_bpjs_ketenagakerjaan || emp.bpjs_ketenagakerjaan;

                return (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #eef1f5' }}>
                    <td style={{ padding: '12px' }}>
                      <b>{emp.nama}</b>
                      <small style={{ display: 'block', color: '#667085' }}>{emp.id_karyawan}</small>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span>{emp.departemen || '-'}</span>
                      <small style={{ display: 'block', color: '#667085' }}>{emp.jabatan || '-'}</small>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formValues.bpjs_kes}
                          onChange={e => setFormValues({ ...formValues, bpjs_kes: e.target.value })}
                          placeholder={t("bpjs_health_number")}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d8dee8', width: '100%' }}
                        />
                      ) : (
                        <span style={{ color: noKes ? '#172033' : '#98a2b3' }}>{noKes || 'Belum diisi'}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formValues.bpjs_ket}
                          onChange={e => setFormValues({ ...formValues, bpjs_ket: e.target.value })}
                          placeholder={t("bpjs_work_number")}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d8dee8', width: '100%' }}
                        />
                      ) : (
                        <span style={{ color: noKet ? '#172033' : '#98a2b3' }}>{noKet || 'Belum diisi'}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleSave(emp.id)} className="primary" style={{ padding: '6px 12px', fontSize: '11px' }}>{t("save")}</button>
                          <button onClick={() => setEditingId(null)} style={{ padding: '6px 12px', fontSize: '11px', background: '#eef2f7', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{t("cancel")}</button>
                        </div>
                      ) : (
                        <button onClick={() => handleEdit(emp)} style={{ padding: '6px 12px', fontSize: '11px', background: '#f8fafc', border: '1px solid #d8dee8', borderRadius: '6px', cursor: 'pointer' }}>{t("edit_bpjs")}</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#667085' }}>{t('no_employees_found')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
