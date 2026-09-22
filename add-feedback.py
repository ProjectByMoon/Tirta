from pathlib import Path

p = Path("src/components/karyawan/dashboard/PortalKaryawan.tsx")
s = p.read_text()

# 1. Tambah tipe tab
old = "type Tab='home'|'attendance'|'leave'|'overtime'|'schedule'|'payslip'|'profile';"
new = "type Tab='home'|'attendance'|'leave'|'overtime'|'schedule'|'payslip'|'feedback'|'profile';"

if "|'feedback'|" not in s:
    if old not in s:
        raise SystemExit("GAGAL: type Tab tidak ditemukan")
    s = s.replace(old, new, 1)

# 2. Tambah state feedback setelah detailPayroll
old = "const [detailPayroll,setDetailPayroll]=useState<string|null>(null);"

new = """const [feedbackForm,setFeedbackForm]=useState({kategori:'Saran',judul:'',isi:''});
 const [feedbacks,setFeedbacks]=useState<any[]>([]);
 const [feedbackBusy,setFeedbackBusy]=useState(false);
 const [detailPayroll,setDetailPayroll]=useState<string|null>(null);"""

if "feedbackForm" not in s:
    if old not in s:
        raise SystemExit("GAGAL: detailPayroll tidak ditemukan")
    s = s.replace(old, new, 1)

# 3. Tambah loading feedback setelah setOtRequests
old = "setOtRequests(o.data||[]);"

new = """setOtRequests(o.data||[]);
 const {data:fb,error:fbError}=await supabase.from('hris_employee_feedback').select('id,kategori,judul,isi,status,tanggapan_hr,created_at,updated_at').eq('id_karyawan',e.id_karyawan).order('created_at',{ascending:false}).limit(30);
 if(!fbError)setFeedbacks(fb||[]);"""

if "hris_employee_feedback').select" not in s:
    if old not in s:
        raise SystemExit("GAGAL: setOtRequests tidak ditemukan")
    s = s.replace(old, new, 1)

# 4. Tambah fungsi submit feedback setelah submitProfile
marker = "const submitProfile=async(e:React.FormEvent)=>"

pos = s.find(marker)
if pos == -1:
    raise SystemExit("GAGAL: submitProfile tidak ditemukan")

# Cari akhir fungsi submitProfile berdasarkan "}};"
end = s.find("}};", pos)
if end == -1:
    raise SystemExit("GAGAL: akhir submitProfile tidak ditemukan")

end += 3

if "const submitFeedback=async" not in s:
    feedback_func = """ const submitFeedback=async(e:React.FormEvent)=>{
 e.preventDefault();
 if(!employee||feedbackBusy)return;
 setFeedbackBusy(true);
 setError('');
 setNotice('');
 const payload={
   id_karyawan:employee.id_karyawan,
   kategori:feedbackForm.kategori,
   judul:feedbackForm.judul.trim(),
   isi:feedbackForm.isi.trim()
 };
 const {data,error:e1}=await supabase
   .from('hris_employee_feedback')
   .insert(payload)
   .select('id,kategori,judul,isi,status,tanggapan_hr,created_at,updated_at')
   .single();
 setFeedbackBusy(false);
 if(e1){setError(e1.message);return}
 if(data)setFeedbacks(x=>[data,...x]);
 setFeedbackForm({kategori:'Saran',judul:'',isi:''});
 setNotice('Saran berhasil dikirim ke HR. Terima kasih atas masukannya.');
};"""

    s = s[:end] + feedback_func + s[end:]

# 5. Tambah tab Kotak Saran
old = "['payslip','Slip Gaji'],['profile','Profil']"
new = "['payslip','Slip Gaji'],['feedback','Kotak Saran'],['profile','Profil']"

if "['feedback','Kotak Saran']" not in s:
    if old not in s:
        raise SystemExit("GAGAL: daftar tab tidak ditemukan")
    s = s.replace(old, new, 1)

# 6. Tambah halaman Kotak Saran sebelum Profile
marker = "{tab==='profile'&&<section className=\"portal-grid\">"

if "KOTAK SARAN" not in s:
    if marker not in s:
        raise SystemExit("GAGAL: halaman Profile tidak ditemukan")

    ui = """{tab==='feedback'&&<section className="portal-grid">
<div className="portal-card info-card">
<div className="card-title"><div><span className="card-kicker">KOTAK SARAN</span><h2>Sampaikan Masukan</h2></div></div>
<p className="muted">Sampaikan saran, keluhan, atau masukan kepada HR. Masukan Anda akan diproses oleh tim terkait.</p>
<form className="employee-form" onSubmit={submitFeedback}>
<label>Kategori<select value={feedbackForm.kategori} onChange={e=>setFeedbackForm({...feedbackForm,kategori:e.target.value})}>
<option>Saran</option><option>Keluhan</option><option>Masukan</option>
</select></label>
<label>Judul<input value={feedbackForm.judul} onChange={e=>setFeedbackForm({...feedbackForm,judul:e.target.value})} minLength={3} maxLength={150} required placeholder="Contoh: Usulan perbaikan ruang istirahat"/></label>
<label>Isi Masukan<textarea value={feedbackForm.isi} onChange={e=>setFeedbackForm({...feedbackForm,isi:e.target.value})} minLength={5} maxLength={5000} required placeholder="Tuliskan saran, keluhan, atau masukan Anda..."/></label>
<button className="portal-primary" disabled={feedbackBusy}>{feedbackBusy?'Mengirim...':'Kirim Saran'}</button>
</form>
</div>
<div className="portal-card info-card">
<div className="card-title"><div><span className="card-kicker">RIWAYAT MASUKAN</span><h2>Masukan Saya</h2></div></div>
<div className="request-list">
{feedbacks.map(x=><div key={x.id}><div><b>{x.judul}</b><small>{x.kategori} · {new Date(x.created_at).toLocaleDateString('id-ID')}</small>{x.tanggapan_hr&&<small><strong>Tanggapan HR:</strong> {x.tanggapan_hr}</small>}</div><span className="status-badge">{x.status}</span></div>)}
{!feedbacks.length&&<p className="muted">Belum ada saran atau masukan yang dikirim.</p>}
</div>
</div>
</section>}"""

    s = s.replace(marker, ui + marker, 1)

p.write_text(s)
print("OK: Kotak Saran berhasil ditambahkan.")
