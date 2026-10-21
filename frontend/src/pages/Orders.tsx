import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, Download, Eye, Search, Check, AlertTriangle, Zap } from 'lucide-react'
import { cn, downloadCsv } from '../lib/utils'
import { useOrders } from '../lib/queries/orders'
import { useUIStore } from '../stores/uiStore'
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
  const location = useLocation()
  const { setNewOrderOpen } = useUIStore()
  const exportOrders = () => downloadCsv(`orders-${new Date().toISOString().slice(0,10)}.csv`, [
    ['Reference','Status','Patient','Product','Doctor','Delivery center','Requested','Delivery on','Urgent','Total','Currency'],
    ...filtered.map(o=>[o.ref, STATUS_LABEL[o.status]||o.status, o.patient?`${o.patient.first_name} ${o.patient.last_name}`:'', o.product?.name, o.doctor?.name,
      o.delivery_center?.name, o.requested_at?.slice(0,10), o.delivery_on?.slice(0,10), o.urgent?'yes':'no', o.total.toFixed(2), o.currency]),
  ])
  const { data:orders=[], isLoading } = useOrders()
  // OrderForm hands over the order it just placed so we open straight onto it.
  // Older links handed the order over in router state; the detail now has its own URL.
  const handedOver = (location.state as { orderId?:string }|null)?.orderId
  useEffect(() => { if (handedOver) navigate(`/orders/${handedOver}`, { replace:true }) }, [handedOver, navigate])
  const [search, setSearch] = useState('')
  const [show, setShow] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = orders.filter(o =>
    (statusFilter === 'all' || o.status === statusFilter) &&
    (!search ||
      o.ref.toLowerCase().includes(search.toLowerCase()) ||
      (o.patient && `${o.patient.first_name} ${o.patient.last_name}`.toLowerCase().includes(search.toLowerCase())))
  ).slice(0, show)


  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Orders</h2><p className="text-muted">{orders.length} Total</p></div>
        <button className="btn-primary btn-sm" onClick={()=>setNewOrderOpen(true)}>New Order</button>
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
            <button className="btn-secondary btn-sm" onClick={exportOrders} disabled={filtered.length===0}><Download size={13}/> Excel</button>
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
          <EmptyState title="No orders yet" description="Place your first order from the Products page." action={<button className="btn-primary btn-sm" onClick={()=>setNewOrderOpen(true)}>New Order</button>}/>
        ):(
        <table className="w-full">
          <thead>
            <tr className="bg-surface-100 text-xs font-medium text-ink-400 uppercase tracking-wide">
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
              <tr key={o.id} className="table-row cursor-pointer" onClick={()=>navigate(`/orders/${o.id}`)}>
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
                    <button className="text-ink-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50" onClick={e=>{e.stopPropagation();navigate(`/orders/${o.id}`)}}><Download size={15}/></button>
                    <button className="text-ink-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50" onClick={e=>{e.stopPropagation();navigate(`/orders/${o.id}`)}}><Eye size={15}/></button>
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
