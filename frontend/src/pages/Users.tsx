import { useState } from 'react'
import { Eye, MoreVertical, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar, Modal, Button, Spinner, EmptyState } from '../components/ui'
import { formatDate, cn } from '../lib/utils'
import { useUsers, useCreateUser } from '../lib/queries/users'

export default function UsersPage() {
  const { data:users=[], isLoading } = useUsers()
  const createUser = useCreateUser()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'doctor' })
  const upd = (k:string, v:string) => setForm(f=>({...f,[k]:v}))
  const handleCreate = async () => {
    if(!form.name||!form.email||!form.password) return toast.error('Name, email and password are required')
    try{
      await createUser.mutateAsync(form)
      toast.success('Employee added')
      setOpen(false)
      setForm({ name:'', email:'', password:'', role:'doctor' })
    }catch(err:any){
      toast.error(err?.response?.data?.detail || 'Failed to create employee')
    }
  }
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Users</h2><p className="text-muted">{users.length} employees</p></div>
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
        {isLoading?<div className="flex justify-center py-16"><Spinner/></div>:users.length===0?(
          <EmptyState title="No employees yet"/>
        ):(
        <table className="w-full">
          <thead>
            <tr className="bg-surface-50 text-xs font-medium text-ink-400 uppercase tracking-wide">
              <th className="text-left px-5 py-3">User</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-left px-5 py-3">Role</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Created</th>
              <th className="text-left px-5 py-3">Last Login</th>
              <th className="text-left px-5 py-3">Phone</th>
              <th className="text-left px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id} className="table-row">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm"/>
                    <p className="text-sm font-semibold text-ink-900">{u.name}</p>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-primary-600">{u.email}</td>
                <td className="px-5 py-3 text-sm text-ink-700 capitalize">{u.role}</td>
                <td className="px-5 py-3">
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold',u.status==='active'?'bg-teal-50 text-teal-700':'bg-red-50 text-red-600')}>
                    {u.status==='active'?'Active':'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-ink-500">{formatDate(u.created_at)}</td>
                <td className="px-5 py-3 text-sm text-ink-500">{u.last_login ? formatDate(u.last_login, { hour:'2-digit', minute:'2-digit' }) : '—'}</td>
                <td className="px-5 py-3 text-sm text-ink-500">{u.phone || '—'}</td>
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
        )}
      </div>
      <Modal open={open} onClose={()=>setOpen(false)} title="Add New Employee" size="md"
        footer={<><Button variant="secondary" onClick={()=>setOpen(false)}>Cancel</Button><Button variant="primary" loading={createUser.isPending} onClick={handleCreate}>Create Employee</Button></>}>
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
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="••••••••" value={form.password} onChange={e=>upd('password',e.target.value)}/>
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e=>upd('role',e.target.value)}>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="assistant">Assistant</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
