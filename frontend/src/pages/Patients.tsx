import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus,Search,ArrowRight } from 'lucide-react'
import { Badge,Avatar,Modal,Button } from '../components/ui'
import { formatDate } from '../lib/utils'

const PATIENTS=[
  {id:'p1',firstName:'Sarah',lastName:'Mitchell',email:'sarah.mitchell@email.com',phone:'+1 555-123-4567',dateOfBirth:'1990-03-12',gender:'female',casesCount:2,createdAt:'2026-01-10T00:00:00Z'},
  {id:'p2',firstName:'James',lastName:'Okonkwo',email:'james.okonkwo@email.com',phone:'+1 555-234-5678',dateOfBirth:'1985-07-22',gender:'male',casesCount:1,createdAt:'2026-02-14T00:00:00Z'},
  {id:'p3',firstName:'Amara',lastName:'Hassan',email:'amara.hassan@email.com',phone:'+1 555-345-6789',dateOfBirth:'2000-11-05',gender:'female',casesCount:1,createdAt:'2026-03-01T00:00:00Z'},
  {id:'p4',firstName:'David',lastName:'Park',email:'david.park@email.com',phone:'+1 555-456-7890',dateOfBirth:'1992-09-18',gender:'male',casesCount:3,createdAt:'2026-04-10T00:00:00Z'},
  {id:'p5',firstName:'Elena',lastName:'Rossi',email:'elena.rossi@email.com',phone:'+1 555-567-8901',dateOfBirth:'1988-02-28',gender:'female',casesCount:1,createdAt:'2026-01-20T00:00:00Z'},
]

export default function PatientsPage(){
  const navigate=useNavigate()
  const [search,setSearch]=useState('')
  const [open,setOpen]=useState(false)
  const [form,setForm]=useState({firstName:'',lastName:'',email:'',phone:'',dateOfBirth:'',gender:'female'})
  const filtered=PATIENTS.filter(p=>{
    const q=search.toLowerCase()
    return !q||`${p.firstName} ${p.lastName}`.toLowerCase().includes(q)||p.email.toLowerCase().includes(q)
  })
  const upd=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))
  return <div className="space-y-4 animate-fade-in">
    <div className="flex items-center justify-between">
      <div><h2 className="section-title">Patients</h2><p className="text-muted">{PATIENTS.length} total</p></div>
      <button className="btn-primary gap-2" onClick={()=>setOpen(true)}><Plus size={16}/>Add patient</button>
    </div>
    <div className="card p-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/>
        <input className="input pl-8 py-1.5 text-sm" placeholder="Search patients…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
    </div>
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-surface-50 text-xs font-medium text-ink-400 uppercase tracking-wide">
            <th className="text-left px-5 py-3">Patient</th>
            <th className="text-left px-5 py-3">Contact</th>
            <th className="text-left px-5 py-3">DOB</th>
            <th className="text-left px-5 py-3">Cases</th>
            <th className="text-left px-5 py-3">Since</th>
            <th className="px-5 py-3"/>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p=>(
            <tr key={p.id} className="table-row cursor-pointer" onClick={()=>navigate(`/patients/${p.id}`)}>
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={`${p.firstName} ${p.lastName}`} size="sm"/>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-ink-400 capitalize">{p.gender}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3"><p className="text-sm text-ink-700">{p.email}</p><p className="text-xs text-ink-400">{p.phone}</p></td>
              <td className="px-5 py-3 text-sm text-ink-600">{formatDate(p.dateOfBirth)}</td>
              <td className="px-5 py-3"><Badge variant={p.casesCount>0?'blue':'gray'}>{p.casesCount} case{p.casesCount!==1?'s':''}</Badge></td>
              <td className="px-5 py-3 text-sm text-ink-400">{formatDate(p.createdAt)}</td>
              <td className="px-5 py-3"><button className="btn-ghost btn-sm">View <ArrowRight size={12}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <Modal open={open} onClose={()=>setOpen(false)} title="Add new patient" size="lg"
      footer={<><Button variant="secondary" onClick={()=>setOpen(false)}>Cancel</Button><Button variant="primary">Create patient</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        {([['First name','firstName','Sarah'],['Last name','lastName','Mitchell'],['Email','email','sarah@example.com'],['Phone','phone','+1 555-000-0000']] as [string,string,string][]).map(([label,key,ph])=>(
          <div key={key}>
            <label className="label">{label}</label>
            <input className="input" placeholder={ph} value={(form as any)[key]} onChange={e=>upd(key,e.target.value)}/>
          </div>
        ))}
        <div>
          <label className="label">Date of birth</label>
          <input type="date" className="input" value={form.dateOfBirth} onChange={e=>upd('dateOfBirth',e.target.value)}/>
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input" value={form.gender} onChange={e=>upd('gender',e.target.value)}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </Modal>
  </div>
}
