import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, Pencil, Trash2, Minus, Plus, Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Modal } from '../ui'
import { useAuthStore } from '../../stores/authStore'
import type { Order, TreatmentPlan } from '../../lib/queries/orders'
import { useUpdateOrder } from '../../lib/queries/orders'
import { PLAN_STATUS, PLAN_TYPE, useDeleteTreatmentPlan, useUpdateTreatmentPlan, useRequestPlan } from '../../lib/queries/treatmentPlans'
import TreatmentPlanModal from './TreatmentPlanModal'

const STATUSES = ['PENDING','APPROVED','REJECTED','FINISHED','REQUESTED']
const fmt = (iso:string) => new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' })

// Reference: app-treatment-plans-table — name (lab can rename), created,
// status badge (lab can change it), type, aligners, actions; footer with
// Finish plan and the refinements counter / Request refinement.
export default function TreatmentPlansTable({ order }: { order: Order }) {
  const navigate = useNavigate()
  const user = useAuthStore(s=>s.user)
  const isLab = user?.role === 'admin'
  const update = useUpdateTreatmentPlan(), remove = useDeleteTreatmentPlan(), request = useRequestPlan(), updateOrder = useUpdateOrder()
  const [editing, setEditing] = useState<{ id:string; field:'name'|'status'; value:string }|null>(null)
  const [configure, setConfigure] = useState<TreatmentPlan|null|undefined>(undefined)
  const [deleting, setDeleting] = useState<TreatmentPlan|null>(null)
  const [action, setAction] = useState<'REFINEMENT'|'FINAL_REPORT'|null>(null)
  const [message, setMessage] = useState('')
  const plans = order.treatment_plans
  const available = (order.refinements_total ?? 0) - (order.refinements_used ?? 0)
  const hasApproved = plans.some(p => p.status === 'APPROVED')
  const hasFinalReport = plans.some(p => p.type === 'FINAL_REPORT')

  const save = async (plan:TreatmentPlan, field:'name'|'status', value:string) => {
    setEditing(null)
    if (!value.trim() || value === plan[field]) return
    try { await update.mutateAsync({ id: plan.id, [field]: value }) } catch { toast.error('Could not update the plan') }
  }
  const submitAction = async () => {
    if (!action) return
    try {
      await request.mutateAsync({ orderId: order.id, type: action, message: message.trim() || undefined, user_name: user?.name })
      toast.success(action === 'REFINEMENT' ? 'Refinement requested' : 'Final report requested')
      setAction(null); setMessage('')
    } catch (e) { toast.error((e as { response?:{ data?:{ detail?:string } } }).response?.data?.detail ?? 'Could not send the request') }
  }
  const adjust = (delta:number) => updateOrder.mutate({ id: order.id, refinements_total: Math.max(order.refinements_used ?? 0, (order.refinements_total ?? 0) + delta) })

  return (
    <div>
      <div className="flex justify-end mb-3 gap-2 print:hidden">
        {isLab && <button type="button" className="btn-primary btn-sm" onClick={()=>setConfigure(null)}>{plans.length ? 'Add Treatment Plan' : 'Create Treatment Plan'}</button>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr>{['Name','Created','Status','Type','Aligners','Actions'].map(h=><th key={h} className="text-left px-3 py-3 uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {plans.length === 0 && <tr><td colSpan={6} className="text-center text-ink-400 py-6">No treatment plans yet</td></tr>}
            {plans.map(p => {
              const st = PLAN_STATUS[p.status] ?? { label:p.status, className:'bg-surface-100 text-ink-600' }
              return (
                <tr key={p.id} className="table-row">
                  <td className="px-3 py-3 whitespace-nowrap">
                    {editing?.id===p.id && editing.field==='name' ? (
                      <input autoFocus className="input py-1 min-h-0" value={editing.value} onChange={e=>setEditing({ ...editing, value:e.target.value })}
                        onBlur={()=>save(p,'name',editing.value)} onKeyDown={e=>{ if (e.key==='Enter') save(p,'name',editing.value); if (e.key==='Escape') setEditing(null) }}/>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <button type="button" className="text-primary-600 font-semibold hover:underline" onClick={()=>navigate(`/orders/${order.id}/treatment/${p.id}`)}>{p.name}</button>
                        {isLab && <button type="button" aria-label={`Rename ${p.name}`} className="text-ink-400 hover:text-primary-600" onClick={()=>setEditing({ id:p.id, field:'name', value:p.name })}><Pencil size={13}/></button>}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{fmt(p.created_at)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {editing?.id===p.id && editing.field==='status' ? (
                      <select autoFocus aria-label="Plan status" className="input py-1 min-h-0 w-44" value={editing.value}
                        onChange={e=>save(p,'status',e.target.value)} onBlur={()=>setEditing(null)}>
                        {STATUSES.map(s=><option key={s} value={s}>{PLAN_STATUS[s]?.label ?? s}</option>)}
                      </select>
                    ) : (
                      <button type="button" disabled={!isLab} title={isLab ? 'Change status' : undefined} onClick={()=>setEditing({ id:p.id, field:'status', value:p.status })}
                        className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', st.className, isLab && 'cursor-pointer')}>{st.label}</button>
                    )}
                  </td>
                  <td className="px-3 py-3"><span className="badge-blue">{PLAN_TYPE[p.type] ?? p.type}</span></td>
                  <td className="px-3 py-3 whitespace-nowrap"><strong className="text-ink-900">{p.total}</strong> <span className="text-ink-400">({p.aligners_upper}/{p.aligners_lower})</span></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button type="button" title="Review Treatment" aria-label={`Review ${p.name}`} className="btn btn-sm border-teal-600 text-teal-600 hover:bg-[#28c76f0a] px-2" onClick={()=>navigate(`/orders/${order.id}/treatment/${p.id}`)}><Eye size={14}/></button>
                      {isLab && p.type !== 'FINAL_REPORT' && <button type="button" title="Configure" aria-label={`Configure ${p.name}`} className="btn btn-sm border-teal-600 text-teal-600 hover:bg-[#28c76f0a] px-2" onClick={()=>setConfigure(p)}><Pencil size={14}/></button>}
                      {isLab && <button type="button" title="Delete" aria-label={`Delete ${p.name}`} className="btn btn-sm border-red-500 text-red-500 hover:bg-[#ea54550a] px-2" onClick={()=>setDeleting(p)}><Trash2 size={14}/></button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-200 print:hidden">
        <p className="text-ink-500">Total: {plans.length}</p>
        <div className="flex flex-wrap items-center gap-2">
          {hasApproved && !hasFinalReport && <button type="button" className="btn btn-sm bg-teal-600 border-teal-600 text-white hover:shadow-[0_8px_25px_-8px_#28c76f]" onClick={()=>setAction('FINAL_REPORT')}><Check size={14}/>Finish plan</button>}
          {hasApproved && (
            <div className="flex items-center gap-1">
              {isLab && <button type="button" aria-label="Remove 1 refinement" title="Remove 1 refinement" className="btn-secondary btn-sm px-2" onClick={()=>adjust(-1)}><Minus size={13}/></button>}
              <button type="button" className="btn-primary btn-sm" disabled={available <= 0} onClick={()=>setAction('REFINEMENT')}>Request refinement ({Math.max(0, available)} available)</button>
              {isLab && <button type="button" aria-label="Add 1 refinement" title="Add 1 refinement" className="btn-secondary btn-sm px-2" onClick={()=>adjust(1)}><Plus size={13}/></button>}
            </div>
          )}
        </div>
      </div>

      {configure !== undefined && <TreatmentPlanModal open orderId={order.id} plan={configure} onClose={()=>setConfigure(undefined)}
        onSaved={id=>{ if (configure === null) navigate(`/orders/${order.id}/treatment/${id}`) }}/>}
      <Modal open={!!deleting} onClose={()=>setDeleting(null)} title={`Do you want to delete '${deleting?.name}'?`} size="sm"
        footer={<><button className="btn-secondary btn-sm" onClick={()=>setDeleting(null)}>Cancel</button>
          <button className="btn-danger btn-sm" onClick={async()=>{ const n = deleting!.name; try { await remove.mutateAsync(deleting!.id); toast.success(`Treatment plan '${n}' deleted successfully.`) } catch { toast.error('Could not delete the plan') } setDeleting(null) }}>Delete</button></>}>
        <p>The treatment plan '{deleting?.name}' and all related files will be permanently deleted. The order status will remain unchanged, regardless of this treatment plan's status. This action cannot be undone.</p>
      </Modal>
      <Modal open={!!action} onClose={()=>setAction(null)} size="md"
        title={action === 'REFINEMENT' ? `Request Refinement ${(order.refinements_used ?? 0) + 1} of ${order.refinements_total ?? 0}` : 'Finish Treatment Plan'}
        footer={<><button className="btn-secondary btn-sm" onClick={()=>setAction(null)}>Cancel</button><button className="btn-primary btn-sm" disabled={request.isPending} onClick={submitAction}>Send</button></>}>
        <label className="label" htmlFor="action-message">Message to the lab</label>
        <textarea id="action-message" className="input min-h-[110px]" value={message} onChange={e=>setMessage(e.target.value)}
          placeholder={action === 'REFINEMENT' ? 'What should the refinement correct?' : 'Anything the lab should know for the final report'}/>
      </Modal>
    </div>
  )
}
