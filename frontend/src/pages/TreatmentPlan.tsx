import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Link2, Settings2, Check, RefreshCw, Download, Upload, Trash2, ExternalLink } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'
import { Spinner, Modal } from '../components/ui'
import { useAuthStore } from '../stores/authStore'
import TreatmentViewer from '../components/treatment/TreatmentViewer'
import TreatmentPlanModal from '../components/treatment/TreatmentPlanModal'
import InfoTip from '../components/ui/InfoTip'
import { Panel, Timeline, ChatInput } from '../components/order/Panels'
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
        <thead><tr className="bg-surface-100 text-xs font-semibold text-ink-500 uppercase">{head.map((h,i)=><th key={i} className="text-left px-4 py-2">{h}</th>)}</tr></thead>
        <tbody>{body.map((r,i)=><tr key={i} className="border-t border-surface-100">{r.map((c,j)=><td key={j} className="px-4 py-2 text-ink-700">{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
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
    if (!message.trim()) { toast.error('Tell the lab what to change in the message box'); document.querySelector<HTMLTextAreaElement>('#plan-message-box textarea')?.focus(); return }
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

  const imageGroups: { kind:PlanFileKind; title:string; only?:string[] }[] = [
    { kind:'IMAGE_MOVEMENTS', title:'Image of the table Total Movements' },
    { kind:'IMAGE_REFINEMENT', title:'Refinement images', only:['REFINEMENT','FINAL_REPORT'] },
    { kind:'IMAGE_FINISHED', title:'Finished images', only:['FINAL_REPORT'] },
  ]
  const sharedFiles = [...plan.shared_files, ...filesOf('FILE')]
  const viewerFile = plan.files.find(f => f.kind === 'VIEWER')
  const viewerHref = plan.viewer_type === 'URL' ? plan.viewer_url : viewerFile?.url
  const orderPhotos = (order.files ?? []).filter(f => f.kind === 'photo')
  const planIndex = order.treatment_plans.findIndex(p=>p.id===plan.id) + 1

  // Every panel header can switch plan, as on the reference treatment screen.
  const selector = order.treatment_plans.length > 1 && (
    <select aria-label="Treatment plan" className="input py-1 min-h-0 w-auto text-sm" value={plan.id} onClick={e=>e.stopPropagation()}
      onChange={e=>navigate(`/orders/${orderId}/treatment/${e.target.value}`)}>
      {order.treatment_plans.map(p=><option key={p.id} value={p.id}>{p.name} — {PLAN_STATUS[p.status]?.label ?? p.status}</option>)}
    </select>
  )
  const iconBtn = 'w-9 h-9 flex items-center justify-center rounded-md text-primary-600 hover:bg-primary-50'

  return (
    <div className="space-y-[2rem] animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-secondary btn-sm gap-1.5" onClick={()=>navigate(`/orders/${order.id}`)}><ArrowLeft size={15}/>Back</button>
        <div className="flex-1 min-w-0">
          <h2 className="section-title flex items-center gap-2 flex-wrap">
            {plan.name}
            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', status.className)}>{status.label}</span>
            <span className="badge-blue text-xs">{PLAN_TYPE[plan.type] ?? plan.type}</span>
          </h2>
          <p className="text-muted">Order {order.ref} · {patient} · {order.product?.name ?? '—'}</p>
        </div>
      </div>

      <Panel id="panelMargin1" title={`Treatment Plan ${planIndex}`} actions={<div className="flex items-center gap-1">
        {selector}
        <button type="button" className={iconBtn} title="Copy treatment link" aria-label="Copy treatment link" onClick={copyLink}><Link2 size={18}/></button>
        {viewerHref && <a className={iconBtn} href={viewerHref} target="_blank" rel="noreferrer" title="Open in a new window" aria-label="Open in a new window"><ExternalLink size={18}/></a>}
        {isLab && <button type="button" className={iconBtn} title="Configure" aria-label="Configure" onClick={()=>setConfigOpen(true)}><Settings2 size={18}/></button>}
      </div>}>
        <div className="h-[700px] max-h-[75vh] min-h-[420px] rounded-[0.428rem] overflow-hidden border border-surface-200">
          <TreatmentViewer key={plan.id + (viewerFile?.id ?? '')} plan={plan}/>
        </div>
        {plan.notes && <p className="mt-4 pl-3 border-l-[3px] border-primary-600">{plan.notes}</p>}
      </Panel>

      <Panel id="panelMargin3" title={<>Treatment Plan Files <InfoTip text="Files are shared across all treatment plans."/></>}
        actions={isLab && <UploadButton label="Upload" onFile={f=>doUpload(f, 'FILE', true)} busy={upload.isPending}/>}>
        {sharedFiles.length === 0 ? <p className="text-ink-400">No files yet</p> : (
          <table className="w-full text-sm">
            <thead><tr><th className="text-left px-3 py-2 uppercase">File Name</th><th className="text-left px-3 py-2 uppercase">Size</th><th className="text-left px-3 py-2 uppercase">Date</th><th className="px-3 py-2 uppercase text-right">Actions</th></tr></thead>
            <tbody>{sharedFiles.map(f=>(
              <tr key={f.id} className="table-row">
                <td className="px-3 py-2">{f.file_name}</td><td className="px-3 py-2">{(f.file_size/1e6).toFixed(2)} MB</td><td className="px-3 py-2">{formatDate(f.created_at)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <a href={f.url} target="_blank" rel="noreferrer" className="inline-flex p-1.5 text-primary-600" aria-label={`Download ${f.file_name}`}><Download size={15}/></a>
                  {isLab && <button type="button" className="inline-flex p-1.5 text-red-500" aria-label={`Delete ${f.file_name}`} onClick={()=>removeFile.mutate(f.id)}><Trash2 size={15}/></button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Panel>

      <Panel id="panelMargin2" title="Interproximal Reduction (IPR)" actions={<div className="flex flex-wrap items-center gap-2">
        {selector}
        {isLab && <UploadButton label="Upload your IPR .csv" accept=".csv,text/csv" onFile={f=>doUpload(f, 'IPR')} busy={upload.isPending}/>}
        {isLab && <UploadButton label="Upload your attachments .csv" accept=".csv,text/csv" onFile={f=>doUpload(f, 'ATTACHMENTS')} busy={upload.isPending}/>}
      </div>}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {([['IPR','IPR'],['ATTACHMENTS','Attachments']] as [PlanFileKind,string][]).map(([kind,title])=>(
            <div key={kind}>
              <p className="font-semibold text-ink-900 mb-2">{title}</p>
              {filesOf(kind).length === 0 ? <p className="text-ink-400">Not provided</p> : filesOf(kind).map(f=>(
                <div key={f.id} className="space-y-2">
                  <CsvTable file={f}/>
                  <div className="flex gap-3 text-sm"><a href={f.url} target="_blank" rel="noreferrer">Download {f.file_name}</a>
                    {isLab && <button type="button" className="text-red-500 hover:underline" onClick={()=>removeFile.mutate(f.id)}>Remove</button>}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Panel>

      <Panel id="panelMargin4" title="Images" actions={selector || undefined}>
        <div className="space-y-6">
          {imageGroups.filter(g => !g.only || g.only.includes(plan.type)).map(g=>(
            <div key={g.kind}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-ink-900">{g.title}</p>
                {isLab && <UploadButton label="Upload" accept="image/*" onFile={f=>doUpload(f, g.kind)} busy={upload.isPending}/>}
              </div>
              {filesOf(g.kind).length === 0 ? <p className="text-ink-400">No images</p> : (
                <div className="flex flex-wrap gap-3">{filesOf(g.kind).map(f=>(
                  <div key={f.id} className="relative group">
                    <button type="button" onClick={()=>setLightbox(f)} className="block"><img src={f.url} alt={f.file_name} className="max-h-[500px] max-w-full rounded-md border border-surface-200 object-contain bg-white group-hover:border-primary-400"/></button>
                    {isLab && <button className="absolute top-1.5 right-1.5 hidden group-hover:flex w-7 h-7 items-center justify-center rounded-md bg-white shadow text-red-500" aria-label={`Delete ${f.file_name}`} onClick={()=>removeFile.mutate(f.id)}><Trash2 size={13}/></button>}
                  </div>
                ))}</div>
              )}
            </div>
          ))}
          {orderPhotos.length > 0 && (
            <div>
              <p className="font-semibold text-ink-900 mb-2">Detailed photos of teeth</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {orderPhotos.map(f=>(
                  <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="block">
                    <img src={f.url} alt={f.slot ?? f.file_name} className="h-24 w-full object-cover rounded-md border border-surface-200"/>
                    <p className="text-xs text-center capitalize mt-1">{f.slot === 'ortho' ? 'Orthopantomography' : f.slot}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </Panel>

      <Panel id="panelMargin5" title="Treatment Plan Communication" actions={selector || undefined}>
        <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-5 items-start">
          <div className="card p-[1.5rem] shadow-[0_2px_15px_0_rgba(34,41,47,0.25)] space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Total Aligners', plan.total], ['Upper', plan.aligners_upper], ['Lower', plan.aligners_lower]].map(([l,v])=>(
                <div key={l as string} className="rounded-md bg-surface-50 py-2.5"><p className="text-xl font-semibold text-ink-900">{v}</p><p className="text-xs text-ink-500">{l}</p></div>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between"><span>Treatment Cost</span><span className="text-ink-900">{money(plan.cost)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span className="text-teal-600">{plan.discount ? `-${money(plan.discount)}` : money(0)}</span></div>
              <div className="flex justify-between font-semibold text-ink-900"><span>Total Treatment Cost</span><span>{money(plan.price)}</span></div>
            </div>
            <div id="plan-message-box">
              <ChatInput value={message} onChange={setMessage} busy={decide.isPending || addObs.isPending}
                placeholder={canDecide ? 'Optional when accepting; required to ask for a re-plan' : 'Write a message…'}
                onSend={canDecide ? undefined : ()=>sendMessage(message, ()=>setMessage(''))}>
                {canDecide && <>
                  <button type="button" className="btn btn-sm bg-teal-600 border-teal-600 text-white hover:shadow-[0_8px_25px_-8px_#28c76f] gap-1.5" disabled={decide.isPending}
                    onClick={()=>otherApproved ? setConfirmApprove(true) : approve()}><Check size={14}/>Accept Treatment Plan</button>
                  <button type="button" className="btn btn-sm border-amber-600 text-amber-600 hover:bg-[#ff9f430a] gap-1.5" disabled={decide.isPending} onClick={replan}><RefreshCw size={13}/>Ask for Re-plan</button>
                </>}
              </ChatInput>
            </div>
            {!canDecide && <p className="text-sm text-ink-500">{status.label}{plan.decided_at ? ` on ${formatDate(plan.decided_at)}` : ''}</p>}
          </div>
          <Timeline empty="No messages yet" items={observations.map(o=>({
            id:o.id, title:<>{o.user_name}{o.plan && <span className="text-primary-600 font-normal"> · {o.plan}</span>}</>,
            body:o.message === 'PLAN APPROVED' ? <span className="text-teal-600 font-semibold">PLAN APPROVED</span> : o.message,
            time:o.created_at, color:o.message === 'PLAN APPROVED' ? 'success' : o.user_name === user?.name ? 'primary' : 'warning',
          }))}/>
        </div>
      </Panel>

      <Modal open={confirmApprove} onClose={()=>setConfirmApprove(false)} title="There is already an approved plan" size="sm"
        footer={<><button className="btn-secondary btn-sm" onClick={()=>setConfirmApprove(false)}>No</button><button className="btn-primary btn-sm" onClick={approve}>Yes</button></>}>
        <p>There is already more than one approved plan. Are you sure you want to approve another plan?</p>
      </Modal>
      <Modal open={!!lightbox} onClose={()=>setLightbox(null)} title={lightbox?.file_name} size="xl">
        {lightbox && <img src={lightbox.url} alt={lightbox.file_name} className="w-full h-auto"/>}
      </Modal>
      {configOpen && <TreatmentPlanModal open onClose={()=>setConfigOpen(false)} orderId={order.id} plan={plan}/>}
    </div>
  )
}
