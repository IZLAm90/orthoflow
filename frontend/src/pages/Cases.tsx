import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus,Search,ArrowRight } from 'lucide-react'
import { Badge,Avatar } from '../components/ui'
import { STATUS_CONFIG,formatRelative,cn } from '../lib/utils'

const CASES=[
  {id:'1',caseNumber:'OC-2026-0041',status:'awaiting_approval',priority:'high',treatmentType:'aligners',updatedAt:new Date(Date.now()-1000*60*25).toISOString(),patient:{firstName:'Sarah',lastName:'Mitchell',email:'sarah@example.com'}},
  {id:'2',caseNumber:'OC-2026-0040',status:'in_planning',priority:'normal',treatmentType:'aligners',updatedAt:new Date(Date.now()-1000*60*90).toISOString(),patient:{firstName:'James',lastName:'Okonkwo',email:'james@example.com'}},
  {id:'3',caseNumber:'OC-2026-0039',status:'new',priority:'normal',treatmentType:'braces',updatedAt:new Date(Date.now()-1000*60*180).toISOString(),patient:{firstName:'Amara',lastName:'Hassan',email:'amara@example.com'}},
  {id:'4',caseNumber:'OC-2026-0038',status:'in_treatment',priority:'low',treatmentType:'aligners',updatedAt:new Date(Date.now()-1000*60*60*5).toISOString(),patient:{firstName:'David',lastName:'Park',email:'david@example.com'}},
  {id:'5',caseNumber:'OC-2026-0037',status:'completed',priority:'normal',treatmentType:'retainer',updatedAt:new Date(Date.now()-1000*60*60*8).toISOString(),patient:{firstName:'Elena',lastName:'Rossi',email:'elena@example.com'}},
  {id:'6',caseNumber:'OC-2026-0036',status:'on_hold',priority:'high',treatmentType:'surgical',updatedAt:new Date(Date.now()-1000*60*60*12).toISOString(),patient:{firstName:'Marcus',lastName:'Webb',email:'marcus@example.com'}},
]

export default function CasesPage(){
  const navigate=useNavigate()
  const [search,setSearch]=useState('')
  const [sf,setSf]=useState('')
  const filtered=CASES.filter(c=>{
    const q=search.toLowerCase()
    return(!q||c.caseNumber.toLowerCase().includes(q)||`${c.patient.firstName} ${c.patient.lastName}`.toLowerCase().includes(q))&&(!sf||c.status===sf)
  })
  return <div className="space-y-4 animate-fade-in">
    <div className="flex items-center justify-between">
      <div><h2 className="section-title">All cases</h2><p className="text-muted">{filtered.length} cases</p></div>
      <button className="btn-primary gap-2" onClick={()=>navigate('/cases/new')}><Plus size={16}/>New case</button>
    </div>
    <div className="card p-3 flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-48">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/>
        <input className="input pl-8 py-1.5 text-sm" placeholder="Search cases or patients…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      <select className="input py-1.5 text-sm w-44" value={sf} onChange={e=>setSf(e.target.value)}>
        <option value="">All statuses</option>
        {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
      </select>
    </div>
    <div className="flex gap-2 flex-wrap">
      {['','new','in_planning','awaiting_approval','in_treatment'].map(s=>(
        <button key={s} onClick={()=>setSf(s)} className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-all',sf===s?'border-primary-400 bg-primary-50 text-primary-700':'border-surface-200 bg-white text-ink-500 hover:border-primary-300')}>
          {s?STATUS_CONFIG[s].label:'All'} <span className="opacity-60">({s?CASES.filter(c=>c.status===s).length:CASES.length})</span>
        </button>
      ))}
    </div>
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-50 text-xs font-medium text-ink-400 uppercase tracking-wide">
            <th className="text-left px-5 py-3">Case #</th>
            <th className="text-left px-5 py-3">Patient</th>
            <th className="text-left px-5 py-3">Treatment</th>
            <th className="text-left px-5 py-3">Status</th>
            <th className="text-left px-5 py-3">Updated</th>
            <th className="px-5 py-3"/>
          </tr>
        </thead>
        <tbody>
          {filtered.map(c=>{
            const s=STATUS_CONFIG[c.status]
            return <tr key={c.id} className="table-row cursor-pointer" onClick={()=>navigate(`/cases/${c.id}`)}>
              <td className="px-5 py-3 font-mono text-sm text-primary-700 font-medium">{c.caseNumber}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={`${c.patient.firstName} ${c.patient.lastName}`} size="xs"/>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{c.patient.firstName} {c.patient.lastName}</p>
                    <p className="text-xs text-ink-400">{c.patient.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 capitalize text-sm text-ink-600">{c.treatmentType}</td>
              <td className="px-5 py-3"><Badge variant={s.color.replace('badge-','')} dot>{s.label}</Badge></td>
              <td className="px-5 py-3 text-sm text-ink-400">{formatRelative(c.updatedAt)}</td>
              <td className="px-5 py-3"><button className="btn-ghost btn-sm">Open <ArrowRight size={12}/></button></td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  </div>
}
