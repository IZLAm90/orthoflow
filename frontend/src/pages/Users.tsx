import { useState } from 'react'
import { Eye, MoreVertical, UserPlus } from 'lucide-react'
import { Avatar, Modal, Button } from '../components/ui'
import { formatDate, cn } from '../lib/utils'

const USERS = [
  { id:'u1', name:'Ayman Elkasheet',  email:'aymanelkasheet6@gmail.com', role:'Admin',     status:'active',   createdAt:'2026-03-05T14:28:00Z' },
  { id:'u2', name:'Dr. Ali Dabla',    email:'ali.dabla@clinic.com',       role:'Doctor',    status:'active',   createdAt:'2026-03-10T09:00:00Z' },
  { id:'u3', name:'Sara Nour',        email:'sara.nour@clinic.com',        role:'Assistant', status:'inactive', createdAt:'2026-04-01T11:00:00Z' },
]

export default function UsersPage() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', role:'Doctor' })
  const upd = (k:string, v:string) => setForm(f=>({...f,[k]:v}))
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Users</h2><p className="text-muted">{USERS.length} employees</p></div>
        <Button variant="primary" leftIcon={<UserPlus size={15}/>} onClick={()=>setOpen(true)}>Add New Employee</Button>
      </div>
      <div className="card p-3 flex gap-3 flex-wrap">
        <input className="input py-1.5 text-sm flex-1 min-w-48" placeholder="Search by name or email…"/>
        <select className="input py-1.5 text-sm w-32">
          <option value="">All</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
        <input type="date" className="input py-1.5 text-sm w-36"/>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-50 text-xs font-medium text-ink-400 uppercase tracking-wide">
              <th className="text-left px-5 py-3">User</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Created</th>
              <th className="text-left px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map(u=>(
              <tr key={u.id} className="table-row">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm"/>
                    <p className="text-sm font-semibold text-ink-900">{u.name}</p>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-primary-600">{u.email}</td>
                <td className="px-5 py-3 text-sm text-ink-700">{u.role}</td>
                <td className="px-5 py-3">
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold',u.status==='active'?'bg-teal-50 text-teal-700':'bg-red-50 text-red-600')}>
                    {u.status==='active'?'Active':'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-ink-500">{formatDate(u.createdAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button className="text-ink-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-colors"><Eye size={15}/></button>
                    <button className="text-ink-400 hover:text-ink-700 p-1.5 rounded-lg hover:bg-surface-100 transition-colors"><MoreVertical size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={()=>setOpen(false)} title="Add New Employee" size="md"
        footer={<><Button variant="secondary" onClick={()=>setOpen(false)}>Cancel</Button><Button variant="primary">Create Employee</Button></>}>
        <div className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" placeholder="Dr. John Smith" value={form.name} onChange={e=>upd('name',e.target.value)}/>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="john@clinic.com" value={form.email} onChange={e=>upd('email',e.target.value)}/>
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e=>upd('role',e.target.value)}>
              <option>Admin</option>
              <option>Doctor</option>
              <option>Assistant</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
