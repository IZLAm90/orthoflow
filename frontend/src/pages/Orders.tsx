import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Download, Eye, Printer, ShoppingCart, List, Search, Check, AlertTriangle, Zap } from 'lucide-react'
import { cn } from '../lib/utils'
import { useOrders } from '../lib/queries/orders'
import { Spinner, EmptyState } from '../components/ui'

const STATUS_STYLE: Record<string,string> = {
  finished: 'bg-teal-50 text-teal-700 border border-teal-200',
  processing: 'bg-primary-50 text-primary-700 border border-primary-200',
  plan_pending: 'bg-amber-50 text-amber-700 border border-amber-200',
}
const STATUS_LABEL: Record<string,string> = {
  finished: 'Finished',
  processing: 'Processing',
  plan_pending: 'Tx. Review',
}

const TREATMENT_PLAN_LABEL: Record<string,string> = { full_arch:'Full Arch', anterior_only:'Anterior Only', '4_4_only':'4 - 4 only', no_6_7:'Dont Move 6 - 7 only' }
const AP_LABEL: Record<string,string> = { maintain:'Maintain', canine_only:'Improve canine only', canine_molar:'Improve canine and molar', both:'Correct both Molar and Canine' }
const OPEN_BITE_LABEL: Record<string,string> = { correct:'Correct', maintain:'Maintain', improved:'Improved' }
const MIDLINE_LABEL: Record<string,string> = { maintain:'Maintain', correct:'Correct' }
const CROSSBITE_LABEL: Record<string,string> = { correct:'Correct', maintain:'Maintain', anterior:'Correct only anterior', posterior:'Correct only posterior' }
const SPACES_LABEL: Record<string,string> = { close_all:'Close all spaces', maintain:'Maintain spaces' }

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({length:5}).map((_,i)=>(
        <svg key={i} className="text-amber-400 w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function ToothIcon() {
  return (
    <svg viewBox="0 0 40 40" className="w-9 h-9">
      <rect x="8" y="6" width="6" height="18" rx="3" fill="#f5f0ea" stroke="#c9b99a" strokeWidth="0.8"/>
      <rect x="17" y="5" width="6" height="20" rx="3" fill="#fde68a" stroke="#f59e0b" strokeWidth="1"/>
      <rect x="26" y="6" width="6" height="18" rx="3" fill="#f5f0ea" stroke="#c9b99a" strokeWidth="0.8"/>
    </svg>
  )
}

const fmtDateTime = (iso?:string|null) => iso ? new Date(iso).toLocaleString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'

// Overdue plan_pending orders (delivery date already passed with no plan approved) surface a warning;
// finished orders get a green check, everything else in flight gets an amber check.
function DeliveryBadge({ status, deliveryOn }: { status:string; deliveryOn?:string|null }) {
  if (!deliveryOn) return null
  const overdue = new Date(deliveryOn).getTime() < Date.now()
  if (status === 'plan_pending' && overdue) return <AlertTriangle size={14} className="text-red-500 inline ml-1.5"/>
  if (status === 'finished') return <Check size={14} className="text-emerald-500 inline ml-1.5"/>
  return <Check size={14} className="text-amber-500 inline ml-1.5"/>
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const { data:orders=[], isLoading } = useOrders()
  const [selected, setSelected] = useState<string|null>(null)
  const [search, setSearch] = useState('')
  const [show, setShow] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedPlans, setExpandedPlans] = useState(true)
  const [expandedObs, setExpandedObs] = useState(true)

  const filtered = orders.filter(o =>
    (statusFilter === 'all' || o.status === statusFilter) &&
    (!search ||
      o.ref.toLowerCase().includes(search.toLowerCase()) ||
      (o.patient && `${o.patient.first_name} ${o.patient.last_name}`.toLowerCase().includes(search.toLowerCase())))
  ).slice(0, show)

  const order = orders.find(o => o.id === selected)

  if (selected && order) {
    const patientName = order.patient?`${order.patient.first_name} ${order.patient.last_name}`:'—'
    return (
      <div className="space-y-4 animate-fade-in">
        <button onClick={()=>setSelected(null)} className="btn-ghost btn-sm">Back to orders</button>
        <div className="flex gap-3">
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl flex-1 border bg-surface-100 text-ink-400 border-surface-200">
            <ShoppingCart size={18}/><div><p className="text-sm font-semibold">Order</p><p className="text-xs opacity-70">Your customized product</p></div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl flex-1 border bg-primary-600 text-white border-primary-600">
            <List size={18}/><div><p className="text-sm font-semibold">Finish</p><p className="text-xs opacity-70">And wait for the delivery</p></div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-bold text-primary-600">Order {STATUS_LABEL[order.status] || order.status} {order.ref} ({patientName})</h2>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm"><Download size={14}/> Invoice</button>
              <button className="btn-secondary btn-sm"><Printer size={14}/> Print</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-2 text-sm">
              <p className="font-bold text-ink-900 text-base">{order.product?.name||'—'}</p>
              <p className="text-ink-500">By <span className="text-primary-600 font-medium">{order.product?.provider||'—'}</span></p>
              <Stars />
              <p className="text-ink-600">{order.product?.description}</p>
              <div className="pt-2 space-y-1">
                <p className="text-ink-700"><span className="font-semibold">Delivery center </span><span className="text-primary-600 font-medium">{order.delivery_center?.name||'—'}</span></p>
                <p className="text-ink-700">Delivery on <span className="text-primary-600 font-semibold">{fmtDateTime(order.delivery_on)}</span></p>
                <p className="text-ink-700">Order by <span className="text-primary-600 font-semibold">{order.doctor?.name||'—'}</span> for patient <span className="font-semibold">{patientName}</span></p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center">
                <svg viewBox="0 0 60 60" className="w-20 h-20">
                  <ellipse cx="30" cy="42" rx="22" ry="8" fill="#e8d5c0" opacity="0.4"/>
                  <rect x="12" y="10" width="10" height="26" rx="5" fill="#f5f0ea" stroke="#c9b99a" strokeWidth="1"/>
                  <rect x="25" y="8" width="10" height="28" rx="5" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5"/>
                  <rect x="38" y="10" width="10" height="26" rx="5" fill="#f5f0ea" stroke="#c9b99a" strokeWidth="1"/>
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-surface-100 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {[
              ['Chief Complain', order.chief_complain],
              ['Treat both arch', order.treat_both_arch?'yes':'no'],
              ['Treatment plan', order.treatment_plan_type?TREATMENT_PLAN_LABEL[order.treatment_plan_type]:'—'],
              ['AP Relationship', order.ap_relationship?AP_LABEL[order.ap_relationship]:'—'],
              ['Anteroposterior relationship', order.anteroposterior],
              ['Elastics', order.elastics],
              ['Open Bite', order.open_bite?OPEN_BITE_LABEL[order.open_bite]:'—'],
              ['Midline', order.midline?MIDLINE_LABEL[order.midline]:'—'],
              ['IPR', order.ipr],
              ['Bite Ramps', order.bite_ramps],
              ['Crossbite', order.crossbite?CROSSBITE_LABEL[order.crossbite]:'—'],
              ['Spaces', order.spaces?SPACES_LABEL[order.spaces]:'—'],
            ].map(([label,value])=>(
              <p key={label as string} className="py-0.5">
                <span className="font-semibold text-ink-800">{label}: </span>
                <span className="text-ink-600">{value||'—'}</span>
              </p>
            ))}
            {order.special_instructions ? (
              <p className="col-span-2 py-0.5">
                <span className="font-semibold text-ink-800">Special Instructions: </span>
                <span className="text-ink-600">{order.special_instructions}</span>
              </p>
            ) : null}
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-surface-100">
            <button className="btn-primary btn-sm" onClick={()=>navigate('/products')}>New Order</button>
            <button className="btn-secondary btn-sm" onClick={()=>setSelected(null)}>View Orders</button>
            <button className="btn-secondary btn-sm"><Eye size={14}/></button>
          </div>
        </div>
        {order.phases.length > 0 && (
          <div className="card p-6">
            <p className="font-semibold text-ink-900 mb-4">Order Timeline</p>
            <div className="space-y-4">
              {order.phases.map((phase,i)=>(
                <div key={phase.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-2.5 h-2.5 rounded-full', i===order.phases.length-1?'bg-primary-600':'bg-teal-500')}/>
                    {i<order.phases.length-1 && <div className="w-px flex-1 bg-surface-200 mt-1"/>}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-ink-900">{phase.title}</p>
                    {phase.details && <p className="text-xs text-ink-500 mt-0.5">{phase.details}</p>}
                    <p className="text-xs text-ink-400 mt-0.5">{fmtDateTime(phase.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="card overflow-hidden">
          <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-50" onClick={()=>setExpandedPlans(!expandedPlans)}>
            <p className="font-semibold text-ink-900">Treatment Plans</p>
            <span className="text-ink-400">{expandedPlans ? '▲' : '▼'}</span>
          </button>
          {expandedPlans && (
            <div className="border-t border-surface-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 text-xs font-medium text-ink-400 uppercase">
                    <th className="text-left px-5 py-3">Name</th>
                    <th className="text-left px-5 py-3">Created</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Type</th>
                    <th className="text-left px-5 py-3">Aligners</th>
                    <th className="text-left px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {order.treatment_plans.length===0 && <tr><td colSpan={6} className="text-center text-sm text-ink-400 py-6">No treatment plans yet</td></tr>}
                  {order.treatment_plans.map((tp)=>(
                    <tr key={tp.id} className="table-row">
                      <td className="px-5 py-3 text-primary-600 font-semibold text-sm">{tp.name}</td>
                      <td className="px-5 py-3 text-sm text-ink-600">{fmtDateTime(tp.created_at)}</td>
                      <td className="px-5 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">{tp.status}</span></td>
                      <td className="px-5 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">{tp.type}</span></td>
                      <td className="px-5 py-3 text-sm text-ink-700">Total: {tp.total} | Issued: {tp.issued}</td>
                      <td className="px-5 py-3"><button className="btn-secondary btn-sm"><Eye size={13}/> View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-surface-100 flex items-center justify-between">
                <p className="text-xs text-ink-400">{order.treatment_plans.length} Total</p>
                <button className="px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold">Finish plan</button>
              </div>
            </div>
          )}
        </div>
        <div className="card overflow-hidden">
          <button className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-50" onClick={()=>setExpandedObs(!expandedObs)}>
            <p className="font-semibold text-ink-900">Treatment Plan Observations</p>
            <span className="text-ink-400">{expandedObs ? '▲' : '▼'}</span>
          </button>
          {expandedObs && (
            <div className="border-t border-surface-200 divide-y divide-surface-100">
              {order.observations.length===0 && <p className="text-center text-sm text-ink-400 py-6">No observations yet</p>}
              {order.observations.map((obs)=>(
                <div key={obs.id} className="px-6 py-4 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-700">
                    {obs.user_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-ink-900">{obs.user_name}</p>
                      <p className="text-xs text-ink-400">{fmtDateTime(obs.created_at)}</p>
                    </div>
                    <p className="text-xs font-semibold mb-1">
                      <span className="text-primary-600">{obs.plan}</span>
                      {obs.message === 'PLAN APPROVED' ? (
                        <span className="text-teal-600"> &gt; PLAN APPROVED</span>
                      ) : null}
                    </p>
                    {obs.message !== 'PLAN APPROVED' ? (
                      <p className="text-sm text-ink-600 leading-relaxed">{obs.message}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Orders</h2><p className="text-muted">{orders.length} Total</p></div>
        <button className="btn-primary btn-sm" onClick={()=>navigate('/products')}>New Order</button>
      </div>
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-600 font-medium">Show</span>
            <select className="input py-1.5 text-sm w-20" value={show} onChange={e=>setShow(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-600 font-medium">Status</span>
            <select className="input py-1.5 text-sm w-36" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="plan_pending">Tx. Review</option>
              <option value="processing">Processing</option>
              <option value="finished">Finished</option>
            </select>
          </div>
          <div className="flex gap-2 ml-auto">
            <button className="btn-secondary btn-sm"><Eye size={13}/> View</button>
            <button className="btn-secondary btn-sm"><Download size={13}/> Excel</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-600 font-medium whitespace-nowrap">Universal Search</span>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/>
            <input className="input pl-8 py-1.5 text-sm" placeholder="Search by patient name, ref, product..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
      </div>
      <div className="card overflow-hidden">
        {isLoading?<div className="flex justify-center py-16"><Spinner/></div>:filtered.length===0?(
          <EmptyState title="No orders yet" description="Place your first order from the Products page." action={<button className="btn-primary btn-sm" onClick={()=>navigate('/products')}>New Order</button>}/>
        ):(
        <table className="w-full">
          <thead>
            <tr className="bg-surface-50 text-xs font-medium text-ink-400 uppercase tracking-wide">
              <th className="w-8 px-3 py-3"/>
              <th className="text-left px-4 py-3">Ref.</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Requested</th>
              <th className="text-left px-4 py-3">Patient</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Delivery On</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o=>{
              const name = o.patient?`${o.patient.first_name} ${o.patient.last_name}`:'—'
              return (
              <tr key={o.id} className="table-row cursor-pointer" onClick={()=>setSelected(o.id)}>
                <td className="px-3 py-3 text-ink-400"><ChevronRight size={16}/></td>
                <td className="px-4 py-3 text-primary-600 font-bold text-sm">
                  {o.ref}
                  {o.urgent && <span title="Urgent" className="inline-flex items-center ml-1.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-600"><Zap size={11}/></span>}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', STATUS_STYLE[o.status] || STATUS_STYLE.plan_pending)}>
                    {STATUS_LABEL[o.status] || o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-ink-600">{fmtDateTime(o.requested_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                      <ToothIcon />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{name}</p>
                      <p className="text-xs text-ink-400">@ {o.product?.name||'—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-ink-900">{o.total.toFixed(2)} {o.currency}</td>
                <td className="px-4 py-3 text-sm text-ink-600">{fmtDateTime(o.delivery_on)}<DeliveryBadge status={o.status} deliveryOn={o.delivery_on}/></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="text-ink-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50" onClick={e=>{e.stopPropagation();setSelected(o.id)}}><Download size={15}/></button>
                    <button className="text-ink-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50" onClick={e=>{e.stopPropagation();setSelected(o.id)}}><Eye size={15}/></button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
        )}
        <div className="px-5 py-3 border-t border-surface-100 flex items-center justify-between">
          <p className="text-sm text-ink-500">{orders.length} Total</p>
        </div>
      </div>
    </div>
  )
}
