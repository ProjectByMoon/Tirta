import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../../locales/LanguageContext';
import { supabase } from '../../../lib/supabase/client';
import '../../../styles/employee/portal.css';
import moonLogo from '../../../assets/moon-logo.svg';
import SuggestionBox from '../../../features/employee-feedback/SuggestionBox';
import EmployeeAnnouncementCenter from '../../../features/announcements/EmployeeAnnouncementCenter';
import type { SuggestionDraft } from '../../../features/employee-feedback/types';

type Employee={id:string;id_karyawan:string;nama:string;email:string;jabatan?:string|null;departemen?:string|null;status_karyawan?:string|null;status_aktif?:boolean|null;tanggal_masuk?:string|null};
type Tab='home'|'announcements'|'attendance'|'leave'|'overtime'|'schedule'|'payslip'|'feedback'|'profile';
type Geo={lat:number;lng:number;accuracy:number};
const money=(n:number,locale='id-ID')=>new Intl.NumberFormat(locale,{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n||0);
const jakartaNow=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
const today=()=>{const p=Object.fromEntries(jakartaNow().map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`};
const dateLabel=(v:string,locale='id-ID')=>v?new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(`${v}T00:00:00`)):'-';

export default function PortalKaryawan({onLogout}:{onLogout?:()=>void}){
  const { t, lang } = useTranslation();
 const locale=lang==='id'?'id-ID':lang==='ja'?'ja-JP':lang==='ko'?'ko-KR':'zh-CN';
 const [user,setUser]=useState<any>(null),[employee,setEmployee]=useState<Employee|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[tab,setTab]=useState<Tab>('home');
 const [attendance,setAttendance]=useState<any[]>([]),[leaves,setLeaves]=useState<any[]>([]),[balances,setBalances]=useState<any[]>([]),[payroll,setPayroll]=useState<any[]>([]),[lines,setLines]=useState<Record<string,any[]>>({}),[schedule,setSchedule]=useState<any[]>([]),[otRequests,setOtRequests]=useState<any[]>([]),[announcements,setAnnouncements]=useState<any[]>([]),[announcementReadIds,setAnnouncementReadIds]=useState<string[]>([]),[payslipReadIds,setPayslipReadIds]=useState<string[]>([]),[feedbackReadIds,setFeedbackReadIds]=useState<string[]>([]);
 const [geo,setGeo]=useState<Geo|null>(null),[geoLoading,setGeoLoading]=useState(false),[cameraOn,setCameraOn]=useState(false),[cameraReady,setCameraReady]=useState(false),[cameraError,setCameraError]=useState(''),[selfie,setSelfie]=useState(''),[clockBusy,setClockBusy]=useState(false);
 const videoRef=useRef<HTMLVideoElement>(null),streamRef=useRef<MediaStream|null>(null);
 const [leaveForm,setLeaveForm]=useState({jenis:'Tahunan',tanggal_mulai:today(),tanggal_selesai:today(),alasan:''});
 const [profileForm,setProfileForm]=useState({field_name:'no_telp',new_value:'',reason:''});
 const [otForm,setOtForm]=useState({tanggal:today(),menit:'60',alasan:''});
 const [feedbacks,setFeedbacks]=useState<any[]>([]);
 const [detailPayroll,setDetailPayroll]=useState<string|null>(null);

 const getGeo=()=>{setGeoLoading(true);setError('');if(!navigator.geolocation){setGeoLoading(false);setError(t('portal_browser_no_gps'));return}navigator.geolocation.getCurrentPosition(p=>{if(!Number.isFinite(p.coords.accuracy)||p.coords.accuracy>100){setGeo(null);setGeoLoading(false);setError(t('portal_gps_low_accuracy').replace('{meters}',String(Math.round(p.coords.accuracy||999))));return}setGeo({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy});setGeoLoading(false)},e=>{setGeoLoading(false);setError(e.message||t('portal_location_unavailable'))},{enableHighAccuracy:true,timeout:12000,maximumAge:30000})};
 const stopCamera=(resetState=true)=>{
  const stream=streamRef.current;
  streamRef.current=null;
  if(stream){stream.getTracks().forEach(track=>{try{track.stop()}catch{}})}
  const video=videoRef.current;
  if(video){
   video.pause();
   video.srcObject=null;
   video.removeAttribute('src');
  }
  setCameraReady(false);
  if(resetState)setCameraOn(false);
 };

 const startCamera=async()=>{
  setCameraError('');
  setError('');
  setCameraReady(false);

  const isLocalhost=typeof window!=='undefined' && ['localhost','127.0.0.1','[::1]'].includes(window.location.hostname);
  if(typeof window==='undefined'||(!window.isSecureContext&&!isLocalhost)){
   setCameraError(t('camera_https_required'));
   return;
  }
  if(!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia!=='function'){
   setCameraError(t('camera_browser_unsupported'));
   return;
  }

  stopCamera(false);

  try{
   let stream:MediaStream;
   try{
    stream=await navigator.mediaDevices.getUserMedia({
     audio:false,
     video:{
      facingMode:{ideal:'user'},
      width:{ideal:720,min:320},
      height:{ideal:720,min:240}
     }
    });
   }catch(firstError:any){
    // Fallback untuk webcam/driver yang tidak menerima constraint tertentu.
    if(['OverconstrainedError','NotFoundError'].includes(firstError?.name||'')){
     stream=await navigator.mediaDevices.getUserMedia({audio:false,video:true});
    }else throw firstError;
   }

   streamRef.current=stream;
   setCameraOn(true);
  }catch(e:any){
   const name=e?.name||'';
   const message=name==='NotAllowedError'||name==='PermissionDeniedError'
    ?'Izin kamera ditolak. Izinkan kamera untuk situs ini melalui ikon kamera di address bar, lalu klik Buka Kamera lagi.'
    :name==='NotFoundError'
    ?t('camera_not_found')
    :name==='NotReadableError'||name==='TrackStartError'
    ?t('camera_busy')
    :name==='SecurityError'
    ?t('camera_security_blocked')
    :e?.message||t('camera_open_failed');
   setCameraError(message);
   setCameraOn(false);
   setCameraReady(false);
  }
 };

 useEffect(()=>{
  if(!cameraOn)return;
  const video=videoRef.current;
  const stream=streamRef.current;
  if(!video||!stream)return;

  let cancelled=false;
  const markReady=()=>{
   if(!cancelled && video.videoWidth>1 && video.videoHeight>1)setCameraReady(true);
  };

  video.muted=true;
  video.playsInline=true;
  video.autoplay=true;
  video.srcObject=stream;
  video.addEventListener('loadedmetadata',markReady);
  video.addEventListener('canplay',markReady);
  video.addEventListener('playing',markReady);

  const startPlayback=async()=>{
   try{
    await video.play();
    markReady();
   }catch{
    setCameraError('Pratinjau kamera tidak dapat diputar. Klik Buka Kamera lagi setelah memastikan izin kamera sudah diizinkan.');
   }
  };
  void startPlayback();

  return()=>{
   cancelled=true;
   video.removeEventListener('loadedmetadata',markReady);
   video.removeEventListener('canplay',markReady);
   video.removeEventListener('playing',markReady);
  };
 },[cameraOn]);

 const takeSelfie=()=>{
  const video=videoRef.current;
  if(!video||!streamRef.current){
   setCameraError('Kamera belum aktif. Klik Buka Kamera terlebih dahulu.');
   return;
  }
  if(video.readyState<2||video.videoWidth<2||video.videoHeight<2){
   setCameraError('Pratinjau kamera belum siap. Tunggu sampai wajah terlihat di layar, lalu tekan Ambil Selfie.');
   return;
  }

  const sourceWidth=video.videoWidth;
  const sourceHeight=video.videoHeight;
  const side=Math.min(sourceWidth,sourceHeight);
  const sx=Math.floor((sourceWidth-side)/2);
  const sy=Math.floor((sourceHeight-side)/2);
  const canvas=document.createElement('canvas');
  canvas.width=720;
  canvas.height=720;
  const ctx=canvas.getContext('2d');
  if(!ctx){setCameraError('Perangkat tidak dapat membuat foto selfie.');return;}

  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.drawImage(video,sx,sy,side,side,0,0,720,720);
  const image=canvas.toDataURL('image/jpeg',0.88);
  if(!image||image.length<100){
   setCameraError('Foto selfie gagal dibuat. Coba ulangi.');
   return;
  }
  setSelfie(image);
  setCameraError('');
  stopCamera();
 };

 useEffect(()=>()=>stopCamera(),[]);

 const load=async()=>{setLoading(true);setError('');const {data:{user:u}}=await supabase.auth.getUser();setUser(u);if(!u){setLoading(false);return}const {data:e,error:ee}=await supabase.from('karyawan').select('id,id_karyawan,nama,email,jabatan,departemen,status_karyawan,status_aktif,tanggal_masuk').eq('auth_user_id',u.id).maybeSingle();if(ee){setError(ee.message);setLoading(false);return}if(!e){setLoading(false);return}setEmployee(e);
  const [a,l,b,p,j,o,ann]=await Promise.all([
   supabase.from('absensi').select('*').eq('id_karyawan',e.id_karyawan).order('tanggal',{ascending:false}).limit(90),
   supabase.from('hris_cuti').select('*').eq('id_karyawan',e.id_karyawan).order('created_at',{ascending:false}).limit(40),
   supabase.from('hris_saldo_cuti').select('*').eq('id_karyawan',e.id_karyawan).order('tahun',{ascending:false}),
   supabase.from('hris_payroll').select('*').eq('id_karyawan',e.id_karyawan).order('periode',{ascending:false}).limit(12),
   supabase.from('hris_jadwal').select('*,hris_shift(*)').eq('id_karyawan',e.id_karyawan).gte('tanggal',today()).order('tanggal').limit(45),
      supabase.from('hris_employee_overtime_requests').select('*').eq('id_karyawan',e.id_karyawan).order('tanggal',{ascending:false}).limit(30),
   supabase.from('hris_announcements').select('*').eq('status','published').order('pinned',{ascending:false}).order('published_at',{ascending:false}).limit(50)
  ]);
  setAttendance(a.data||[]);setLeaves(l.data||[]);setBalances(b.data||[]);setPayroll(p.data||[]);setSchedule(j.data||[]);setOtRequests(o.data||[]);setAnnouncements(ann.data||[]);
 const {data:announcementReads}=await supabase.from('hris_announcement_reads').select('announcement_id').eq('user_id',u.id);
 setAnnouncementReadIds((announcementReads||[]).map(x=>x.announcement_id));
 const {data:fb,error:fbError}=await supabase.from('hris_employee_feedback').select('id,kategori,judul,isi,status,tanggapan_hr,created_at,updated_at').eq('id_karyawan',e.id_karyawan).order('created_at',{ascending:false}).limit(30);
 if(!fbError)setFeedbacks(fb||[]);
  const ids=(p.data||[]).map(x=>x.id);if(ids.length){const {data:pl}=await supabase.from('hris_payroll_lines').select('*').in('payroll_id',ids);const grouped:any={};(pl||[]).forEach(x=>(grouped[x.payroll_id]??=[]).push(x));setLines(grouped)}else setLines({});setLoading(false)
 };
 useEffect(()=>{load()},[]);
 const logout=async()=>{stopCamera();await supabase.auth.signOut();setEmployee(null);setUser(null);onLogout?.()};
 const requireSecurity=()=>{if(!geo){setError(t('portal_gps_first'));getGeo();return false}if(!selfie){setError(t('portal_selfie_first'));return false}return true};
 const clockIn=async()=>{if(!employee||!requireSecurity())return;setClockBusy(true);const {error:e1}=await supabase.rpc('hris_ess_clock_in',{p_id_karyawan:employee.id_karyawan,p_tanggal:today(),p_jam:null,p_lat:geo?.lat,p_long:geo?.lng,p_accuracy:geo?.accuracy,p_selfie:selfie,p_lokasi:'GPS ESS'});setClockBusy(false);if(e1)setError(e1.message);else{setNotice(t('portal_clockin_success'));setSelfie('');setGeo(null);await load()}};
 const clockOut=async()=>{if(!employee||!requireSecurity())return;setClockBusy(true);const {error:e1}=await supabase.rpc('hris_ess_clock_out',{p_id_karyawan:employee.id_karyawan,p_tanggal:today(),p_jam:null,p_lat:geo?.lat,p_long:geo?.lng,p_accuracy:geo?.accuracy,p_selfie:selfie,p_lokasi:'GPS ESS'});setClockBusy(false);if(e1)setError(e1.message);else{setNotice(t('portal_clockout_success'));setSelfie('');setGeo(null);await load()}};
 const todayDate=today();
const todayRows=attendance.filter(a=>a.tanggal===todayDate);

const todayAtt=
  todayRows.find(a=>a.jam_masuk&&!a.jam_pulang) ??
  todayRows.find(a=>!!a.jam_masuk) ??
  todayRows[0];

const canClockIn=!todayAtt?.jam_masuk;
const canClockOut=!!todayAtt?.jam_masuk&&!todayAtt?.jam_pulang;
 const submitLeave=async(e:React.FormEvent)=>{e.preventDefault();if(!employee)return;const start=new Date(`${leaveForm.tanggal_mulai}T00:00:00`),end=new Date(`${leaveForm.tanggal_selesai}T00:00:00`);if(end<start){setError(t('portal_leave_date_invalid'));return}const days=Math.floor((end.getTime()-start.getTime())/86400000)+1;const {error:e1}=await supabase.from('hris_employee_leave_requests').insert({...leaveForm,id_karyawan:employee.id_karyawan,jumlah_hari:days});if(e1)setError(e1.message);else{setNotice(t('portal_leave_success'));setLeaveForm({...leaveForm,tanggal_mulai:today(),tanggal_selesai:today(),alasan:''});await load()}};
 const submitOt=async(e:React.FormEvent)=>{e.preventDefault();if(!employee)return;const {error:e1}=await supabase.from('hris_employee_overtime_requests').insert({id_karyawan:employee.id_karyawan,tanggal:otForm.tanggal,menit:Number(otForm.menit),alasan:otForm.alasan});if(e1)setError(e1.message);else{setNotice(t('portal_overtime_success'));setOtForm({...otForm,menit:'60',alasan:''});await load()}};
 const submitProfile=async(e:React.FormEvent)=>{e.preventDefault();if(!employee)return;const {error:e1}=await supabase.from('hris_employee_profile_requests').insert({...profileForm,id_karyawan:employee.id_karyawan,old_value:profileForm.field_name==='email'?employee.email||'':''});if(e1)setError(e1.message);else{setNotice(t('portal_profile_success'));setProfileForm({...profileForm,new_value:'',reason:''})}}; const submitFeedback=async(draft:SuggestionDraft)=>{
   if(!employee) return;
   setError('');
   setNotice('');
   const payload={id_karyawan:employee.id_karyawan,kategori:draft.category,judul:draft.title.trim(),isi:draft.content.trim()};
   const {data,error:e1}=await supabase.from('hris_employee_feedback').insert(payload).select('id,kategori,judul,isi,status,tanggapan_hr,created_at,updated_at').single();
   if(e1) throw new Error(e1.message);
   if(data)setFeedbacks(x=>[data,...x]);
 };
 
 const printPayslip=(id:string)=>{setDetailPayroll(id);setTimeout(()=>window.print(),150)};
 const stats=useMemo(()=>({hadir:attendance.filter(a=>['Hadir','Tepat Waktu','Terlambat'].includes(a.status||'')).length,cuti:leaves.filter(x=>x.status==='Disetujui').reduce((s,x)=>s+Number(x.jumlah_hari||0),0),latest:payroll[0]}),[attendance,leaves,payroll]);
 const announcementUnread=announcements.filter(a=>!announcementReadIds.includes(a.id)).length;
 const leavePending=leaves.filter(x=>x.status==='Menunggu').length;
 const overtimePending=otRequests.filter(x=>x.status==='Menunggu').length;
 const payslipUnread=payroll.filter(x=>x.status==='Disetujui'&&!payslipReadIds.includes(String(x.id))).length;
 const feedbackUnread=feedbacks.filter(x=>x.status==='Baru'&&!feedbackReadIds.includes(String(x.id))).length;
 const tabs:[Tab,string][]=[['home',t('home')],['announcements',announcementUnread>0?`${t('announcement_center')} (${announcementUnread})`:t('announcement_center')],['attendance',t('attendance')],['leave',leavePending>0?`${t('leave')} (${leavePending})`:t('leave')],['overtime',overtimePending>0?`${t('overtime')} (${overtimePending})`:t('overtime')],['schedule',t('work_schedule')],['payslip',payslipUnread>0?`${t('payroll_payslip')} (${payslipUnread})`:t('payroll_payslip')],['feedback',feedbackUnread>0?`${t('feedback_inbox')} (${feedbackUnread})`:t('feedback_inbox')],['profile',t('profile')]];
 if(loading&&!employee&&!user)return <PortalLoadingScreen/>;
 if(!employee)return <div className="employee-login"><div className="employee-login-card"><div className="employee-logo">M</div><div className="login-copy"><span className="portal-eyebrow">{t('portal_account_link')}</span><h2>{t('portal_account_unlinked')}</h2><p>{t('portal_account_unlinked_desc')}</p></div><button className="portal-secondary" onClick={logout}>{t('logout')}</button></div></div>;
 if(employee.status_aktif===false)return <div className="employee-login"><div className="employee-login-card"><div className="employee-logo">M</div><div className="login-copy"><span className="portal-eyebrow">{t('portal_account_status')}</span><h2>{t('portal_waiting_verification')}</h2><p>{t('portal_waiting_verification_desc')}</p></div><button className="portal-secondary" onClick={logout}>{t('logout')}</button></div></div>;
 return <div className="employee-portal"><header className="employee-topbar"><div className="employee-brand"><div className="employee-logo"><img src={moonLogo} alt="Project by Tirta" /></div><div><strong>Project by Tirta</strong><small>{t('portal_service')}</small></div></div><div className="employee-user"><div><b>{employee.nama}</b><small>{employee.jabatan||t('employee')}</small></div><button className="portal-logout" onClick={logout}>{t('logout')}</button></div></header>
 <main className="employee-page"><div className="employee-heading"><div><span className="portal-eyebrow">{t('portal_services_version')}</span><h1>{tab==='home'?t('welcome') + ', '+employee.nama:tabs.find(x=>x[0]===tab)?.[1]}</h1><p>{t('portal_services_desc')}</p></div><div className="date-chip">{new Intl.DateTimeFormat(locale,{dateStyle:'full'}).format(new Date())}</div></div>
 <nav className="employee-tabs">{tabs.map(([k,l])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{l}</button>)}</nav>
 {notice&&<div className="portal-info">{notice}<button className="portal-link" onClick={()=>setNotice('')}>{t('close')}</button></div>}{error&&<div className="portal-error">{error}<button className="portal-link" onClick={()=>setError('')}>{t('close')}</button></div>}
 {tab==='home'&&<><section className="ess-kpis"><div className="portal-card ess-kpi"><small>{t('portal_attendance_recorded')}</small><strong>{stats.hadir}</strong><span>{t('portal_last_records')}</span></div><div className="portal-card ess-kpi"><small>{t('portal_leave_approved')}</small><strong>{stats.cuti}</strong><span>{t('days')}</span></div><div className="portal-card ess-kpi"><small>{t('portal_latest_payslip')}</small><strong>{stats.latest?money(Number(stats.latest.gaji_bersih),locale):'-'}</strong><span>{stats.latest?.periode||t('portal_not_available')}</span></div></section>
 <section className="attendance-grid"><div className="portal-card attendance-card"><div className="card-title"><div><span className="card-kicker">{t('portal_safe_attendance')}</span><h2>{t('attendance_today')}</h2></div><span className="status-badge">{t('portal_gps_selfie')}</span></div><div className="attendance-meta"><div><small>{t('check_in')}</small><b>{todayAtt?.jam_masuk||'Belum'}</b></div><div><small>{t('check_out')}</small><b>{todayAtt?.jam_pulang||'Belum'}</b></div></div><div className="security-box"><b>{geo?t('portal_location_ready'):t('portal_location_missing')} · {selfie?t('portal_selfie_ready'):t('portal_selfie_missing')}</b><p>{t('portal_attendance_privacy')}</p></div><div className="attendance-actions"><button className="portal-secondary" onClick={getGeo} disabled={geoLoading}>{geoLoading?t('portal_getting_gps'):geo?t('portal_gps_accuracy').replace('{meters}',String(Math.round(geo.accuracy))):t('portal_get_gps')}</button><button className="portal-secondary" onClick={cameraOn?takeSelfie:startCamera} disabled={cameraOn&&!cameraReady}>{cameraOn?(cameraReady?t('portal_take_selfie'):t('portal_camera_prepare')):selfie?t('portal_open_camera_again'):t('portal_open_camera')}</button></div>{cameraError&&<div className="portal-error compact">{cameraError}</div>}{cameraOn&&<div className="camera-frame"><video ref={videoRef} autoPlay playsInline muted onLoadedMetadata={()=>setCameraReady(true)} onCanPlay={()=>setCameraReady(true)}/><div className="camera-overlay">{cameraReady?t('portal_center_face'):t('portal_camera_preview')}</div></div>}{selfie&&<div className="selfie-preview"><img src={selfie} alt={t('portal_take_selfie')}/><button className="portal-link" onClick={()=>setSelfie('')}>{t('portal_retake')}</button></div>}<div className="attendance-actions"><button className="portal-primary" disabled={clockBusy||!canClockIn} onClick={clockIn}>{clockBusy?t('portal_processing'):t('check_in')}</button><button className="portal-primary" disabled={clockBusy||!canClockOut} onClick={clockOut}>{clockBusy?t('portal_processing'):t('check_out')}</button></div></div>
 <div className="portal-card info-card"><div className="card-title"><div><span className="card-kicker">{t('portal_quick_access_title')}</span><h2>{t('portal_my_services')}</h2></div></div><div className="quick-list"><button onClick={()=>setTab('leave')}><b>{t('leave')}</b><span>{t('portal_request_history')}</span></button><button onClick={()=>setTab('overtime')}><b>{t('overtime')}</b><span>{t('portal_overtime_prompt')}</span></button><button onClick={()=>setTab('schedule')}><b>{t('work_schedule')}</b><span>{t('portal_upcoming_shifts')}</span></button><button onClick={()=>setTab('payslip')}><b>Slip Gaji</b><span>{t('portal_salary_detail')}</span></button></div></div></section>
 <section className="portal-grid"><div className="portal-card info-card"><div className="card-title"><div><span className="card-kicker">{t('portal_profile_summary')}</span><h2>{t('portal_employee_summary')}</h2></div><button className="portal-secondary" onClick={()=>setTab('profile')}>{t('portal_open_profile')}</button></div><div className="info-list"><div><small>{t('employee_id')}</small><b>{employee.id_karyawan}</b></div><div><small>{t('department')}</small><b>{employee.departemen||'-'}</b></div><div><small>{t('position')}</small><b>{employee.jabatan||'-'}</b></div><div><small>{t('join_date')}</small><b>{employee.tanggal_masuk?dateLabel(employee.tanggal_masuk,locale):'-'}</b></div></div></div></section></>}
 {tab==='announcements'&&<EmployeeAnnouncementCenter
 announcements={announcements}
 onRead={async(id)=>{
  const {data:{user:u}}=await supabase.auth.getUser();
  if(!u)return;
  const {error:e1}=await supabase
   .from('hris_announcement_reads')
   .upsert(
    {announcement_id:id,user_id:u.id,read_at:new Date().toISOString()},
    {onConflict:'announcement_id,user_id'}
   );
  if(e1){setError(e1.message);return}
  setAnnouncements(x=>x.map(a=>a.id===id?{...a,isRead:true}:a));setAnnouncementReadIds(x=>x.includes(id)?x:[...x,id]);
 }}
/>}
{tab==='attendance'&&<section className="portal-card table-card"><div className="card-title"><div><span className="card-kicker">ABSENSI</span><h2>{t('portal_attendance_history')}</h2></div><button className="portal-secondary" onClick={()=>setTab('home')}>Absensi Hari Ini</button></div><div className="table-scroll"><table><thead><tr><th>{t('date')}</th><th>{t('check_in')}</th><th>{t('check_out')}</th><th>{t('status')}</th><th>GPS</th><th>{t('source')}</th></tr></thead><tbody>{attendance.map((a,i)=><tr key={a.id||i}><td>{dateLabel(a.tanggal,locale)}</td><td>{a.jam_masuk||'-'}</td><td>{a.jam_pulang||'-'}</td><td><span className="status-badge">{a.status||t('portal_recorded')}</span></td><td>{a.latitude&&a.longitude?t('portal_saved'):'-'}</td><td>{a.sumber||'Manual'}</td></tr>)}{!attendance.length&&<tr><td colSpan={6}>{t('portal_no_attendance')}</td></tr>}</tbody></table></div></section>}
 {tab==='leave'&&<section className="portal-grid"><div className="portal-card info-card"><div className="card-title"><div><span className="card-kicker">{t('leave_request')}</span><h2>{t('leave')} / Izin</h2></div></div><form className="employee-form" onSubmit={submitLeave}><label>{t('type')}<select value={leaveForm.jenis} onChange={e=>setLeaveForm({...leaveForm,jenis:e.target.value})}><option>Tahunan</option><option>Sakit</option><option>Khusus</option><option>Izin</option></select></label><div className="form-two"><label>{t('date')} — {t('start_date')}<input type="date" value={leaveForm.tanggal_mulai} onChange={e=>setLeaveForm({...leaveForm,tanggal_mulai:e.target.value})}/></label><label>{t('date')} — {t('end_date')}<input type="date" value={leaveForm.tanggal_selesai} onChange={e=>setLeaveForm({...leaveForm,tanggal_selesai:e.target.value})}/></label></div><label>{t('reason')}<textarea value={leaveForm.alasan} onChange={e=>setLeaveForm({...leaveForm,alasan:e.target.value})} required/></label><button className="portal-primary">{t('portal_send_request')}</button></form></div><div className="portal-card info-card"><div className="card-title"><div><span className="card-kicker">{t('portal_balance_title')}</span><h2>{t('portal_leave_balance')}</h2></div></div><div className="balance-list">{balances.slice(0,6).map(b=><div key={b.id}><span>{b.jenis}</span><b>{Math.max(0,Number(b.saldo||0)-Number(b.terpakai||0))} hari</b></div>)}{!balances.length&&<p className="muted">{t('portal_balance_unavailable')}</p>}</div><div className="request-list">{leaves.map(x=><div key={x.id}><div><b>{x.jenis}</b><small>{dateLabel(x.tanggal_mulai,locale)} — {dateLabel(x.tanggal_selesai,locale)}</small></div><span className="status-badge">{x.status}</span></div>)}</div></div></section>}
 {tab==='overtime'&&<section className="portal-grid"><div className="portal-card info-card"><div className="card-title"><div><span className="card-kicker">{t('overtime')}</span><h2>{t('overtime')}</h2></div></div><form className="employee-form" onSubmit={submitOt}><label>{t('date')}<input type="date" value={otForm.tanggal} onChange={e=>setOtForm({...otForm,tanggal:e.target.value})}/></label><label>{t('portal_duration_minutes')}<input type="number" min="1" max="1440" value={otForm.menit} onChange={e=>setOtForm({...otForm,menit:e.target.value})} required/></label><label>{t('reason')}<textarea value={otForm.alasan} onChange={e=>setOtForm({...otForm,alasan:e.target.value})} required/></label><button className="portal-primary">{t('portal_send_request')}</button></form></div><div className="portal-card info-card"><div className="card-title"><div><span className="card-kicker">{t('portal_overtime_history')}</span><h2>{t('portal_overtime_status')}</h2></div></div><div className="request-list">{otRequests.map(x=><div key={x.id}><div><b>{dateLabel(x.tanggal,locale)}</b><small>{x.menit} menit · {x.alasan}</small></div><span className="status-badge">{x.status}</span></div>)}{!otRequests.length&&<p className="muted">{t('portal_no_overtime')}</p>}</div></div></section>}
 {tab==='schedule'&&<section className="portal-card table-card"><div className="card-title"><div><span className="card-kicker">{t('portal_work_calendar')}</span><h2>{t('portal_upcoming_schedule')}</h2></div></div><div className="schedule-grid">{schedule.map(s=><div className="schedule-item" key={s.id}><small>{dateLabel(s.tanggal,locale)}</small><b>{s.hris_shift?.nama||t('portal_shift_undefined')}</b><span>{s.hris_shift?.jam_masuk||'--:--'} — {s.hris_shift?.jam_pulang||'--:--'}</span><em>{s.status}</em></div>)}{!schedule.length&&<div className="empty-state"><h2>{t('portal_no_schedule')}</h2><p>{t('portal_schedule_unpublished')}</p></div>}</div></section>}
 {tab==='payslip'&&<PayslipReadTracker payroll={payroll} onRead={setPayslipReadIds}/>}
{tab==='payslip'&&<section className="payslip-grid">{payroll.map(p=><div className="portal-card payslip-card" key={p.id}><div className="card-title"><div><span className="card-kicker">{t('portal_salary_slip')}</span><h2>{t('period')} {p.periode}</h2></div><span className="status-badge">{p.status}</span></div><div className="salary-value">{money(Number(p.gaji_bersih||0),locale)}</div><p>{t('portal_net_salary')}</p><div className="salary-lines">{(lines[p.id]||[]).map(x=><div key={x.id}><span>{x.nama}</span><b>{money(Number(x.amount||0),locale)}</b></div>)}</div><button className="portal-secondary full" onClick={()=>printPayslip(p.id)}>{t('portal_print_pdf')}</button></div>)}{!payroll.length&&<div className="portal-card empty-state"><div className="empty-icon">P</div><h2>{t('portal_no_payslip')}</h2><p>{t('portal_payslip_desc')}</p></div>}{detailPayroll&&<div className="print-slip" id="print-slip">{(()=>{const p=payroll.find(x=>x.id===detailPayroll);return p?<><div className="print-head"><b>Project by Tirta</b><span>{t('portal_salary_slip')} · {t('employee')}</span></div><h2>{t('payroll_payslip')} · {p.periode}</h2><p>{employee.nama} · {employee.id_karyawan}</p><hr/><div className="print-lines">{(lines[p.id]||[]).map(x=><div key={x.id}><span>{x.nama}</span><b>{money(Number(x.amount||0),locale)}</b></div>)}<div className="total"><span>{t('portal_net_salary')}</span><b>{money(Number(p.gaji_bersih||0),locale)}</b></div></div></>:null})()}</div>}</section>}
 {tab==='feedback'&&<FeedbackReadTracker feedbacks={feedbacks} onRead={setFeedbackReadIds}/>}
{tab==='feedback'&&<section className="portal-grid">
<SuggestionBox onSubmit={submitFeedback}/>
<div className="portal-card info-card">
<div className="card-title"><div><span className="card-kicker">{t('portal_overtime_history')} MASUKAN</span><h2>{t('portal_my_feedback')}</h2></div></div>
<div className="request-list">
{feedbacks.map(x=><div key={x.id}><div><b>{x.judul}</b><small>{x.kategori} · {new Date(x.created_at).toLocaleDateString(locale)}</small>{x.tanggapan_hr&&<small><strong>{t('portal_hr_response')}</strong> {x.tanggapan_hr}</small>}</div><span className="status-badge">{x.status}</span></div>)}
{!feedbacks.length&&<p className="muted">{t('portal_no_feedback')}</p>}
</div>
</div>
</section>}{tab==='profile'&&<section className="portal-grid"><div className="portal-card info-card"><div className="portal-profile"><div className="portal-avatar">{employee.nama.charAt(0).toUpperCase()}</div><div><h3>{employee.nama}</h3><p>{employee.jabatan||t('employee')} · {employee.departemen||'-'}</p></div></div><div className="info-list"><div><small>{t('email')}</small><b>{employee.email||'-'}</b></div><div><small>{t('employee_id')}</small><b>{employee.id_karyawan}</b></div><div><small>Status</small><b>{employee.status_karyawan||t('active')}</b></div></div></div><div className="portal-card info-card"><div className="card-title"><div><span className="card-kicker">{t('portal_profile_change')}</span><h2>{t('request_data_change')}</h2></div></div><form className="employee-form" onSubmit={submitProfile}><label>{t('data_to_change')}<select value={profileForm.field_name} onChange={e=>setProfileForm({...profileForm,field_name:e.target.value})}><option value="no_telp">{t('phone_number')}</option><option value="alamat_rumah">{t('home_address')}</option><option value="email">Email</option></select></label><label>{t('new_value')}<input value={profileForm.new_value} onChange={e=>setProfileForm({...profileForm,new_value:e.target.value})} required/></label><label>{t('reason')}<textarea value={profileForm.reason} onChange={e=>setProfileForm({...profileForm,reason:e.target.value})}/></label><button className="portal-primary">{t('send_request')}</button></form></div></section>}
 </main></div>;
}

function FeedbackReadTracker({feedbacks,onRead}:{feedbacks:any[];onRead:(ids:string[])=>void}){
 useEffect(()=>{
  const fresh=feedbacks.filter(x=>x.status==='Baru').map(x=>String(x.id));
  if(!fresh.length)return;
  const key='moonx_feedback_read_ids';
  let saved:string[]=[];
  try{saved=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(saved))saved=[];}catch{saved=[]}
  const next=[...new Set([...saved,...fresh])];
  localStorage.setItem(key,JSON.stringify(next));
  onRead(next);
 },[feedbacks,onRead]);
 return null;
}

function PayslipReadTracker({payroll,onRead}:{payroll:any[];onRead:(ids:string[])=>void}){
 useEffect(()=>{
  const approved=payroll.filter(x=>x.status==='Disetujui').map(x=>String(x.id));
  if(!approved.length)return;
  const key='moonx_payslip_read_ids';
  let saved:string[]=[];
  try{saved=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(saved))saved=[];}catch{saved=[]}
  const next=[...new Set([...saved,...approved])];
  localStorage.setItem(key,JSON.stringify(next));
  onRead(next);
 },[payroll,onRead]);
 return null;
}

function PortalLoadingScreen(){
 const { t } = useTranslation();
 return <main className="employee-loading-screen" role="status" aria-live="polite">
  <section className="employee-loading-card">
   <div className="employee-loading-logo"><img src={moonLogo} alt="Project by Tirta"/></div>
   <div className="employee-loading-copy"><strong>{t('portal_login_setup')}</strong><span>{t('portal_loading')}</span></div>
   <div className="employee-loading-bar" aria-hidden="true"><i/></div>
   <div className="employee-loading-skeletons" aria-hidden="true"><i/><i/><i/></div>
  </section>
 </main>
}
