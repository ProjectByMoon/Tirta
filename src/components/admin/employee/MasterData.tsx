import { appAlert, appConfirm } from '../../../lib/app-dialog';
import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useTranslation } from '../../../locales/LanguageContext';
import AdminIcon from '../common/AdminIcon';

type Tab = 'cabang' | 'departemen' | 'jabatan' | 'shift' | 'jadwal';

type Cabang = {
  id: string;
  kode: string;
  nama: string;
  kota: string;
  alamat: string;
  status_aktif: boolean;
};

type Departemen = {
  id: string;
  nama: string;
  kode: string;
  kepala_departemen: string;
  status: string;
};

type Jabatan = {
  id: string;
  nama: string;
  kode: string;
  departemen: string;
  level_jabatan: string;
  status: string;
};

type Shift = {
  id: string;
  nama: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  istirahat_menit: number;
  toleransi_menit: number;
  status: string;
};

type Karyawan = {
  id: string;
  id_karyawan: string;
  nama: string;
};

type Jadwal = {
  id: string;
  id_karyawan: string;
  tanggal: string;
  shift_id: string | null;
  status: string;
  catatan: string | null;
};



const emptyCabang = {
  kode: '',
  nama: '',
  kota: '',
  alamat: '',
  status_aktif: true,
};

const emptyDepartemen = {
  nama: '',
  kode: '',
  kepala_departemen: '',
  status: 'Aktif',
};

const emptyJabatan = {
  nama: '',
  kode: '',
  departemen: '',
  level_jabatan: '',
  status: 'Aktif',
};

const emptyShift = {
  nama: '',
  jam_masuk: '07:00',
  jam_pulang: '16:00',
  istirahat_menit: 60,
  toleransi_menit: 10,
  status: 'Aktif',
};

const emptyJadwal = {
  id_karyawan: '',
  tanggal: new Date().toISOString().slice(0, 10),
  shift_id: '',
  status: 'Terjadwal',
  catatan: '',
};

export default function MasterData({
  initialTab = 'cabang',
}: {
  initialTab?: Tab;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>{t("master_data_hris")}</div>
          <h1 style={styles.title}>{t("branch")} & {t("operational")}</h1>
          <p style={styles.subtitle}>
            {t('master_data_desc')}
          </p>
        </div>
      </div>

      <div style={styles.tabs}>
        <TabButton
          active={tab === 'cabang'}
          icon="building"
          label={t("branch")}
          onClick={() => setTab('cabang')}
        />

        <TabButton
          active={tab === 'departemen'}
          icon="folder"
          label={t("department")}
          onClick={() => setTab('departemen')}
        />

        <TabButton
          active={tab === 'jabatan'}
          icon="target"
          label={t("position")}
          onClick={() => setTab('jabatan')}
        />

        <TabButton
          active={tab === 'shift'}
          icon="shift"
          label={t("shift")}
          onClick={() => setTab('shift')}
        />

        <TabButton
          active={tab === 'jadwal'}
          icon="calendar"
          label={t("work_schedule")}
          onClick={() => setTab('jadwal')}
        />
      </div>

      {tab === 'cabang' && <CabangModule />}
      {tab === 'departemen' && <DepartemenModule />}
      {tab === 'jabatan' && <JabatanModule />}
      {tab === 'shift' && <ShiftModule />}
      {tab === 'jadwal' && <JadwalModule />}
    </div>
  );
}

/* =========================================================
   TAB BUTTON
========================================================= */

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.tab,
        ...(active ? styles.tabActive : {}),
      }}
    >
      <span><AdminIcon name={icon} size={16} /></span>
      {label}
    </button>
  );
}

/* =========================================================
   CABANG
========================================================= */

function CabangModule() {
  const { t } = useTranslation();
  const [data, setData] = useState<Cabang[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Cabang | null>(null);
  const [form, setForm] = useState(emptyCabang);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('hris_cabang')
      .select('*')
      .order('nama');

    if (error) {
      await appAlert(`Gagal mengambil data cabang:\n${error.message}`);
      setData([]);
    } else {
      setData((data || []) as Cabang[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyCabang);
    setModal(true);
  };

  const openEdit = (item: Cabang) => {
    setEditing(item);

    setForm({
      kode: item.kode || '',
      nama: item.nama || '',
      kota: item.kota || '',
      alamat: item.alamat || '',
      status_aktif: item.status_aktif !== false,
    });

    setModal(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.nama.trim()) {
      await appAlert(t('branch_name_required'));
      return;
    }

    const payload = {
      kode: form.kode.trim() || null,
      nama: form.nama.trim(),
      kota: form.kota.trim() || null,
      alamat: form.alamat.trim() || null,
      status_aktif: form.status_aktif,
    };

    let error;

    if (editing) {
      ({ error } = await supabase
        .from('hris_cabang')
        .update(payload)
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase
        .from('hris_cabang')
        .insert(payload));
    }

    if (error) {
      await appAlert(`Gagal menyimpan cabang:\n${error.message}`);
      return;
    }

    setModal(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!await appConfirm('Hapus cabang ini?')) return;

    const { error } = await supabase
      .from('hris_cabang')
      .delete()
      .eq('id', id);

    if (error) {
      await appAlert(`Gagal menghapus:\n${error.message}`);
      return;
    }

    await load();
  };

  const filtered = data.filter((item) =>
    `${item.kode} ${item.nama} ${item.kota}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      <SectionHeader
        title={t("branch")}
        description={t("branch_description")}
        button="+ Tambah Cabang"
        onClick={openAdd}
      />

      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder={t("search_data")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <TableCard>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>{t("code")}</th>
              <th>{t("name")}</th>
              <th>{t("city")}</th>
              <th>{t("address")}</th>
              <th>{t("status")}</th>
              <th style={{ width: 150 }}>{t('actions')}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <EmptyRow text={t("loading_data")} colSpan={6} />
            ) : filtered.length === 0 ? (
              <EmptyRow text={t("no_branch_data")} colSpan={6} />
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.kode || '-'}</strong>
                  </td>

                  <td>{item.nama}</td>

                  <td>{item.kota || '-'}</td>

                  <td>{item.alamat || '-'}</td>

                  <td>
                    <StatusBadge active={item.status_aktif} />
                  </td>

                  <td>
                    <ActionButtons
                      onEdit={() => openEdit(item)}
                      onDelete={() => remove(item.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableCard>

      {modal && (
        <Modal
          title={editing ? `${t("edit")} ${t("branch")}` : `${t("add")} ${t("branch")}`}
          onClose={() => setModal(false)}
        >
          <form onSubmit={save}>
            <Input
              label={t("code")}
              value={form.kode}
              onChange={(v) => setForm({ ...form, kode: v })}
              placeholder={t("example_branch_code")}
            />

            <Input
              label={t("name")}
              value={form.nama}
              onChange={(v) => setForm({ ...form, nama: v })}
              placeholder={t("example_jakarta")}
              required
            />

            <Input
              label={t("city")}
              value={form.kota}
              onChange={(v) => setForm({ ...form, kota: v })}
              placeholder={t("example_jakarta")}
            />

            <Textarea
              label={t("address")}
              value={form.alamat}
              onChange={(v) => setForm({ ...form, alamat: v })}
              placeholder={t("branch_address_placeholder")}
            />

            <Checkbox
              label={t("active_status")}
              checked={form.status_aktif}
              onChange={(v) => setForm({ ...form, status_aktif: v })}
            />

            <FormActions onCancel={() => setModal(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

/* =========================================================
   DEPARTEMEN
========================================================= */

function DepartemenModule() {
  const { t } = useTranslation();
  const [data, setData] = useState<Departemen[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Departemen | null>(null);
  const [form, setForm] = useState(emptyDepartemen);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('hris_departemen')
      .select('*')
      .order('nama');

    if (error) {
      await appAlert(`Gagal mengambil departemen:\n${error.message}`);
      setData([]);
    } else {
      setData((data || []) as Departemen[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyDepartemen);
    setModal(true);
  };

  const openEdit = (item: Departemen) => {
    setEditing(item);

    setForm({
      nama: item.nama || '',
      kode: item.kode || '',
      kepala_departemen: item.kepala_departemen || '',
      status: item.status || 'Aktif',
    });

    setModal(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.nama.trim()) {
      await appAlert(t('department_name_required'));
      return;
    }

    const payload = {
      nama: form.nama.trim(),
      kode: form.kode.trim() || null,
      kepala_departemen: form.kepala_departemen.trim() || null,
      status: form.status,
    };

    let error;

    if (editing) {
      ({ error } = await supabase
        .from('hris_departemen')
        .update(payload)
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase
        .from('hris_departemen')
        .insert(payload));
    }

    if (error) {
      await appAlert(`Gagal menyimpan departemen:\n${error.message}`);
      return;
    }

    setModal(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!await appConfirm('Hapus departemen ini?')) return;

    const { error } = await supabase
      .from('hris_departemen')
      .delete()
      .eq('id', id);

    if (error) {
      await appAlert(`Gagal menghapus:\n${error.message}`);
      return;
    }

    await load();
  };

  const filtered = data.filter((item) =>
    `${item.kode} ${item.nama} ${item.kepala_departemen}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      <SectionHeader
        title={t("department")}
        description="{t('department_desc')}"
        button={`+ ${t("add")} ${t("department")}`}
        onClick={openAdd}
      />

      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder={t("search_data")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <TableCard>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>{t("code")}</th>
              <th>{t("department")}</th>
              <th>{t("department_head")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <EmptyRow text={t("loading_data")} colSpan={5} />
            ) : filtered.length === 0 ? (
              <EmptyRow text={t("no_department_data")} colSpan={5} />
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.kode || '-'}</strong>
                  </td>

                  <td>{item.nama}</td>

                  <td>{item.kepala_departemen || '-'}</td>

                  <td>
                    <StatusText value={item.status} />
                  </td>

                  <td>
                    <ActionButtons
                      onEdit={() => openEdit(item)}
                      onDelete={() => remove(item.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableCard>

      {modal && (
        <Modal
          title={editing ? `${t("edit")} ${t("department")}` : `${t("add")} ${t("department")}`}
          onClose={() => setModal(false)}
        >
          <form onSubmit={save}>
            <Input
              label={t("code")}
              value={form.kode}
              onChange={(v) => setForm({ ...form, kode: v })}
              placeholder={t("example_department_code")}
            />

            <Input
              label={t("name")}
              value={form.nama}
              onChange={(v) => setForm({ ...form, nama: v })}
              placeholder={t("example_department_name")}
              required
            />

            <Input
              label={t("department_head")}
              value={form.kepala_departemen}
              onChange={(v) =>
                setForm({ ...form, kepala_departemen: v })
              }
              placeholder={t("department_head_placeholder")}
            />

            <Select
              label={t("status")}
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={['Aktif', 'Nonaktif']}
            />

            <FormActions onCancel={() => setModal(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

/* =========================================================
   JABATAN
========================================================= */

function JabatanModule() {
  const { t } = useTranslation();
  const [data, setData] = useState<Jabatan[]>([]);
  const [departemen, setDepartemen] = useState<Departemen[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Jabatan | null>(null);
  const [form, setForm] = useState(emptyJabatan);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);

    const [jabatanResult, deptResult] = await Promise.all([
      supabase
        .from('hris_jabatan')
        .select('*')
        .order('nama'),

      supabase
        .from('hris_departemen')
        .select('*')
        .order('nama'),
    ]);

    if (jabatanResult.error) {
      await appAlert(`Gagal mengambil jabatan:\n${jabatanResult.error.message}`);
      setData([]);
    } else {
      setData((jabatanResult.data || []) as Jabatan[]);
    }

    if (!deptResult.error) {
      setDepartemen((deptResult.data || []) as Departemen[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyJabatan);
    setModal(true);
  };

  const openEdit = (item: Jabatan) => {
    setEditing(item);

    setForm({
      nama: item.nama || '',
      kode: item.kode || '',
      departemen: item.departemen || '',
      level_jabatan: item.level_jabatan || '',
      status: item.status || 'Aktif',
    });

    setModal(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.nama.trim()) {
      await appAlert(t('position_name_required'));
      return;
    }

    const payload = {
      nama: form.nama.trim(),
      kode: form.kode.trim() || null,
      departemen: form.departemen.trim() || null,
      level_jabatan: form.level_jabatan.trim() || null,
      status: form.status,
    };

    let error;

    if (editing) {
      ({ error } = await supabase
        .from('hris_jabatan')
        .update(payload)
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase
        .from('hris_jabatan')
        .insert(payload));
    }

    if (error) {
      await appAlert(`Gagal menyimpan jabatan:\n${error.message}`);
      return;
    }

    setModal(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!await appConfirm('Hapus jabatan ini?')) return;

    const { error } = await supabase
      .from('hris_jabatan')
      .delete()
      .eq('id', id);

    if (error) {
      await appAlert(`Gagal menghapus:\n${error.message}`);
      return;
    }

    await load();
  };

  const filtered = data.filter((item) =>
    `${item.kode} ${item.nama} ${item.departemen} ${item.level_jabatan}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      <SectionHeader
        title={t("position")}
        description="{t('position_desc')}"
        button={`+ ${t("add")} ${t("position")}`}
        onClick={openAdd}
      />

      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder={t("search_data")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <TableCard>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>{t("code")}</th>
              <th>{t("position")}</th>
              <th>{t("department")}</th>
              <th>{t("level")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <EmptyRow text={t("loading_data")} colSpan={6} />
            ) : filtered.length === 0 ? (
              <EmptyRow text={t("no_position_data")} colSpan={6} />
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.kode || '-'}</strong>
                  </td>

                  <td>{item.nama}</td>

                  <td>{item.departemen || '-'}</td>

                  <td>{item.level_jabatan || '-'}</td>

                  <td>
                    <StatusText value={item.status} />
                  </td>

                  <td>
                    <ActionButtons
                      onEdit={() => openEdit(item)}
                      onDelete={() => remove(item.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableCard>

      {modal && (
        <Modal
          title={editing ? `${t("edit")} ${t("position")}` : `${t("add")} ${t("position")}`}
          onClose={() => setModal(false)}
        >
          <form onSubmit={save}>
            <Input
              label={t("code")}
              value={form.kode}
              onChange={(v) => setForm({ ...form, kode: v })}
              placeholder={t("example_position_code")}
            />

            <Input
              label={t("name")}
              value={form.nama}
              onChange={(v) => setForm({ ...form, nama: v })}
              placeholder={t("example_position_name")}
              required
            />

            <Select
              label={t("department")}
              value={form.departemen}
              onChange={(v) => setForm({ ...form, departemen: v })}
              options={[
                '',
                ...departemen.map((item) => item.nama),
              ]}
            />

            <Input
              label={t("position")}
              value={form.level_jabatan}
              onChange={(v) =>
                setForm({ ...form, level_jabatan: v })
              }
              placeholder={t("position_level_placeholder")}
            />

            <Select
              label={t("status")}
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={['Aktif', 'Nonaktif']}
            />

            <FormActions onCancel={() => setModal(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

/* =========================================================
   SHIFT
========================================================= */

function ShiftModule() {
  const { t } = useTranslation();
  const [data, setData] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState(emptyShift);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('hris_shift')
      .select('*')
      .order('jam_masuk', { ascending: true });

    if (error) {
      await appAlert(`Gagal mengambil shift:\n${error.message}`);
      setData([]);
    } else {
      setData((data || []) as Shift[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyShift);
    setModal(true);
  };

  const openEdit = (item: Shift) => {
    setEditing(item);

    setForm({
      nama: item.nama || '',
      jam_masuk: item.jam_masuk
        ? String(item.jam_masuk).slice(0, 5)
        : '07:00',
      jam_pulang: item.jam_pulang
        ? String(item.jam_pulang).slice(0, 5)
        : '16:00',
      istirahat_menit: Number(item.istirahat_menit || 0),
      toleransi_menit: Number(item.toleransi_menit || 0),
      status: item.status || 'Aktif',
    });

    setModal(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.nama.trim()) {
      await appAlert(t('shift_name_required'));
      return;
    }

    const payload = {
      nama: form.nama.trim(),
      jam_masuk: form.jam_masuk || null,
      jam_pulang: form.jam_pulang || null,
      istirahat_menit: Number(form.istirahat_menit || 0),
      toleransi_menit: Number(form.toleransi_menit || 0),
      status: form.status,
    };

    let error;

    if (editing) {
      ({ error } = await supabase
        .from('hris_shift')
        .update(payload)
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase
        .from('hris_shift')
        .insert(payload));
    }

    if (error) {
      await appAlert(`Gagal menyimpan shift:\n${error.message}`);
      return;
    }

    setModal(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!await appConfirm('Hapus shift ini?')) return;

    const { error } = await supabase
      .from('hris_shift')
      .delete()
      .eq('id', id);

    if (error) {
      await appAlert(
        `Gagal menghapus shift.\n\n${error.message}\n\n`
        + 'Jika shift sudah digunakan pada jadwal, hapus atau pindahkan jadwal terlebih dahulu.'
      );
      return;
    }

    await load();
  };

  const filtered = data.filter((item) =>
    `${item.nama} ${item.jam_masuk} ${item.jam_pulang}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      <SectionHeader
        title={t("shift")}
        description="Atur jam kerja, istirahat, dan toleransi keterlambatan."
        button="+ Tambah Shift"
        onClick={openAdd}
      />

      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder={t("search_data")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={styles.shiftGrid}>
        {loading ? (
          <div style={styles.loadingBox}>{t('loading_shift')}</div>
        ) : filtered.length === 0 ? (
          <div style={styles.loadingBox}>{t('no_shift_data')}</div>
        ) : (
          filtered.map((item) => (
            <div style={styles.shiftCard} key={item.id}>
              <div style={styles.shiftTop}>
                <div>
                  <div style={styles.shiftName}>{item.nama}</div>
                  <StatusText value={item.status} />
                </div>

                <div style={styles.clockIcon}>S</div>
              </div>

              <div style={styles.timeBox}>
                <div>
                  <span style={styles.miniLabel}>{t('check_in')}</span>
                  <strong>{formatTime(item.jam_masuk)}</strong>
                </div>

                <div style={styles.arrow}>→</div>

                <div>
                  <span style={styles.miniLabel}>{t('check_out')}</span>
                  <strong>{formatTime(item.jam_pulang)}</strong>
                </div>
              </div>

              <div style={styles.shiftInfo}>
                <span>{t('break')}</span>
                <strong>{item.istirahat_menit || 0} menit</strong>
              </div>

              <div style={styles.shiftInfo}>
                <span>{t('tolerance')}</span>
                <strong>{item.toleransi_menit || 0} menit</strong>
              </div>

              <div style={styles.cardActions}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => openEdit(item)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  style={styles.deleteButton}
                  onClick={() => remove(item.id)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modal && (
        <Modal
          title={editing ? `${t("edit")} ${t("shift")}` : `${t("add")} ${t("shift")}`}
          onClose={() => setModal(false)}
        >
          <form onSubmit={save}>
            <Input
              label={t("name")}
              value={form.nama}
              onChange={(v) => setForm({ ...form, nama: v })}
              placeholder={t("example_shift_name")}
              required
            />

            <div style={styles.formRow}>
              <TimeInput
                label={t("start_date")}
                value={form.jam_masuk}
                onChange={(v) =>
                  setForm({ ...form, jam_masuk: v })
                }
              />

              <TimeInput
                label={t("end_date")}
                value={form.jam_pulang}
                onChange={(v) =>
                  setForm({ ...form, jam_pulang: v })
                }
              />
            </div>

            <div style={styles.formRow}>
              <NumberInput
                label={t("minutes")}
                value={form.istirahat_menit}
                onChange={(v) =>
                  setForm({
                    ...form,
                    istirahat_menit: Number(v),
                  })
                }
              />

              <NumberInput
                label={t("minutes")}
                value={form.toleransi_menit}
                onChange={(v) =>
                  setForm({
                    ...form,
                    toleransi_menit: Number(v),
                  })
                }
              />
            </div>

            <Select
              label={t("status")}
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={['Aktif', 'Nonaktif']}
            />

            <FormActions onCancel={() => setModal(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

/* =========================================================
   JADWAL
========================================================= */

function JadwalModule() {
  const { t } = useTranslation();
  const [data, setData] = useState<Jadwal[]>([]);
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Jadwal | null>(null);
  const [form, setForm] = useState(emptyJadwal);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const load = async () => {
    setLoading(true);

    const [jadwalResult, employeeResult, shiftResult] =
      await Promise.all([
        supabase
          .from('hris_jadwal')
          .select('*')
          .order('tanggal', { ascending: false })
          .limit(500),

        supabase
          .from('karyawan')
          .select('id,id_karyawan,nama')
          .order('nama'),

        supabase
          .from('hris_shift')
          .select('*')
          .eq('status', 'Aktif')
          .order('jam_masuk'),
      ]);

    if (jadwalResult.error) {
      await appAlert(`Gagal mengambil jadwal:\n${jadwalResult.error.message}`);
      setData([]);
    } else {
      setData((jadwalResult.data || []) as Jadwal[]);
    }

    if (employeeResult.error) {
      await appAlert(
        `Gagal mengambil karyawan:\n${employeeResult.error.message}`
      );
      setEmployees([]);
    } else {
      setEmployees((employeeResult.data || []) as Karyawan[]);
    }

    if (shiftResult.error) {
      await appAlert(`Gagal mengambil shift:\n${shiftResult.error.message}`);
      setShifts([]);
    } else {
      setShifts((shiftResult.data || []) as Shift[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);

    setForm({
      ...emptyJadwal,
      tanggal: dateFilter || new Date().toISOString().slice(0, 10),
      id_karyawan: employees[0]?.id_karyawan || '',
      shift_id: shifts[0]?.id || '',
    });

    setModal(true);
  };

  const openEdit = (item: Jadwal) => {
    setEditing(item);

    setForm({
      id_karyawan: item.id_karyawan || '',
      tanggal: item.tanggal || '',
      shift_id: item.shift_id || '',
      status: item.status || 'Terjadwal',
      catatan: item.catatan || '',
    });

    setModal(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.id_karyawan) {
      await appAlert(t('employee_required'));
      return;
    }

    if (!form.tanggal) {
      await appAlert(t('date_required'));
      return;
    }

    if (!form.shift_id) {
      await appAlert(t('shift_required'));
      return;
    }

    const payload = {
      id_karyawan: form.id_karyawan,
      tanggal: form.tanggal,
      shift_id: form.shift_id,
      status: form.status,
      catatan: form.catatan.trim() || null,
    };

    let error;

    if (editing) {
      ({ error } = await supabase
        .from('hris_jadwal')
        .update(payload)
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase
        .from('hris_jadwal')
        .insert(payload));
    }

    if (error) {
      if (
        error.message.toLowerCase().includes('duplicate') ||
        error.message.toLowerCase().includes('unique')
      ) {
        await appAlert(
          'Jadwal untuk karyawan tersebut pada tanggal itu sudah ada.'
        );
      } else {
        await appAlert(`Gagal menyimpan jadwal:\n${error.message}`);
      }

      return;
    }

    setModal(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!await appConfirm('Hapus jadwal ini?')) return;

    const { error } = await supabase
      .from('hris_jadwal')
      .delete()
      .eq('id', id);

    if (error) {
      await appAlert(`Gagal menghapus jadwal:\n${error.message}`);
      return;
    }

    await load();
  };

  const getEmployee = (idKaryawan: string) =>
    employees.find(
      (item) => item.id_karyawan === idKaryawan
    );

  const getShift = (shiftId: string | null) =>
    shifts.find((item) => item.id === shiftId);

  const filtered = data.filter((item) => {
    const employee = getEmployee(item.id_karyawan);
    const shift = getShift(item.shift_id);

    const text = [
      item.id_karyawan,
      employee?.nama,
      shift?.nama,
      item.status,
      item.catatan,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchSearch = text.includes(search.toLowerCase());

    const matchDate =
      !dateFilter || item.tanggal === dateFilter;

    return matchSearch && matchDate;
  });

  return (
    <>
      <SectionHeader
        title={t("work_schedule")}
        description="Atur jadwal kerja karyawan berdasarkan tanggal dan shift."
        button="+ Tambah Jadwal"
        onClick={openAdd}
      />

      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder={t("search_data")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          style={styles.dateFilter}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        {dateFilter && (
          <button
            type="button"
            style={styles.clearButton}
            onClick={() => setDateFilter('')}
          >
            Reset
          </button>
        )}
      </div>

      <TableCard>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>{t("date")}</th>
              <th>{t("employee")}</th>
              <th>{t("employee_id")}</th>
              <th>{t("shift")}</th>
              <th>{t("time")}</th>
              <th>{t("status")}</th>
              <th>{t("notes")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <EmptyRow text={t("loading_schedule")} colSpan={8} />
            ) : filtered.length === 0 ? (
              <EmptyRow
                text={t("no_schedule")}
                colSpan={8}
              />
            ) : (
              filtered.map((item) => {
                const employee = getEmployee(item.id_karyawan);
                const shift = getShift(item.shift_id);

                return (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {formatDate(item.tanggal)}
                      </strong>
                    </td>

                    <td>{employee?.nama || 'Karyawan tidak ditemukan'}</td>

                    <td>{item.id_karyawan}</td>

                    <td>{shift?.nama || '-'}</td>

                    <td>
                      {shift
                        ? `${formatTime(
                            shift.jam_masuk
                          )} - ${formatTime(
                            shift.jam_pulang
                          )}`
                        : '-'}
                    </td>

                    <td>
                      <StatusText value={item.status} />
                    </td>

                    <td>{item.catatan || '-'}</td>

                    <td>
                      <ActionButtons
                        onEdit={() => openEdit(item)}
                        onDelete={() => remove(item.id)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableCard>

      {modal && (
        <Modal
          title={editing ? `${t("edit")} ${t("work_schedule")}` : `${t("add")} ${t("work_schedule")}`}
          onClose={() => setModal(false)}
        >
          <form onSubmit={save}>
            <SelectWithLabels
              label={t("employee")}
              value={form.id_karyawan}
              onChange={(v) =>
                setForm({ ...form, id_karyawan: v })
              }
              options={employees.map((item) => ({
                value: item.id_karyawan,
                label: `${item.id_karyawan} — ${item.nama}`,
              }))}
              emptyLabel={t("select_employee")}
            />

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>{t("date")}</label>

                <input
                  type="date"
                  style={styles.input}
                  value={form.tanggal}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tanggal: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div style={{ flex: 1 }}>
                <Select
                  label={t("shift")}
                  value={form.shift_id}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      shift_id: v,
                    })
                  }
                  options={shifts.map((item) => item.id)}
                  labels={Object.fromEntries(
                    shifts.map((item) => [
                      item.id,
                      `${item.nama} (${formatTime(
                        item.jam_masuk
                      )}-${formatTime(item.jam_pulang)})`,
                    ])
                  )}
                />
              </div>
            </div>

            <Select
              label={t("status")}
              value={form.status}
              onChange={(v) =>
                setForm({
                  ...form,
                  status: v,
                })
              }
              options={[
                'Terjadwal',
                'Hadir',
                'Libur',
                'Cuti',
                'Sakit',
                'Izin',
                'Tidak Hadir',
              ]}
            />

            <Textarea
              label={t("notes")}
              value={form.catatan}
              onChange={(v) =>
                setForm({
                  ...form,
                  catatan: v,
                })
              }
              placeholder={t("schedule_note_placeholder")}
            />

            <FormActions onCancel={() => setModal(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function SectionHeader({
  title,
  description,
  button,
  onClick,
}: {
  title: string;
  description: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div style={styles.sectionHeader}>
      <div>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <p style={styles.sectionDescription}>{description}</p>
      </div>

      <button
        type="button"
        style={styles.primaryButton}
        onClick={onClick}
      >
        {button}
      </button>
    </div>
  );
}

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.tableCard}>{children}</div>
  );
}

function EmptyRow({
  text,
  colSpan,
}: {
  text: string;
  colSpan: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={styles.emptyCell}
      >
        {text}
      </td>
    </tr>
  );
}

function ActionButtons({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={styles.actionGroup}>
      <button
        type="button"
        style={styles.editButton}
        onClick={onEdit}
      >
        Edit
      </button>

      <button
        type="button"
        style={styles.deleteButton}
        onClick={onDelete}
      >
        Hapus
      </button>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        ...styles.statusBadge,
        ...(active
          ? styles.statusActive
          : styles.statusInactive),
      }}
    >
      {active ? 'Aktif' : 'Nonaktif'}
    </span>
  );
}

function StatusText({ value }: { value: string }) {
  const active = value === 'Aktif' || value === 'Terjadwal';

  return (
    <span
      style={{
        ...styles.statusBadge,
        ...(active
          ? styles.statusActive
          : styles.statusInactive),
      }}
    >
      {value || '-'}
    </span>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>

      <input
        style={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={styles.label}>{label}</label>

      <input
        type="time"
        style={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label style={styles.label}>{label}</label>

      <input
        type="number"
        min="0"
        style={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>

      <textarea
        style={{
          ...styles.input,
          minHeight: 90,
          resize: 'vertical',
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>

      <select
        style={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {(labels?.[option] ?? option) || 'Pilih'}
          </option>
        ))}
      </select>
    </div>
  );
}

function SelectWithLabels({
  label,
  value,
  onChange,
  options,
  emptyLabel = 'Pilih karyawan...',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
  emptyLabel?: string;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>

      <select
        style={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">{emptyLabel}</option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={styles.checkbox}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />

      <span>{label}</span>
    </label>
  );
}

function FormActions({
  onCancel,
}: {
  onCancel: () => void;
}) {
  return (
    <div style={styles.formActions}>
      <button
        type="button"
        style={styles.cancelButton}
        onClick={onCancel}
      >
        Batal
      </button>

      <button
        type="submit"
        style={styles.primaryButton}
      >
        Simpan
      </button>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{title}</h3>

          <button
            type="button"
            style={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatTime(value: string | null) {
  if (!value) return '--:--';

  return String(value).slice(0, 5);
}

function formatDate(value: string) {
  if (!value) return '-';

  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* =========================================================
   STYLES
========================================================= */

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    padding: '24px',
    width: '100%',
    boxSizing: 'border-box',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },

  eyebrow: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '1.5px',
    color: '#64748b',
    marginBottom: '6px',
  },

  title: {
    margin: 0,
    fontSize: '30px',
    lineHeight: 1.2,
    fontWeight: 800,
    color: '#0f172a',
  },

  subtitle: {
    margin: '8px 0 0',
    color: '#64748b',
    fontSize: '14px',
  },

  tabs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '24px',
    padding: '6px',
    background: '#f1f5f9',
    borderRadius: '14px',
  },

  tab: {
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    padding: '11px 16px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  tabActive: {
    background: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 2px 8px rgba(15,23,42,.08)',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '18px',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '21px',
    fontWeight: 800,
    color: '#0f172a',
  },

  sectionDescription: {
    margin: '5px 0 0',
    color: '#64748b',
    fontSize: '13px',
  },

  primaryButton: {
    border: 'none',
    borderRadius: '10px',
    padding: '11px 16px',
    background: '#0f172a',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '13px',
  },

  secondaryButton: {
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 12px',
    background: '#ffffff',
    color: '#334155',
    fontWeight: 700,
    cursor: 'pointer',
  },

  deleteButton: {
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '8px 12px',
    background: '#fff7f7',
    color: '#dc2626',
    fontWeight: 700,
    cursor: 'pointer',
  },

  editButton: {
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 12px',
    background: '#ffffff',
    color: '#2563eb',
    fontWeight: 700,
    cursor: 'pointer',
  },

  cancelButton: {
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '11px 16px',
    background: '#ffffff',
    color: '#475569',
    fontWeight: 700,
    cursor: 'pointer',
  },

  toolbar: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },

  search: {
    flex: 1,
    minWidth: '240px',
    border: '1px solid #dbe2ea',
    borderRadius: '10px',
    padding: '11px 13px',
    outline: 'none',
    fontSize: '13px',
    boxSizing: 'border-box',
  },

  dateFilter: {
    border: '1px solid #dbe2ea',
    borderRadius: '10px',
    padding: '11px 13px',
    fontSize: '13px',
  },

  clearButton: {
    border: '1px solid #dbe2ea',
    borderRadius: '10px',
    padding: '10px 13px',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
    color: '#475569',
  },

  tableCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    overflow: 'auto',
    boxShadow: '0 4px 16px rgba(15,23,42,.04)',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },

  emptyCell: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#94a3b8',
  },

  actionGroup: {
    display: 'flex',
    gap: '6px',
    whiteSpace: 'nowrap',
  },

  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 9px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 800,
  },

  statusActive: {
    background: '#dcfce7',
    color: '#15803d',
  },

  statusInactive: {
    background: '#f1f5f9',
    color: '#64748b',
  },

  shiftGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },

  shiftCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 4px 16px rgba(15,23,42,.04)',
  },

  shiftTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },

  shiftName: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: '8px',
  },

  clockIcon: {
    fontSize: '25px',
  },

  timeBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px',
    borderRadius: '12px',
    background: '#f8fafc',
    marginBottom: '12px',
  },

  timeBoxStrong: {
    fontWeight: 800,
  },

  miniLabel: {
    display: 'block',
    color: '#94a3b8',
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '.7px',
    marginBottom: '4px',
  },

  arrow: {
    color: '#94a3b8',
    fontWeight: 800,
  },

  shiftInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '12px',
    color: '#64748b',
  },

  cardActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '14px',
  },

  loadingBox: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '50px',
    textAlign: 'center',
    color: '#64748b',
  },

  field: {
    marginBottom: '15px',
  },

  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 800,
    color: '#334155',
    marginBottom: '6px',
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #dbe2ea',
    borderRadius: '9px',
    padding: '10px 12px',
    outline: 'none',
    fontSize: '13px',
    background: '#ffffff',
    color: '#0f172a',
  },

  formRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '15px',
  },

  checkbox: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '18px',
    fontSize: '13px',
    color: '#334155',
    fontWeight: 600,
  },

  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    paddingTop: '12px',
    marginTop: '8px',
    borderTop: '1px solid #e2e8f0',
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 9999,
  },

  modal: {
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflow: 'auto',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 25px 60px rgba(15,23,42,.25)',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 20px',
    borderBottom: '1px solid #e2e8f0',
  },

  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 800,
    color: '#0f172a',
  },

  closeButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '8px',
    background: '#f1f5f9',
    color: '#475569',
    fontSize: '22px',
    cursor: 'pointer',
  },

  modalBody: {
    padding: '20px',
  },
};
