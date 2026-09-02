import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus,Search,ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge,Avatar,Modal,Button,Spinner,EmptyState } from '../components/ui'
import { formatDate } from '../lib/utils'
import { usePatients, useCreatePatient } from '../lib/queries/patients'

export default function PatientsPage(){
  const navigate=useNavigate()
  const { data:patients=[], isLoading } = usePatients()
  const createPatient = useCreatePatient()
  const [search,setSearch]=useState('')
  const [open,setOpen]=useState(false)
  const [form,setForm]=useState({firstName:'',lastName:'',email:'',phone:'',dateOfBirth:'',gender:'female'})
  const filtered=patients.filter(p=>{
    const q=search.toLowerCase()
    return !q||`${p.first_name} ${p.last_name}`.toLowerCase().includes(q)||(p.email||'').toLowerCase().includes(q)
  })
  const upd=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))
  const handleCreate=async()=>{
    if(!form.firstName||!form.lastName) return toast.error('First and last name are required')
    try{
      await createPatient.mutateAsync({
        first_name:form.firstName, last_name:form.lastName, email:form.email||undefined,
        phone:form.phone||undefined, date_of_birth:form.dateOfBirth||undefined, gender:form.gender,
      })
      toast.success('Patient created')
      setOpen(false)
      setForm({firstName:'',lastName:'',email:'',phone:'',dateOfBirth:'',gender:'female'})
    }catch{
      toast.error('Failed to create patient')
    }
  }
  return <div className="space-y-4 animate-fade-in">
    <div className="flex items-center justify-between">
      <div><h2 className="section-title">Patients</h2><p className="text-muted">{patients.length} total</p></div>
      <button className="btn-primary gap-2" onClick={()=>setOpen(true)}><Plus size={16}/>Add patient</button>
    </div>
    <div className="card p-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/>
        <input className="input pl-8 py-1.5 text-sm" placeholder="Search patients…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
    </div>
    <div className="card overflow-hidden">
      {isLoading?<div className="flex justify-center py-16"><Spinner/></div>:filtered.length===0?(
        <EmptyState title="No patients yet" description="Add your first patient to get started."/>
      ):(
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
                  <Avatar name={`${p.first_name} ${p.last_name}`} size="sm"/>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-ink-400 capitalize">{p.gender}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3"><p className="text-sm text-ink-700">{p.email}</p><p className="text-xs text-ink-400">{p.phone}</p></td>
              <td className="px-5 py-3 text-sm text-ink-600">{p.date_of_birth?formatDate(p.date_of_birth):'—'}</td>
              <td className="px-5 py-3"><Badge variant={p.cases_count>0?'blue':'gray'}>{p.cases_count} case{p.cases_count!==1?'s':''}</Badge></td>
              <td className="px-5 py-3 text-sm text-ink-400">{formatDate(p.created_at)}</td>
              <td className="px-5 py-3"><button className="btn-ghost btn-sm">View <ArrowRight size={12}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
    <Modal open={open} onClose={()=>setOpen(false)} title="Add new patient" size="lg"
      footer={<><Button variant="secondary" onClick={()=>setOpen(false)}>Cancel</Button><Button variant="primary" loading={createPatient.isPending} onClick={handleCreate}>Create patient</Button></>}>
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
