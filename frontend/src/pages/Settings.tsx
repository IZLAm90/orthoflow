import { useState } from 'react'
import { User, Lock, CreditCard, Truck, Stethoscope, Bell, Save, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { Avatar, Button } from '../components/ui'
import { cn } from '../lib/utils'

const SECTIONS = [
  { id:'general',   icon:User,        label:'General' },
  { id:'password',  icon:Lock,        label:'Change Password' },
  { id:'billing',   icon:CreditCard,  label:'Billing' },
  { id:'delivery',  icon:Truck,       label:'Delivery centers' },
  { id:'doctors',   icon:Stethoscope, label:'Doctors' },
  { id:'notifications', icon:Bell,    label:'Notifications' },
]

const COUNTRIES = ['Saudi Arabia','Egypt','UAE','Kuwait','Qatar','Bahrain','Jordan','Lebanon','Morocco','Tunisia']

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [active, setActive] = useState('general')
  const [showPw, setShowPw] = useState({ current:false, new:false, confirm:false })
  const [saved, setSaved] = useState(false)

  const [general, setGeneral] = useState({
    name: user?.name || 'Admin Islam',
    phone: '+1 555-000-0000',
    city: 'Cairo',
    country: 'Egypt',
    email: user?.email || 'admin@orthoflow.io',
  })

  const [passwords, setPasswords] = useState({ current:'', new:'', confirm:'' })

  const [doctors, setDoctors] = useState([
    { id:'d1', name:'Dr. Ali Dabla', email:'ali.dabla@clinic.com', phone:'+966 500 000 001' },
    { id:'d2', name:'Dr. Chen Wei', email:'chen.wei@clinic.com', phone:'+966 500 000 002' },
  ])

  const [deliveryCenters, setDeliveryCenters] = useState([
    { id:'dc1', name:'Main Clinic', address:'123 Medical St, Cairo, Egypt', phone:'+20 100 000 0001' },
    { id:'dc2', name:'Branch Office', address:'456 Health Ave, Giza, Egypt', phone:'+20 100 000 0002' },
  ])

  const [notifications, setNotifications] = useState({
    orderPlaced: true, orderDelivered: true, planApproved: true,
    newMessage: true, invoiceReady: false, promotions: false,
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const upd = (k:string, v:string) => setGeneral(g => ({...g, [k]:v}))
  const updPw = (k:string, v:string) => setPasswords(p => ({...p, [k]:v}))
  const togglePw = (k:string) => setShowPw(s => ({...s, [k]:!(s as any)[k]}))

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-ink-400">
          <span>Home</span><span>›</span><span className="text-ink-700 font-medium">Account Settings</span>
        </nav>
        <h2 className="text-2xl font-bold text-ink-900 mt-1">Account Settings</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left sidebar */}
        <div className="w-full md:w-56 flex-shrink-0">
          <div className="card p-2 space-y-0.5">
            {SECTIONS.map(({ id, icon:Icon, label }) => (
              <button key={id} onClick={() => setActive(id)}
                className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                  active === id ? 'bg-primary-600 text-white' : 'text-ink-600 hover:bg-surface-100'
                )}>
                <Icon size={17} className="flex-shrink-0"/>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1">

          {/* General */}
          {active === 'general' && (
            <div className="card p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-surface-200 pb-4">
                <User size={20} className="text-primary-600"/>
                <h3 className="text-lg font-semibold text-ink-900">General</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar name={general.name} size="xl"/>
                  <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-soft hover:bg-primary-700 transition-colors">
                    <span className="text-xs">✏</span>
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-ink-900">{general.name}</p>
                  <p className="text-sm text-ink-500">{general.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Your Name</label>
                  <input className="input" value={general.name} onChange={e=>upd('name',e.target.value)}/>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <div className="flex gap-2">
                    <select className="input w-24">
                      <option>🇪🇬 +20</option><option>🇸🇦 +966</option><option>🇺🇸 +1</option>
                    </select>
                    <input className="input flex-1" value={general.phone} onChange={e=>upd('phone',e.target.value)}/>
                  </div>
                </div>
                <div>
                  <label className="label">City</label>
                  <input className="input" value={general.city} onChange={e=>upd('city',e.target.value)}/>
                </div>
                <div>
                  <label className="label">Country</label>
                  <select className="input" value={general.country} onChange={e=>upd('country',e.target.value)}>
                    {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Email</label>
                  <input type="email" className="input" value={general.email} onChange={e=>upd('email',e.target.value)}/>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" leftIcon={<Save size={15}/>} onClick={handleSave}>
                  {saved ? '✓ Saved!' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Change Password */}
          {active === 'password' && (
            <div className="card p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-surface-200 pb-4">
                <Lock size={20} className="text-primary-600"/>
                <h3 className="text-lg font-semibold text-ink-900">Change Password</h3>
              </div>
              <div className="space-y-4 max-w-md">
                {([['current','Current password'],['new','New password'],['confirm','Confirm new password']] as [string,string][]).map(([key,label])=>(
                  <div key={key}>
                    <label className="label">{label}</label>
                    <div className="relative">
                      <input type={(showPw as any)[key]?'text':'password'} className="input pr-10"
                        placeholder="••••••••" value={(passwords as any)[key]} onChange={e=>updPw(key,e.target.value)}/>
                      <button type="button" onClick={()=>togglePw(key)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                        {(showPw as any)[key]?<EyeOff size={15}/>:<Eye size={15}/>}
                      </button>
                    </div>
                  </div>
                ))}
                {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
                  <p className="text-xs text-red-600">Passwords do not match</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button variant="primary" leftIcon={<Save size={15}/>} onClick={handleSave}
                  disabled={!passwords.current||!passwords.new||passwords.new!==passwords.confirm}>
                  {saved?'✓ Updated!':'Update Password'}
                </Button>
              </div>
            </div>
          )}

          {/* Billing */}
          {active === 'billing' && (
            <div className="card p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-surface-200 pb-4">
                <CreditCard size={20} className="text-primary-600"/>
                <h3 className="text-lg font-semibold text-ink-900">Billing</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Company / Clinic name</label>
                  <input className="input" placeholder="OrthoFlow Clinic" defaultValue="OrthoFlow Clinic"/>
                </div>
                <div className="col-span-2">
                  <label className="label">Billing address</label>
                  <input className="input" placeholder="123 Medical St, Cairo, Egypt" defaultValue="123 Medical St, Cairo"/>
                </div>
                <div>
                  <label className="label">VAT / Tax number</label>
                  <input className="input" placeholder="e.g. EG123456789"/>
                </div>
                <div>
                  <label className="label">Billing email</label>
                  <input type="email" className="input" placeholder="billing@clinic.com" defaultValue={general.email}/>
                </div>
                <div>
                  <label className="label">City</label>
                  <input className="input" defaultValue="Cairo"/>
                </div>
                <div>
                  <label className="label">Country</label>
                  <select className="input" defaultValue="Egypt">
                    {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" leftIcon={<Save size={15}/>} onClick={handleSave}>
                  {saved?'✓ Saved!':'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Delivery centers */}
          {active === 'delivery' && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-surface-200 pb-4">
                <div className="flex items-center gap-2">
                  <Truck size={20} className="text-primary-600"/>
                  <h3 className="text-lg font-semibold text-ink-900">Delivery centers</h3>
                </div>
                <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} onClick={()=>setDeliveryCenters(d=>[...d,{id:`dc${Date.now()}`,name:'',address:'',phone:''}])}>
                  Add center
                </Button>
              </div>
              <div className="space-y-4">
                {deliveryCenters.map((dc,i)=>(
                  <div key={dc.id} className="border border-surface-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink-700">Center {i+1}</p>
                      <button onClick={()=>setDeliveryCenters(d=>d.filter(x=>x.id!==dc.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label">Name</label><input className="input" defaultValue={dc.name} placeholder="Main Clinic"/></div>
                      <div><label className="label">Phone</label><input className="input" defaultValue={dc.phone} placeholder="+1 555-000-0000"/></div>
                      <div className="col-span-2"><label className="label">Address</label><input className="input" defaultValue={dc.address} placeholder="123 Medical St, Cairo, Egypt"/></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="primary" leftIcon={<Save size={15}/>} onClick={handleSave}>
                  {saved?'✓ Saved!':'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Doctors */}
          {active === 'doctors' && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-surface-200 pb-4">
                <div className="flex items-center gap-2">
                  <Stethoscope size={20} className="text-primary-600"/>
                  <h3 className="text-lg font-semibold text-ink-900">Doctors</h3>
                </div>
                <Button variant="primary" size="sm" leftIcon={<Plus size={14}/>} onClick={()=>setDoctors(d=>[...d,{id:`d${Date.now()}`,name:'',email:'',phone:''}])}>
                  Add doctor
                </Button>
              </div>
              <div className="space-y-4">
                {doctors.map((doc,i)=>(
                  <div key={doc.id} className="border border-surface-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={doc.name||'DR'} size="sm"/>
                        <p className="text-sm font-semibold text-ink-700">{doc.name||`Doctor ${i+1}`}</p>
                      </div>
                      <button onClick={()=>setDoctors(d=>d.filter(x=>x.id!==doc.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label">Full name</label><input className="input" defaultValue={doc.name} placeholder="Dr. John Smith"/></div>
                      <div><label className="label">Phone</label><input className="input" defaultValue={doc.phone} placeholder="+1 555-000-0000"/></div>
                      <div className="col-span-2"><label className="label">Email</label><input type="email" className="input" defaultValue={doc.email} placeholder="doctor@clinic.com"/></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="primary" leftIcon={<Save size={15}/>} onClick={handleSave}>
                  {saved?'✓ Saved!':'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {active === 'notifications' && (
            <div className="card p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-surface-200 pb-4">
                <Bell size={20} className="text-primary-600"/>
                <h3 className="text-lg font-semibold text-ink-900">Notifications</h3>
              </div>
              <div className="space-y-4">
                {([
                  ['orderPlaced','Order placed','Get notified when a new order is placed'],
                  ['orderDelivered','Order delivered','Get notified when your order is delivered'],
                  ['planApproved','Treatment plan approved','Get notified when a patient approves a treatment plan'],
                  ['newMessage','New message','Get notified when you receive a new message or observation'],
                  ['invoiceReady','Invoice ready','Get notified when a new invoice is generated'],
                  ['promotions','Promotions & updates','Receive promotional emails and platform updates'],
                ] as [string,string,string][]).map(([key,label,desc])=>(
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-surface-200 hover:bg-surface-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{label}</p>
                      <p className="text-xs text-ink-400 mt-0.5">{desc}</p>
                    </div>
                    <div className={cn('w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0',
                      (notifications as any)[key]?'bg-primary-600':'bg-surface-300')}
                      onClick={()=>setNotifications(n=>({...n,[key]:!(n as any)[key]}))}>
                      <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                        (notifications as any)[key]?'translate-x-6':'translate-x-1')}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="primary" leftIcon={<Save size={15}/>} onClick={handleSave}>
                  {saved?'✓ Saved!':'Save Changes'}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
