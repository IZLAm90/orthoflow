import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Link2, Settings2, Check, RefreshCw, Download, Upload, Trash2, FileText, Image as ImageIcon, MessageSquare, ChevronDown } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'
import { Spinner, Modal } from '../components/ui'
import { useAuthStore } from '../stores/authStore'
import TreatmentViewer from '../components/treatment/TreatmentViewer'
import TreatmentPlanModal from '../components/treatment/TreatmentPlanModal'
import {
  useTreatmentPlan, useDecidePlan, useUploadPlanFile, useDeletePlanFile, useAddObservation,
  PLAN_STATUS, PLAN_TYPE, type PlanFile, type PlanFileKind,
} from '../lib/queries/treatmentPlans'

const money = (n:number) => `${n.toFixed(2)} €`

function parseCsv(text:string): string[][] {
  const rows: string[][] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const cells: string[] = []; let cur = '', quoted = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (quoted) { if (ch === '"' && line[i+1] === '"') { cur += '"'; i++ } else if (ch === '"') quoted = false; else cur += ch }
      else if (ch === '"') quoted = true
      else if (ch === ',' || ch === ';') { cells.push(cur); cur = '' }
      else cur += ch
    }
    cells.push(cur); rows.push(cells.map(c => c.trim()))
  }
  return rows
}

function CsvTable({ file }: { file:PlanFile }) {
  const [rows, setRows] = useState<string[][]|null>(null)
  useEffect(() => { let alive = true; fetch(file.url).then(r=>r.text()).then(t=>{ if (alive) setRows(parseCsv(t)) }).catch(()=>alive && setRows([])); return () => { alive = false } }, [file.url])
  if (!rows) return <div className="py-6 flex justify-center"><Spinner/></div>
  if (!rows.length) return <p className="text-sm text-ink-400">Empty file</p>
  const [head, ...body] = rows
  return (
    <div className="overflow-x-auto rounded-lg border border-surface-200">
      <table className="w-full text-sm">
        <thead><tr className="bg-surface-50 text-xs font-semibold text-ink-500 uppercase">{head.map((h,i)=><th key={i} className="text-left px-4 py-2">{h}</th>)}</tr></thead>
        <tbody>{body.map((r,i)=><tr key={i} className="border-t border-surface-100">{r.map((c,j)=><td key={j} className="px-4 py-2 text-ink-700">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

// Collapsible panel, as the reference treatment screen stacks its sections.
function Panel({ id, title, icon, children, actions, defaultOpen=true }: { id:string; title:string; icon:React.ReactNode; children:React.ReactNode; actions?:React.ReactNode; defaultOpen?:boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section id={id} className="card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5">
        <button type="button" onClick={()=>setOpen(o=>!o)} className="flex items-center gap-2.5 flex-1 text-left">
          <span className="text-primary-600">{icon}</span>
          <span className="font-semibold text-ink-900">{title}</span>
          <ChevronDown size={16} className={cn('text-ink-400 transition-transform', open && 'rotate-180')}/>
        </button>
        {actions}
      </div>
      {open && <div className="px-5 pb-5 border-t border-surface-100 pt-4">{children}</div>}
    </section>
  )
}

function UploadButton({ label, accept, onFile, busy }: { label:string; accept?:string; onFile:(f:File)=>void; busy?:boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  return <>
    <button type="button" className="btn-secondary btn-sm gap-1.5" disabled={busy} onClick={()=>ref.current?.click()}><Upload size={13}/>{label}</button>
    <input ref={ref} type="file" accept={accept} className="hidden" onChange={e=>{ const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}/>
  </>
}

export default function TreatmentPlanPage() {
  const { orderId, planId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data:plan, isLoading, isError } = useTreatmentPlan(planId)
  const decide = useDecidePlan(), upload = useUploadPlanFile(), removeFile = useDeletePlanFile(), addObs = useAddObservation()
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState('')
  const [configOpen, setConfigOpen] = useState(false)
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [lightbox, setLightbox] = useState<PlanFile|null>(null)
  const isLab = user?.role === 'admin'

  const filesOf = (kind:PlanFileKind) => plan?.files.filter(f=>f.kind===kind) ?? []
  const observations = useMemo(() => (plan?.order.observations ?? []).filter(o => !o.plan || o.plan === plan?.name), [plan])

  if (isLoading) return <div className="flex justify-center py-24"><Spinner/></div>
  if (isError || !plan) return <div className="card p-10 text-center text-ink-500">Treatment plan not found. <button className="text-primary-600 underline" onClick={()=>navigate('/orders')}>Back to orders</button></div>

  const order = plan.order
  const patient = order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : '—'
  const status = PLAN_STATUS[plan.status] ?? { label: plan.status, className:'bg-surface-100 text-ink-600' }
  const otherApproved = order.treatment_plans.some(p => p.id !== plan.id && p.status === 'APPROVED')
  const canDecide = plan.status === 'PENDING' || plan.status === 'REJECTED'

  const doUpload = async (file:File, kind:PlanFileKind, shared=false) => {
    try { await upload.mutateAsync({ planId: plan.id, file, kind, shared }); toast.success(`${file.name} uploaded`) }
    catch { toast.error(`Could not upload ${file.name}`) }
  }
  const approve = async () => {
    setConfirmApprove(false)
    try { await decide.mutateAsync({ id: plan.id, decision:'approve', message: message.trim() || undefined, user_name: user?.name }); setMessage(''); toast.success('Treatment plan approved!') }
    catch { toast.error('Could not approve the plan') }
  }
  const replan = async () => {
    if (!message.trim()) { toast.error('Tell the lab what to change in the message box'); document.getElementById('plan-message')?.focus(); return }
    try { await decide.mutateAsync({ id: plan.id, decision:'replan', message: message.trim(), user_name: user?.name }); setMessage(''); toast.success('Replan request submitted successfully!') }
    catch { toast.error('Could not send the re-plan request') }
  }
  const sendMessage = async (text:string, clear:()=>void) => {
    if (!text.trim()) return
    try { await addObs.mutateAsync({ orderId: order.id, user_name: user?.name ?? 'User', plan: plan.name, message: text.trim() }); clear() }
    catch { toast.error('Could not send the message') }
  }
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success('Treatment link copied') }
    catch { toast.error('Could not copy the link') }
  }

  const imageGroups: { kind:PlanFileKind; title:string }[] = [
    { kind:'IMAGE_MOVEMENTS', title:'Image of the table Total Movements' },
    { kind:'IMAGE_REFINEMENT', title:'Refinement images' },
    { kind:'IMAGE_FINISHED', title:'Finished images' },
  ]
  const sharedFiles = [...plan.shared_files, ...filesOf('FILE')]

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-ghost btn-sm gap-1.5" onClick={()=>navigate('/orders', { state:{ orderId: order.id } })}><ArrowLeft size={15}/>Back</button>
        <div className="flex-1 min-w-0">
          <h2 className="section-title flex items-center gap-2 flex-wrap">
            {plan.name}
            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', status.className)}>{status.label}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">{PLAN_TYPE[plan.type] ?? plan.type}</span>
          </h2>
          <p className="text-muted">Order {order.ref} · {patient} · {order.product?.name ?? '—'}</p>
        </div>
        {order.treatment_plans.length > 1 && (
          <select aria-label="Treatment plan" className="input py-1.5 text-sm w-56" value={plan.id} onChange={e=>navigate(`/orders/${orderId}/treatment/${e.target.value}`)}>
            {order.treatment_plans.map(p=><option key={p.id} value={p.id}>{p.name} — {PLAN_STATUS[p.status]?.label ?? p.status}</option>)}
          </select>
        )}
        <button className="btn-secondary btn-sm gap-1.5" onClick={copyLink}><Link2 size={14}/>Copy treatment link</button>
        {isLab && <button className="btn-secondary btn-sm gap-1.5" onClick={()=>setConfigOpen(true)}><Settings2 size={14}/>Configure</button>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Viewer */}
        <div className="xl:col-span-2 card p-2 h-[62vh] min-h-[420px]">
          <TreatmentViewer key={plan.id + (plan.files.find(f=>f.kind==='VIEWER')?.id ?? '')} plan={plan}/>
        </div>

        {/* Summary + decision */}
        <div className="card p-5 space-y-4 self-start">
          <p className="font-semibold text-ink-900">Treatment Plan {order.treatment_plans.findIndex(p=>p.id===plan.id) + 1}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['Upper', plan.aligners_upper], ['Lower', plan.aligners_lower], ['Total Aligners', plan.total]].map(([l,v])=>(
              <div key={l as string} className="rounded-lg bg-surface-50 border border-surface-200 py-2.5">
                <p className="text-xl font-bold text-ink-900">{v}</p><p className="text-[11px] text-ink-500">{l}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-ink-600">Treatment Cost</span><span className="font-medium">{money(plan.cost)}</span></div>
            <div className="flex justify-between"><span className="text-ink-600">Discount</span><span className="font-medium text-teal-600">{plan.discount ? `-${money(plan.discount)}` : money(0)}</span></div>
            <div className="divider"/>
            <div className="flex justify-between text-base font-bold text-ink-900"><span>Total Treatment Cost</span><span>{money(plan.price)}</span></div>
          </div>
          {plan.notes && <p className="text-sm text-ink-600 bg-primary-50/60 rounded-lg p-3 border-l-4 border-primary-400">{plan.notes}</p>}

          <div>
            <label className="label" htmlFor="plan-message">Message to the lab</label>
            <textarea id="plan-message" className="input min-h-[80px]" placeholder={canDecide ? 'Optional when accepting; required to ask for a re-plan' : 'Write a message…'} value={message} onChange={e=>setMessage(e.target.value)}/>
          </div>
          {canDecide ? (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-primary justify-center gap-1.5" disabled={decide.isPending} onClick={()=>otherApproved ? setConfirmApprove(true) : approve()}><Check size={15}/>Accept Treatment Plan</button>
              <button className="btn-secondary justify-center gap-1.5" disabled={decide.isPending} onClick={replan}><RefreshCw size={14}/>Ask for Re-plan</button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-ink-500">{status.label}{plan.decided_at ? ` on ${formatDate(plan.decided_at)}` : ''}</p>
              <button className="btn-secondary btn-sm gap-1.5" disabled={!message.trim() || addObs.isPending} onClick={()=>sendMessage(message, ()=>setMessage(''))}><MessageSquare size={13}/>Send</button>
            </div>
          )}
        </div>
      </div>

      {/* Treatment Plan Files */}
      <Panel id="panelFiles" title="Treatment Plan Files" icon={<FileText size={16}/>}
        actions={isLab && <UploadButton label="Upload" onFile={f=>doUpload(f, 'FILE', true)} busy={upload.isPending}/>}>
        <p className="text-xs text-ink-400 mb-3">Files are shared across all treatment plans.</p>
        {sharedFiles.length === 0 ? <p className="text-sm text-ink-400">No files yet</p> : (
          <div className="space-y-2">{sharedFiles.map(f=>(
            <div key={f.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-200">
              <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center text-[10px] font-mono font-bold text-primary-700 uppercase">{f.file_name.split('.').pop()}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink-900 truncate">{f.file_name}</p><p className="text-xs text-ink-400">{(f.file_size/1e6).toFixed(2)} MB · {formatDate(f.created_at)}</p></div>
              <a href={f.url} target="_blank" rel="noreferrer" className="btn-ghost p-2 rounded-lg" title="Download"><Download size={15}/></a>
              {isLab && <button className="btn-ghost p-2 rounded-lg text-red-500" title="Delete" onClick={()=>removeFile.mutate(f.id)}><Trash2 size={15}/></button>}
            </div>
          ))}</div>
        )}
      </Panel>

      {/* IPR + attachments */}
      <Panel id="panelIpr" title="Interproximal Reduction (IPR)" icon={<FileText size={16}/>}
        actions={isLab && <div className="flex gap-2">
          <UploadButton label="Upload your IPR .csv" accept=".csv,text/csv" onFile={f=>doUpload(f, 'IPR')} busy={upload.isPending}/>
          <UploadButton label="Upload your attachments .csv" accept=".csv,text/csv" onFile={f=>doUpload(f, 'ATTACHMENTS')} busy={upload.isPending}/>
        </div>}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {([['IPR','IPR'],['ATTACHMENTS','Attachments']] as [PlanFileKind,string][]).map(([kind,title])=>(
            <div key={kind}>
              <p className="text-sm font-semibold text-ink-800 mb-2">{title}</p>
              {filesOf(kind).length === 0 ? <p className="text-sm text-ink-400">Not provided</p> : filesOf(kind).map(f=>(
                <div key={f.id} className="space-y-2">
                  <CsvTable file={f}/>
                  <div className="flex gap-3 text-xs"><a className="text-primary-600 hover:underline" href={f.url} target="_blank" rel="noreferrer">Download {f.file_name}</a>
                    {isLab && <button className="text-red-500 hover:underline" onClick={()=>removeFile.mutate(f.id)}>Remove</button>}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Panel>

      {/* Images */}
      <Panel id="panelImages" title="Images" icon={<ImageIcon size={16}/>}>
        <div className="space-y-5">
          {imageGroups.map(g=>(
            <div key={g.kind}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-ink-800">{g.title}</p>
                {isLab && <UploadButton label="Upload" accept="image/*" onFile={f=>doUpload(f, g.kind)} busy={upload.isPending}/>}
              </div>
              {filesOf(g.kind).length === 0 ? <p className="text-sm text-ink-400">No images</p> : (
                <div className="flex flex-wrap gap-3">{filesOf(g.kind).map(f=>(
                  <div key={f.id} className="relative group">
                    <button type="button" onClick={()=>setLightbox(f)} className="block"><img src={f.url} alt={f.file_name} className="h-40 max-w-full rounded-lg border border-surface-200 object-contain bg-white group-hover:border-primary-400"/></button>
                    {isLab && <button className="absolute top-1.5 right-1.5 hidden group-hover:flex w-7 h-7 items-center justify-center rounded-md bg-white shadow text-red-500" title="Delete" onClick={()=>removeFile.mutate(f.id)}><Trash2 size={13}/></button>}
                  </div>
                ))}</div>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* Communication */}
      <Panel id="panelTimeline" title="Treatment Plan Communication" icon={<MessageSquare size={16}/>}>
        {observations.length === 0 ? <p className="text-sm text-ink-400 mb-3">No messages yet</p> : (
          <div className="divide-y divide-surface-100 mb-4">{observations.map(o=>(
            <div key={o.id} className="py-3 flex gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-700">{o.user_name.charAt(0)}</div>
              <div className="flex-1">
                <div className="flex justify-between"><p className="text-sm font-semibold text-ink-900">{o.user_name}</p><p className="text-xs text-ink-400">{formatDate(o.created_at, { hour:'2-digit', minute:'2-digit' })}</p></div>
                {o.plan && <p className="text-xs font-semibold text-primary-600">{o.plan}{o.message==='PLAN APPROVED' && <span className="text-teal-600"> &gt; PLAN APPROVED</span>}</p>}
                {o.message !== 'PLAN APPROVED' && <p className="text-sm text-ink-600 whitespace-pre-line">{o.message}</p>}
              </div>
            </div>
          ))}</div>
        )}
        <div className="flex gap-2">
          <input className="input" placeholder="Write a message…" value={chat} onChange={e=>setChat(e.target.value)} onKeyDown={e=>{ if (e.key==='Enter') sendMessage(chat, ()=>setChat('')) }}/>
          <button className="btn-primary btn-sm" disabled={!chat.trim() || addObs.isPending} onClick={()=>sendMessage(chat, ()=>setChat(''))}>Send</button>
        </div>
      </Panel>

      <Modal open={confirmApprove} onClose={()=>setConfirmApprove(false)} title="There is already an approved plan" size="sm"
        footer={<><button className="btn-secondary btn-sm" onClick={()=>setConfirmApprove(false)}>No</button><button className="btn-primary btn-sm" onClick={approve}>Yes</button></>}>
        <p className="text-sm text-ink-600">There is already more than one approved plan. Are you sure you want to approve another plan?</p>
      </Modal>
      <Modal open={!!lightbox} onClose={()=>setLightbox(null)} title={lightbox?.file_name} size="xl">
        {lightbox && <img src={lightbox.url} alt={lightbox.file_name} className="w-full h-auto"/>}
      </Modal>
      {configOpen && <TreatmentPlanModal open onClose={()=>setConfigOpen(false)} orderId={order.id} plan={plan}/>}
    </div>
  )
}
