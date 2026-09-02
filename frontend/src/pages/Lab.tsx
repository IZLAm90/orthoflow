import { Package,Truck,CheckCircle,Clock,AlertCircle } from 'lucide-react'
import { Badge,Spinner,EmptyState } from '../components/ui'
import { formatDate } from '../lib/utils'
import { useLabOrders } from '../lib/queries/labOrders'

const SM:Record<string,any>={
  pending:{label:'Pending',variant:'gray',icon:Clock},
  in_production:{label:'In production',variant:'blue',icon:Package},
  shipped:{label:'Shipped',variant:'amber',icon:Truck},
  delivered:{label:'Delivered',variant:'green',icon:CheckCircle},
  revision_needed:{label:'Revision needed',variant:'red',icon:AlertCircle},
}

export default function LabPage(){
  const { data:orders=[], isLoading } = useLabOrders()
  const countBy = (status:string) => orders.filter(o=>o.status===status).length
  return <div className="space-y-4 animate-fade-in">
    <div><h2 className="section-title">Lab orders</h2><p className="text-muted">{orders.length} orders total</p></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        {label:'Pending',value:countBy('pending'),color:'text-primary-600 bg-primary-50',icon:Clock},
        {label:'Shipped',value:countBy('shipped'),color:'text-amber-600 bg-amber-50',icon:Truck},
        {label:'Delivered',value:countBy('delivered'),color:'text-teal-600 bg-teal-50',icon:CheckCircle},
        {label:'Revisions',value:countBy('revision_needed'),color:'text-red-600 bg-red-50',icon:AlertCircle},
      ].map(({label,value,color,icon:Icon})=>(
        <div key={label} className="card p-4 flex items-center gap-3">
          <div className={`p-2 rounded-xl ${color}`}><Icon size={18}/></div>
          <div><p className="text-xl font-bold text-ink-900">{value}</p><p className="text-xs text-ink-500">{label}</p></div>
        </div>
      ))}
    </div>
    <div className="card overflow-hidden">
      {isLoading?<div className="flex justify-center py-16"><Spinner/></div>:orders.length===0?(
        <EmptyState title="No lab orders yet"/>
      ):(
      <table className="w-full">
        <thead>
          <tr className="bg-surface-50 text-xs font-medium text-ink-400 uppercase tracking-wide">
            <th className="text-left px-5 py-3">Order ID</th>
            <th className="text-left px-5 py-3">Patient</th>
            <th className="text-left px-5 py-3">Lab</th>
            <th className="text-left px-5 py-3">Status</th>
            <th className="text-left px-5 py-3">Ordered</th>
            <th className="text-left px-5 py-3">ETA</th>
            <th className="text-left px-5 py-3">Stages</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o=>{
            const s=SM[o.status]
            const name = o.patient?`${o.patient.first_name} ${o.patient.last_name}`:'—'
            return <tr key={o.id} className="table-row">
              <td className="px-5 py-3 font-mono text-sm text-primary-700 font-semibold">{o.ref}</td>
              <td className="px-5 py-3">
                <p className="text-sm font-medium text-ink-900">{name}</p>
                <p className="text-xs text-ink-400 font-mono">{o.case_number}</p>
              </td>
              <td className="px-5 py-3 text-sm text-ink-700">{o.lab||'—'}</td>
              <td className="px-5 py-3"><Badge variant={s.variant} dot>{s.label}</Badge></td>
              <td className="px-5 py-3 text-sm text-ink-600">{formatDate(o.ordered_at)}</td>
              <td className="px-5 py-3 text-sm text-ink-600">{o.eta?formatDate(o.eta):'—'}</td>
              <td className="px-5 py-3 text-sm font-semibold text-ink-900">{o.stages}</td>
            </tr>
          })}
        </tbody>
      </table>
      )}
    </div>
  </div>
}
