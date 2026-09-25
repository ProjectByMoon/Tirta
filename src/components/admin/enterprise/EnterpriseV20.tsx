import { appAlert } from '../../../lib/app-dialog';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useTranslation } from '../../../locales/LanguageContext';

type Row = Record<string, any>;

export default function EnterpriseV20({employees}:{employees:Row[]}){const {t}=useTranslation();
const tabs=[
['command',t('command_center'),t('command_center_desc')],
['workflow',t('workflow'),t('workflow_desc')],
['analytics',t('people_analytics'),t('headcount_attendance')],
['documents',t('employee_documents'),t('document_expiry')],
['performance',t('performance_review'),t('performance_review_desc')],
['workforce',t('workforce'),t('roster_capacity')],
['compliance',t('compliance'),t('checklist_audit')],
['settings',t('enterprise_settings'),t('system_controls')]
] as const;
 const [tab,setTab]=useState<string>('command'); const [msg,setMsg]=useState(''); const [loading,setLoading]=useState(false);
 const [approvals,setApprovals]=useState<Row[]>([]),[docs,setDocs]=useState<Row[]>([]),[tasks,setTasks]=useState<Row[]>([]),[roster,setRoster]=useState<Row[]>([]),[reviews,setReviews]=useState<Row[]>([]);
 const load=async()=>{setLoading(true); const [a,d,t,r,p]=await Promise.all([
  supabase.from('hris_approval_requests').select('*').order('created_at',{ascending:false}).limit(100),
  supabase.from('hris_employee_documents').select('*').order('created_at',{ascending:false}).limit(100),
  supabase.from('hris_compliance_tasks').select('*').order('due_date',{ascending:true}).limit(100),
  supabase.from('hris_workforce_roster').select('*').order('work_date',{ascending:false}).limit(100),
  supabase.from('hris_performance_reviews').select('*').order('period',{ascending:false}).limit(100)
 ]); setApprovals(a.data||[]);setDocs(d.data||[]);setTasks(t.data||[]);setRoster(r.data||[]);setReviews(p.data||[]);setLoading(false)};
 useEffect(()=>{load()},[]);
 const pending=approvals.filter(x=>/menunggu|pending/i.test(String(x.status||''))).length;
 const active=employees.filter(x=>x.status_aktif!==false).length;
 const expiring=docs.filter(x=>{const d=x.tanggal_kadaluarsa||x.expiry_date;return d&&new Date(d).getTime()-Date.now()<1000*60*60*24*30}).length;
 const openCompliance=tasks.filter(x=>!['Selesai','Done','Closed'].includes(String(x.status||''))).length;
 const cap=roster.length; const reviewed=reviews.length;
 const approve=async(row:Row,decision:'Disetujui'|'Ditolak')=>{setMsg(''); const {error}=await supabase.rpc('hris_decide_approval',{p_id:row.id,p_status:decision,p_catatan:decision==='Ditolak'?'Ditolak dari Pusat Kendali Enterprise':'Disetujui dari Pusat Kendali Enterprise'}); if(error){setMsg(error.message);return} setMsg(`Approval ${decision.toLowerCase()}.`);load()};
 return <div className="module-page">
  <div className="page-heading"><div><h1>{t('enterprise_control_center')}</h1><p>{t('enterprise_control_desc')}</p></div><button className="primary" onClick={load}>{loading?t('loading'):t('reload')}</button></div>
  <div className="branch-tabs">{tabs.map(([k,l,s])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}><b>{l}</b><small>{s}</small></button>)}</div>
  {msg&&<div className="alert">{msg}</div>}
  {tab==='command'&&<><div className="stat-grid"><Kpi title={t("active_employees")} value={active}/><Kpi title={t("approval_pending")} value={pending}/><Kpi title={t("documents_expiring")} value={expiring}/><Kpi title={t("compliance_open")} value={openCompliance}/></div><div className="content-grid"><Panel title={t("operational_health")}><p>{t("employee_roster_data")}: <b>{cap}</b></p><p>{t("performance_review")}: <b>{reviewed}</b></p><p>{t("approval_queue")}: <b>{pending} {t("pending").toLowerCase()}</b></p><p>{t("documents_near_expiry")}: <b>{expiring}</b></p></Panel><Panel title={t("executive_control")}><button className="secondary" onClick={()=>setTab('workflow')}>{t("review_approval_queue")}</button><button className="secondary" onClick={()=>setTab('compliance')}>{t("open_compliance")}</button><button className="secondary" onClick={()=>setTab('documents')}>{t("manage_documents")}</button></Panel></div></>}
  {tab==='workflow'&&<Panel title={t("approval_queue")}><Table rows={approvals.slice(0,50)} cols={['modul','record_id','status','created_at']} action={(r)=>/menunggu|pending/i.test(String(r.status||''))?<><button className="link-btn" onClick={()=>approve(r,'Disetujui')}>{t('approve')}</button><button className="link-btn danger" onClick={()=>approve(r,'Ditolak')}>{t('reject')}</button></>:null}/></Panel>}
  {tab==='analytics'&&<Analytics employees={employees} roster={roster}/>} 
  {tab==='documents'&&<Panel title={t("employee_documents")}><Table rows={docs} cols={['id_karyawan','nama_dokumen','tanggal_kadaluarsa','status']}/></Panel>}
  {tab==='performance'&&<Panel title={t("performance_review")}><Table rows={reviews} cols={['id_karyawan','period','score','status','catatan']}/></Panel>}
  {tab==='workforce'&&<Panel title={t("workforce")}><Table rows={roster} cols={['work_date','id_karyawan','shift_code','location','status']}/></Panel>}
  {tab==='compliance'&&<Panel title={t("compliance_tasks")}><Table rows={tasks} cols={['task_code','title','owner','due_date','status']}/></Panel>}
  {tab==='settings'&&<SettingsV20/>}
 </div>
}
function Kpi({title,value}:{title:string;value:number}){return <div className="stat-card"><span>{title}</span><strong>{value.toLocaleString('id-ID')}</strong></div>}
function Panel({title,children}:{title:string;children:ReactNode}){return <div className="panel"><div className="panel-head"><div><h2>{title}</h2></div></div>{children}</div>}
function Table({rows,cols,action}:{rows:Row[];cols:string[];action?:(r:Row)=>React.ReactNode}){const {t}=useTranslation();return <div className="table-wrap"><table><thead><tr>{cols.map(c=><th key={c}>{c.replaceAll('_',' ').toUpperCase()}</th>)}{action&&<th>{t('action').toUpperCase()}</th>}</tr></thead><tbody>{rows.length?rows.map((r,i)=><tr key={r.id||i}>{cols.map(c=><td key={c}>{c==='score'?String(r[c]??'-'):String(r[c]??'-')}</td>)}{action&&<td>{action(r)}</td>}</tr>):<tr><td colSpan={cols.length+(action?1:0)}>{t('no_data')}</td></tr>}</tbody></table></div>}
function Analytics({employees,roster}:{employees:Row[];roster:Row[]}){const {t}=useTranslation();const dept=useMemo(()=>{const m:Record<string,number>={};employees.filter(e=>e.status_aktif!==false).forEach(e=>{const d=e.departemen||t('without_department');m[d]=(m[d]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1])},[employees]); return <Panel title={t("employee_analytics")}><div className="mini-kpi-row"><div className="stat-card"><span>{t("total_active")}</span><strong>{employees.filter(e=>e.status_aktif!==false).length}</strong></div><div className="stat-card"><span>{t("roster_data")}</span><strong>{roster.length}</strong></div></div><div className="panel"><h3>{t("employees_per_department")}</h3>{dept.map(([d,n])=><div className="metric-row" key={d}><span>{d}</span><b>{n}</b></div>)}</div></Panel>}
function SettingsV20(){const {t}=useTranslation();const [f,setF]=useState({approval_sla_hours:'24',document_expiry_days:'30',attendance_radius_meters:'150',require_selfie:'true',require_gps:'true'}); const save=async()=>{const rows=Object.entries(f).map(([key,value])=>({key,value,updated_at:new Date().toISOString()}));const {error}=await supabase.from('hris_enterprise_settings').upsert(rows,{onConflict:'key'});if(error)await appAlert(error.message);else await appAlert(t('enterprise_settings_saved'))};return <Panel title={t("enterprise_settings")}><div className="form-two">{Object.entries(f).map(([k,v])=><label key={k}>{k.replaceAll('_',' ')}<input value={v} onChange={e=>setF({...f,[k]:e.target.value})}/></label>)}</div><button className="primary" onClick={save}>{t('save_settings')}</button></Panel>}
