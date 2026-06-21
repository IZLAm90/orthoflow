import { Package,Truck,CheckCircle,Clock,AlertCircle } from 'lucide-react'
import { Badge } from '../components/ui'
import { formatDate } from '../lib/utils'

const ORDERS=[
  {id:'LOD-2026-091',caseNumber:'OC-2026-0041',patient:'Sarah Mitchell',lab:'AlignTech Labs',status:'in_production',ordered:'2026-06-18',eta:'2026-07-02',stages:28},
  {id:'LOD-2026-090',caseNumber:'OC-2026-0040',patient:'James Okonkwo',lab:'SmileFab Co.',status:'pending',ordered:'2026-06-17',eta:'2026-07-05',stages:22},
  {id:'LOD-2026-089',caseNumber:'OC-2026-0038',patient:'David Park',lab:'AlignTech Labs',status:'shipped',ordered:'2026-06-10',eta:'2026-06-22',stages:34},
  {id:'LOD-2026-088',caseNumber:'OC-2026-0036',patient:'Marcus Webb',lab:'DentalFab Pro',status:'delivered',ordered:'2026-06-01',eta:'2026-06-14',stages:18},
  {id:'LOD-2026-087',caseNumber:'OC-2026-0035',patient:'Yuki Tanaka',lab:'SmileFab Co.',status:'revision_needed',ordered:'2026-05-28',eta:'2026-06-11',stages:26},
]
const SM:Record<string,any>={
  pending:{label:'Pending',variant:'gray',icon:Clock},
  in_production:{label:'In production',variant:'blue',icon:Package},
  shipped:{label:'Shipped',variant:'amber',icon:Truck},
  delivered:{label:'Delivered',variant:'green',icon:CheckCircle},
  revision_needed:{label:'Revision needed',variant:'red',icon:AlertCircle},
}

export default function LabPage(){
  return <div className="space-y-4 animate-fade-in">
    <div><h2 className="section-title">Lab orders</h2><p className="text-muted">{ORDERS.length} orders total</p></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        {label:'Pending',value:2,color:'text-primary-600 bg-primary-50',icon:Clock},
        {label:'Shipped',value:1,color:'text-amber-600 bg-amber-50',icon:Truck},
        {label:'Delivered',value:1,color:'text-teal-600 bg-teal-50',icon:CheckCircle},
        {label:'Revisions',value:1,color:'text-red-600 bg-red-50',icon:AlertCircle},
      ].map(({label,value,color,icon:Icon})=>(
        <div key={label} className="card p-4 flex items-center gap-3">
          <div className={`p-2 rounded-xl ${color}`}><Icon size={18}/></div>
          <div><p className="text-xl font-bold text-ink-900">{value}</p><p className="text-xs text-ink-500">{label}</p></div>
        </div>
      ))}
    </div>
    <div className="card overflow-hidden">
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
          {ORDERS.map(o=>{
            const s=SM[o.status]
            return <tr key={o.id} className="table-row">
              <td className="px-5 py-3 font-mono text-sm text-primary-700 font-semibold">{o.id}</td>
              <td className="px-5 py-3">
                <p className="text-sm font-medium text-ink-900">{o.patient}</p>
                <p className="text-xs text-ink-400 font-mono">{o.caseNumber}</p>
              </td>
              <td className="px-5 py-3 text-sm text-ink-700">{o.lab}</td>
              <td className="px-5 py-3"><Badge variant={s.variant} dot>{s.label}</Badge></td>
              <td className="px-5 py-3 text-sm text-ink-600">{formatDate(o.ordered)}</td>
              <td className="px-5 py-3 text-sm text-ink-600">{formatDate(o.eta)}</td>
              <td className="px-5 py-3 text-sm font-semibold text-ink-900">{o.stages}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  </div>
}
