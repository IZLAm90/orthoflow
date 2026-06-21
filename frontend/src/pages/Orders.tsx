import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Download, Eye, Printer, ShoppingCart, List, Search } from 'lucide-react'
import { cn } from '../lib/utils'

const ORDERS = [
  { id:'WZLBFC', ref:'#WZLBFC', status:'finished', requested:'19/04/2026 00:11', patient:'Mashari', product:'Aligner Design Only W Onyxceph', total:'50,00 EUR', deliveryOn:'23/04/2026 00:03', doctor:'Dr. Maida', deliveryAddress:'Adwaa Almohaidb, Riyadh, Saudi Arabia', chiefComplain:'Extraction and correction of lower midline and canine relation.', treatBothArch:'yes', treatmentPlan:'Full Arch', dontMove:'.', apRelationship:'Improve canine only', anteroposterior:'class 1', elastics:'.', openBite:'Correct', midline:'Correct', ipr:'if necessary', biteRamps:'if needed', crossbite:'Correct', spaces:'Close all spaces', specialInstructions:'Extraction #44 required.', treatmentPlans:[{name:'Treatment Plan 1',created:'27/04/2026 21:34',status:'Approved',type:'Treatment',total:30,issued:0}], observations:[{user:'Ayman',time:'15/05/2026 01:49 AM',plan:'Treatment Plan 1',message:'PLAN APPROVED'},{user:'Hirsch Dynamics',time:'27/04/2026 09:36 PM',plan:'Treatment Plan 1',message:'Dear Doctor, We have created a treatment plan with lingual crown torque applied in the posterior segment to improve tipping control.'}] },
  { id:'PVNLBZ', ref:'#PVNLBZ', status:'finished', requested:'19/04/2026 00:02', patient:'Tamim', product:'Aligner Design Only W Onyxceph', total:'50,00 EUR', deliveryOn:'22/04/2026 23:55', doctor:'Dr. Ali Dabla', deliveryAddress:'Main Clinic, Riyadh, Saudi Arabia', chiefComplain:'Crowding in upper arch', treatBothArch:'yes', treatmentPlan:'Full Arch', dontMove:'.', apRelationship:'Maintain', anteroposterior:'class 1', elastics:'.', openBite:'Correct', midline:'Maintain', ipr:'.', biteRamps:'.', crossbite:'Correct', spaces:'Close all spaces', specialInstructions:'', treatmentPlans:[{name:'Treatment Plan 1',created:'20/04/2026 10:00',status:'Approved',type:'Treatment',total:24,issued:0}], observations:[{user:'Ayman',time:'20/04/2026 10:00 AM',plan:'Treatment Plan 1',message:'PLAN APPROVED'}] },
  { id:'WEMTQU', ref:'#WEMTQU', status:'finished', requested:'11/04/2026 07:15', patient:'Nora', product:'Aligner Design Only W Onyxceph', total:'50,00 EUR', deliveryOn:'15/04/2026 19:04', doctor:'Dr. Ali Dabla', deliveryAddress:'Branch Office, Jeddah, Saudi Arabia', chiefComplain:'Spacing and midline deviation', treatBothArch:'no', treatmentPlan:'Anterior Only', dontMove:'6,7', apRelationship:'Maintain', anteroposterior:'.', elastics:'.', openBite:'Maintain', midline:'Correct', ipr:'.', biteRamps:'.', crossbite:'Maintain', spaces:'Maintain spaces', specialInstructions:'', treatmentPlans:[{name:'Treatment Plan 1',created:'12/04/2026 08:00',status:'Approved',type:'Treatment',total:18,issued:0}], observations:[{user:'Ayman',time:'12/04/2026 08:00 AM',plan:'Treatment Plan 1',message:'PLAN APPROVED'}] },
  { id:'MOPXAE', ref:'#MOPXAE', status:'finished', requested:'04/04/2026 17:16', patient:'Faisal', product:'Aligner Design Only W Onyxceph', total:'50,00 EUR', deliveryOn:'09/04/2026 17:05', doctor:'Dr. Ali Dabla', deliveryAddress:'Main Clinic, Riyadh, Saudi Arabia', chiefComplain:'Deep bite correction needed', treatBothArch:'yes', treatmentPlan:'Full Arch', dontMove:'.', apRelationship:'Improve canine and molar', anteroposterior:'class 2', elastics:'Class II', openBite:'Correct', midline:'Maintain', ipr:'if necessary', biteRamps:'yes', crossbite:'Correct', spaces:'Close all spaces', specialInstructions:'', treatmentPlans:[{name:'Treatment Plan 1',created:'05/04/2026 09:00',status:'Approved',type:'Treatment',total:32,issued:0}], observations:[{user:'Ayman',time:'05/04/2026 09:00 AM',plan:'Treatment Plan 1',message:'PLAN APPROVED'}] },
  { id:'ASQJIH', ref:'#ASQJIH', status:'finished', requested:'30/03/2026 17:50', patient:'Sherouk', product:'Aligner Design Only W Onyxceph', total:'50,00 EUR', deliveryOn:'02/04/2026 13:50', doctor:'Dr. Ali Dabla', deliveryAddress:'Main Clinic, Riyadh', chiefComplain:'Upper arch crowding', treatBothArch:'yes', treatmentPlan:'Full Arch', dontMove:'.', apRelationship:'Maintain', anteroposterior:'class 1', elastics:'.', openBite:'Correct', midline:'Maintain', ipr:'0.3mm between 14-15', biteRamps:'.', crossbite:'Correct', spaces:'Close all spaces', specialInstructions:'', treatmentPlans:[{name:'Treatment Plan 1',created:'31/03/2026 10:00',status:'Approved',type:'Treatment',total:22,issued:0}], observations:[{user:'Ayman',time:'31/03/2026 10:00 AM',plan:'Treatment Plan 1',message:'PLAN APPROVED'}] },
  { id:'FPLUQP', ref:'#FPLUQP', status:'finished', requested:'09/03/2026 21:15', patient:'Abdelrahman', product:'Aligner Design Only W Onyxceph', total:'50,00 EUR', deliveryOn:'12/03/2026 21:00', doctor:'Dr. Ali Dabla', deliveryAddress:'Branch Office, Jeddah', chiefComplain:'Class III correction', treatBothArch:'yes', treatmentPlan:'Full Arch', dontMove:'.', apRelationship:'Correct both Molar and Canine', anteroposterior:'class 3', elastics:'Class III', openBite:'Correct', midline:'Correct', ipr:'.', biteRamps:'.', crossbite:'Correct only anterior', spaces:'Close all spaces', specialInstructions:'', treatmentPlans:[{name:'Treatment Plan 1',created:'10/03/2026 09:00',status:'Approved',type:'Treatment',total:28,issued:0}], observations:[{user:'Ayman',time:'10/03/2026 09:00 AM',plan:'Treatment Plan 1',message:'PLAN APPROVED'}] },
  { id:'SJWIKK', ref:'#SJWIKK', status:'finished', requested:'05/03/2026 14:58', patient:'Sami', product:'Aligner Design Only W Onyxceph', total:'60,00 EUR', deliveryOn:'10/03/2026 14:45', doctor:'Dr. Ali Dabla', deliveryAddress:'Main Clinic, Riyadh', chiefComplain:'Open bite and spacing', treatBothArch:'yes', treatmentPlan:'Full Arch', dontMove:'.', apRelationship:'Maintain', anteroposterior:'class 1', elastics:'Vertical', openBite:'Correct', midline:'Maintain', ipr:'.', biteRamps:'yes', crossbite:'Maintain', spaces:'Close all spaces', specialInstructions:'CBCT segmentation requested', treatmentPlans:[{name:'Treatment Plan 1',created:'06/03/2026 08:00',status:'Approved',type:'Treatment',total:34,issued:0}], observations:[{user:'Ayman',time:'06/03/2026 08:00 AM',plan:'Treatment Plan 1',message:'PLAN APPROVED'}] },
]

const STATUS_STYLE: Record<string,string> = {
  finished: 'bg-teal-50 text-teal-700 border border-teal-200',
  processing: 'bg-primary-50 text-primary-700 border border-primary-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
}

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

export default function OrdersPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string|null>(null)
  const [search, setSearch] = useState('')
  const [show, setShow] = useState(10)
  const [expandedPlans, setExpandedPlans] = useState(true)
  const [expandedObs, setExpandedObs] = useState(true)

  const filtered = ORDERS.filter(o =>
    !search ||
    o.ref.toLowerCase().includes(search.toLowerCase()) ||
    o.patient.toLowerCase().includes(search.toLowerCase())
  ).slice(0, show)

  const order = ORDERS.find(o => o.id === selected)

  if (selected && order) {
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
            <h2 className="text-lg font-bold text-primary-600">Order finished {order.ref} ({order.patient})</h2>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm"><Download size={14}/> Invoice</button>
              <button className="btn-secondary btn-sm"><Printer size={14}/> Print</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-2 text-sm">
              <p className="font-bold text-ink-900 text-base">{order.product}</p>
              <p className="text-ink-500">By <span className="text-primary-600 font-medium">Predict</span></p>
              <Stars />
              <p className="text-ink-600">Design and 3D files to print your own aligners.</p>
              <div className="pt-2 space-y-1">
                <p className="text-ink-700"><span className="font-semibold">Delivery Address </span><span className="text-primary-600 font-medium">{order.deliveryAddress}</span></p>
                <p className="text-ink-700">Delivery on <span className="text-primary-600 font-semibold">{order.deliveryOn}</span></p>
                <p className="text-ink-700">Order by <span className="text-primary-600 font-semibold">{order.doctor}</span> for patient <span className="font-semibold">{order.patient}</span></p>
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
              ['Chief Complain', order.chiefComplain],
              ['Treat both arch', order.treatBothArch],
              ['Treatment plan', order.treatmentPlan],
              ['AP Relationship', order.apRelationship],
              ['Anteroposterior relationship', order.anteroposterior],
              ['Elastics', order.elastics],
              ['Open Bite', order.openBite],
              ['Midline', order.midline],
              ['IPR', order.ipr],
              ['Bite Ramps', order.biteRamps],
              ['Crossbite', order.crossbite],
              ['Spaces', order.spaces],
            ].map(([label,value])=>(
              <p key={label} className="py-0.5">
                <span className="font-semibold text-ink-800">{label}: </span>
                <span className="text-ink-600">{value||'—'}</span>
              </p>
            ))}
            {order.specialInstructions ? (
              <p className="col-span-2 py-0.5">
                <span className="font-semibold text-ink-800">Special Instructions: </span>
                <span className="text-ink-600">{order.specialInstructions}</span>
              </p>
            ) : null}
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-surface-100">
            <button className="btn-primary btn-sm" onClick={()=>navigate('/products')}>New Order</button>
            <button className="btn-secondary btn-sm" onClick={()=>setSelected(null)}>View Orders</button>
            <button className="btn-secondary btn-sm"><Eye size={14}/></button>
          </div>
        </div>
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
                  {order.treatmentPlans.map((tp,i)=>(
                    <tr key={i} className="table-row">
                      <td className="px-5 py-3 text-primary-600 font-semibold text-sm">{tp.name}</td>
                      <td className="px-5 py-3 text-sm text-ink-600">{tp.created}</td>
                      <td className="px-5 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">{tp.status}</span></td>
                      <td className="px-5 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">{tp.type}</span></td>
                      <td className="px-5 py-3 text-sm text-ink-700">Total: {tp.total} / {tp.total} | Issued: {tp.issued}</td>
                      <td className="px-5 py-3"><button className="btn-secondary btn-sm"><Eye size={13}/> View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-surface-100 flex items-center justify-between">
                <p className="text-xs text-ink-400">{order.treatmentPlans.length} Total</p>
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
              {order.observations.map((obs,i)=>(
                <div key={i} className="px-6 py-4 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-700">
                    {obs.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-ink-900">{obs.user}</p>
                      <p className="text-xs text-ink-400">{obs.time}</p>
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
        <div><h2 className="section-title">Orders</h2><p className="text-muted">{ORDERS.length} Total</p></div>
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
            <span className="text-sm text-ink-600 font-medium">Filters</span>
            <select className="input py-1.5 text-sm w-48">
              <option>Create or select filter</option>
              <option>Finished</option>
              <option>Processing</option>
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
            {filtered.map(o=>(
              <tr key={o.id} className="table-row cursor-pointer" onClick={()=>setSelected(o.id)}>
                <td className="px-3 py-3 text-ink-400"><ChevronRight size={16}/></td>
                <td className="px-4 py-3 text-primary-600 font-bold text-sm">{o.ref}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold capitalize', STATUS_STYLE[o.status] || STATUS_STYLE.pending)}>
                    {o.status.charAt(0).toUpperCase()+o.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-ink-600">{o.requested}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                      <ToothIcon />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{o.patient}</p>
                      <p className="text-xs text-ink-400">@ {o.product}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-ink-900">{o.total}</td>
                <td className="px-4 py-3 text-sm text-ink-600">{o.deliveryOn} <span className="text-teal-500">✓</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="text-ink-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50" onClick={e=>{e.stopPropagation();setSelected(o.id)}}><Download size={15}/></button>
                    <button className="text-ink-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50" onClick={e=>{e.stopPropagation();setSelected(o.id)}}><Eye size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-surface-100 flex items-center justify-between">
          <p className="text-sm text-ink-500">{ORDERS.length} Total</p>
          <div className="flex gap-2 items-center">
            <button className="px-2 py-1 rounded hover:bg-surface-100 text-ink-400">←</button>
            <span className="px-3 py-1 bg-primary-600 text-white rounded text-xs">1</span>
            <button className="px-2 py-1 rounded hover:bg-surface-100 text-ink-400">→</button>
          </div>
        </div>
      </div>
    </div>
  )
}
