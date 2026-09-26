import React, { useState } from 'react';
import moonLogo from '../../../assets/moon-logo.svg';
import { supabase } from '../../../lib/supabase/client';
import { useTranslation } from '../../../locales/LanguageContext';
import '../../../styles/employee/registration.css';

interface RegistrasiKaryawanProps {
  onBack?: () => void;
}

export default function RegistrasiKaryawan({ onBack }: RegistrasiKaryawanProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    nik_ktp: '',
    id_karyawan: '',
    nama: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    alamat_rumah: '',
    no_telp: '',
    email: '',
    status_pernikahan: '',
    nama_ibu_kandung: '',
    departemen: '',
    jabatan: '',
    status_karyawan: '',
    tanggal_masuk: '',
    gaji_pokok: '',
    bank_name: '',
    bank_account: '',
    password: '',
    konfirmasi: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    if (!file.type.startsWith('image/')) {
      setError('file_photo_error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('file_photo_size_error');
      return;
    }

    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nik = form.nik_ktp.trim();
    const idKaryawan = form.id_karyawan.trim();
    const nama = form.nama.trim();
    const email = form.email.trim();

    if (!nik) {
      setError('nik_required');
      return;
    }

    if (!/^[0-9]{16}$/.test(nik)) {
      setError('nik_16_digits');
      return;
    }

    if (
      idKaryawan &&
      !/^[A-Za-z0-9][A-Za-z0-9._-]{2,31}$/.test(idKaryawan)
    ) {
      setError('employee_id_format_error');
      return;
    }

    if (!nama) {
      setError('full_name_required');
      return;
    }

    if (!form.tempat_lahir.trim()) {
      setError('birth_place_required');
      return;
    }

    if (!form.tanggal_lahir) {
      setError('birth_date_required');
      return;
    }

    if (!form.jenis_kelamin) {
      setError('gender_required');
      return;
    }

    if (!form.alamat_rumah.trim()) {
      setError('address_required');
      return;
    }

    if (!form.no_telp.trim()) {
      setError('phone_required');
      return;
    }

    if (!/^[0-9+\-\s()]{8,20}$/.test(form.no_telp.trim())) {
      setError('phone_invalid');
      return;
    }

    if (!email) {
      setError('email_required');
      return;
    }

    if (!form.status_pernikahan) {
      setError('marital_required');
      return;
    }

    if (!form.nama_ibu_kandung.trim()) {
      setError('mother_name_required');
      return;
    }

    if (!form.departemen.trim()) {
      setError('department_required');
      return;
    }

    if (!form.jabatan.trim()) {
      setError('position_required');
      return;
    }

    if (!form.status_karyawan) {
      setError('employee_status_required');
      return;
    }

    if (!form.tanggal_masuk) {
      setError('join_date_required');
      return;
    }

    if (!form.gaji_pokok.trim()) {
      setError('basic_salary_required');
      return;
    }

    const gaji = Number(form.gaji_pokok.replace(/[^0-9]/g, ''));

    if (!Number.isFinite(gaji) || gaji < 0) {
      setError('basic_salary_invalid');
      return;
    }

    if (form.password.length < 6) {
      setError('password_min_error');
      return;
    }

    if (form.password !== form.konfirmasi) {
      setError('password_mismatch');
      return;
    }

    setLoading(true);

    let uploadedPhotoPath = '';

    try {

      // Registration photo is intentionally uploaded before sign-up so it also works
      // when email confirmation is enabled and Supabase returns no session. The
      // storage policy restricts anonymous writes to the registration/ prefix only.
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeUuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        uploadedPhotoPath = `registration/${safeUuid}.${fileExt}`;
        const { data: signedUpload, error: signedUploadError } =
          await supabase.storage
            .from('profile-photos')
            .createSignedUploadUrl(uploadedPhotoPath, { upsert: false });

        if (signedUploadError) throw signedUploadError;

        const { error: uploadError } =
          await supabase.storage
            .from('profile-photos')
            .uploadToSignedUrl(
              uploadedPhotoPath,
              signedUpload.token,
              photoFile
            );

        if (uploadError) throw uploadError;
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            nik_ktp: nik,
            id_karyawan: idKaryawan ? idKaryawan.toUpperCase() : null,
            nama,
            tempat_lahir: form.tempat_lahir.trim(),
            tanggal_lahir: form.tanggal_lahir || null,
            jenis_kelamin: form.jenis_kelamin,
            alamat_rumah: form.alamat_rumah.trim(),
            no_telp: form.no_telp.trim(),
            status_pernikahan: form.status_pernikahan,
            nama_ibu_kandung: form.nama_ibu_kandung.trim(),
            departemen: form.departemen.trim(),
            jabatan: form.jabatan.trim(),
            status_karyawan: form.status_karyawan,
            tanggal_masuk: form.tanggal_masuk,
            gaji_pokok: String(gaji),
            bank_name: form.bank_name.trim(),
            bank_account: form.bank_account.trim(),
            foto_url: uploadedPhotoPath || null,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Supabase can intentionally return an obfuscated successful response when
      // an account already exists. A missing user means no Auth INSERT occurred,
      // therefore the employee trigger and HR notification cannot run.
      if (!signUpData?.user) {
        throw new Error('email_already_or_other');
      }

      // The auth trigger copies foto_url from raw_user_meta_data into karyawan,
      // so the stored registration photo remains available to HR for review.
      setSuccess(true);
    } catch (err: any) {
      if (uploadedPhotoPath) {
        await supabase.storage.from('profile-photos').remove([uploadedPhotoPath]).catch(() => undefined);
      }
      setError(
        err?.message ||
          'generic_registration_error'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="registration-page">
        <div className="registration-success">
          <div className="registration-logo">
            <img src={moonLogo} alt="Project by Tirta" />
          </div>

          <h1>{t('registration_success_title')}</h1>

          <p>{t('registration_success_desc')}</p>

          <div className="registration-success-box">
            <strong>{t('registration_pending')}</strong>
            <span>{t('registration_pending_desc')}</span>
          </div>

          <button
            type="button"
            className="registration-button"
            onClick={onBack}
          >
            {t('back_to_login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-shell">

        <div className="registration-brand">
          <div className="registration-logo">
            <img
              src="/sakura-moon.jpg"
              alt="Project by Tirta"
            />
          </div>

          <div>
            <strong>Project by Tirta</strong>
            <span>{t('platform_employee')}</span>
          </div>
        </div>

        <div className="registration-card">

          <div className="registration-heading">
            <span className="registration-eyebrow">
              {t('registration_kicker')}
            </span>

            <h1>{t('registration_title')}</h1>

            <p>{t('registration_desc')}</p>
          </div>

          {error && (
            <div className="registration-error">
              {t(error)}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* FOTO */}
            <div className="registration-section">
              <h3>{t('profile_photo_id_card')}</h3>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  marginBottom: '15px',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--app-surface-alt)',
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                    border: '1px solid var(--app-border)',
                    flexShrink: 0,
                  }}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={t('preview')}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: '20px',
                        color: 'var(--app-muted)',
                      }}
                    >
                      📷
                    </span>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    id="photo-upload"
                    style={{ display: 'none' }}
                  />

                  <label
                    htmlFor="photo-upload"
                    className="registration-button"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'inline-block',
                    }}
                  >
                    {t('choose_photo')}
                  </label>

                  <small
                    style={{
                      display: 'block',
                      color: 'var(--app-muted)',
                      marginTop: '4px',
                    }}
                  >
                    {t('photo_requirements')}
                  </small>
                </div>
              </div>
            </div>

            {/* DATA PRIBADI */}
            <div className="registration-section">
              <h3>{t('personal_data')}</h3>

              <div className="registration-field">
                <label>{t('nik_ktp')} *</label>
                <input
                  name="nik_ktp"
                  value={form.nik_ktp}
                  onChange={handleChange}
                  placeholder={t('nik_placeholder')}
                  inputMode="numeric"
                  maxLength={16}
                  required
                />
              </div>

              <div className="registration-field">
                <label>
                  {t('employee_id')} {' '}
                  <span className="field-optional">
                    ({t('optional_mark')})
                  </span>
                </label>

                <input
                  name="id_karyawan"
                  value={form.id_karyawan}
                  onChange={handleChange}
                  placeholder={t('employee_id_placeholder')}
                  maxLength={32}
                  autoCapitalize="characters"
                />

                <small className="field-help">{t('employee_id_optional_help')}</small>
              </div>

              <div className="registration-field">
                <label>{t('full_name')} *</label>
                <input
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder={t('full_name_placeholder')}
                  required
                />
              </div>

              <div className="registration-row">
                <div className="registration-field">
                  <label>{t('birth_place')} *</label>
                  <input
                    name="tempat_lahir"
                    value={form.tempat_lahir}
                    onChange={handleChange}
                    placeholder={t('birth_place_placeholder')}
                    required
                  />
                </div>

                <div className="registration-field">
                  <label>{t('birth_date')} *</label>
                  <input
                    type="date"
                    name="tanggal_lahir"
                    value={form.tanggal_lahir}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="registration-row">
                <div className="registration-field">
                  <label>{t('gender')} *</label>

                  <select
                    name="jenis_kelamin"
                    value={form.jenis_kelamin}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- {t('select_gender')} --</option>
                    <option value="Laki-laki">{t('male')}</option>
                    <option value="Perempuan">{t('female')}</option>
                  </select>
                </div>

                <div className="registration-field">
                  <label>{t('marital_status')} *</label>

                  <select
                    name="status_pernikahan"
                    value={form.status_pernikahan}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- {t('select_marital_status')} --</option>
                    <option value="Belum Menikah">{t('unmarried')}</option>
                    <option value="Menikah">{t('married')}</option>
                    <option value="Cerai">{t('divorced')}</option>
                  </select>
                </div>
              </div>

              <div className="registration-field">
                <label>{t('mother_name')} *</label>
                <input
                  name="nama_ibu_kandung"
                  value={form.nama_ibu_kandung}
                  onChange={handleChange}
                  placeholder={t('mother_name_placeholder')}
                  required
                />
              </div>

              <div className="registration-field">
                <label>{t('home_address')} *</label>

                <textarea
                  name="alamat_rumah"
                  value={form.alamat_rumah}
                  onChange={handleChange}
                  placeholder={t('home_address_placeholder')}
                  rows={3}
                  required
                />
              </div>

              <div className="registration-row">
                <div className="registration-field">
                  <label>{t('phone')} *</label>

                  <input
                    name="no_telp"
                    value={form.no_telp}
                    onChange={handleChange}
                    placeholder="08xxxxxxxxxx"
                    inputMode="tel"
                    required
                  />
                </div>

                <div className="registration-field">
                  <label>{t('email')} *</label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="nama@email.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* DATA PEKERJAAN */}
            <div className="registration-section">
              <h3>{t('employment')}</h3>

              <div className="registration-row">
                <div className="registration-field">
                  <label>{t('department')} *</label>

                  <input
                    name="departemen"
                    value={form.departemen}
                    onChange={handleChange}
                    placeholder={t('department_placeholder')}
                    required
                  />
                </div>

                <div className="registration-field">
                  <label>{t('position')} *</label>

                  <input
                    name="jabatan"
                    value={form.jabatan}
                    onChange={handleChange}
                    placeholder={t('position_placeholder')}
                    required
                  />
                </div>
              </div>

              <div className="registration-row">
                <div className="registration-field">
                  <label>{t('employee_status')} *</label>

                  <select
                    name="status_karyawan"
                    value={form.status_karyawan}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      {t('select_employee_status')}
                    </option>
                    <option value="Tetap">{t('permanent')}</option>
                    <option value="Kontrak">{t('contract')}</option>
                    <option value="Harian">{t('daily')}</option>
                    <option value="Probation">{t('probation')}</option>
                  </select>
                </div>

                <div className="registration-field">
                  <label>{t('join_date')} *</label>

                  <input
                    type="date"
                    name="tanggal_masuk"
                    value={form.tanggal_masuk}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="registration-field">
                <label>{t('basic_salary')} *</label>

                <input
                  name="gaji_pokok"
                  value={form.gaji_pokok}
                  onChange={handleChange}
                  placeholder={t('salary_placeholder')}
                  inputMode="numeric"
                  required
                />

                <small className="field-help">
                  {t('salary_help')}
                </small>
              </div>
            </div>

            {/* BANK */}
            <div className="registration-section">
              <h3>{t('salary_account')}</h3>

              <div className="registration-row">
                <div className="registration-field">
                  <label>{t('bank')}</label>

                  <select
                    name="bank_name"
                    value={form.bank_name}
                    onChange={handleChange}
                  >
                    <option value="">{t('select_bank')}</option>
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                    <option value="CIMB Niaga">
                      CIMB Niaga
                    </option>
                    <option value="Permata">
                      Permata
                    </option>
                    <option value="Lainnya">{t('account_other')}</option>
                  </select>
                </div>

                <div className="registration-field">
                  <label>{t('bank_account')}</label>

                  <input
                    name="bank_account"
                    value={form.bank_account}
                    onChange={handleChange}
                    placeholder={t('account_number_placeholder')}
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>

            {/* KEAMANAN */}
            <div className="registration-section">
              <h3>{t('account_security')}</h3>

              <div className="registration-row">
                <div className="registration-field">
                  <label>{t('password')} *</label>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={t('password_min_placeholder')}
                    minLength={6}
                    required
                  />
                </div>

                <div className="registration-field">
                  <label>{t('confirm_password')} *</label>

                  <input
                    type="password"
                    name="konfirmasi"
                    value={form.konfirmasi}
                    onChange={handleChange}
                    placeholder={t('confirm_password_placeholder')}
                    minLength={6}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="registration-button"
              disabled={loading}
            >
              {loading ? t('processing') : t('register_now')}
            </button>

            <button
              type="button"
              className="registration-back"
              onClick={onBack}
            >
              {t('already_have_account_back')}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
