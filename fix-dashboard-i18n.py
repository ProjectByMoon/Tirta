from pathlib import Path

p = Path("src/components/admin/dashboard/DashboardAdmin.tsx")
s = p.read_text()

replacements = {
    ">Tambah Karyawan<": ">{t('employees.add')}<",
    ">Total Karyawan<": ">{t('employees.total')}<",
    ">Kehadiran Hari Ini<": ">{t('attendance.today')}<",
    ">Payroll Workforce<": ">{t('payroll.workforce')}<",
    ">Data Absensi<": ">{t('attendance.data')}<",
    ">Komposisi Workforce<": ">{t('workforce.composition')}<",
    ">Status Kehadiran<": ">{t('attendance.status')}<",
    ">Belum ada data workforce<": ">{t('workforce.noData')}<",
    ">Status sistem<": ">{t('system.status')}<",
    ">Data terhubung ke database<": ">{t('system.databaseConnected')}<",
    ">Ganti Foto<": ">{t('profile.changePhoto')}<",
    ">Batal<": ">{t('common.cancel')}<",
    ">Simpan<": ">{t('common.save')}<",
    ">Nama<": ">{t('employee.name')}<",
    ">Email<": ">{t('common.email')}<",
    ">Role<": ">{t('common.role')}<",
}

changed = 0

for old, new in replacements.items():
    count = s.count(old)
    if count:
        s = s.replace(old, new)
        changed += count

p.write_text(s)

print(f"Berhasil mengubah {changed} teks UI.")
print("Backup asli tersimpan di:")
print("src/components/admin/dashboard/DashboardAdmin.tsx.bak")
