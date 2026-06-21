import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft,Share2,Download,Send,CheckCircle,Upload,Stethoscope,MessageSquare,User,FileText } from 'lucide-react'
import { Badge,Avatar,Button,Modal } from '../components/ui'
import { STATUS_CONFIG,formatDate } from '../lib/utils'

const MOCK={id:'1',caseNumber:'OC-2026-0041',status:'in_planning',priority:'high',treatmentType:'aligners',chiefComplaint:'Crowding in upper arch, mild spacing in lower anterior region.',createdAt:'2026-06-15T10:00:00Z',updatedAt:'2026-06-20T14:32:00Z',patient:{firstName:'Sarah',lastName:'Mitchell',email:'sarah.mitchell@email.com',phone:'+1 (555) 123-4567',dateOfBirth:'1990-03-12',gender:'female',allergies:'Penicillin'},scans:[{id:'s1',type:'upper',fileName:'upper_arch.stl',fileSize:2400000,format:'stl',status:'ready'},{id:'s2',type:'lower',fileName:'lower_arch.stl',fileSize:2100000,format:'stl',status:'ready'}]}
const TABS=[{id:'overview',label:'Overview',icon:User},{id:'treatment',label:'Treatment plan',icon:FileText},{id:'comments',label:'Comments',icon:MessageSquare}]
const STEPS=['Scan uploaded','AI segmentation','Treatment planned','Patient approval','Lab export']

export default function CaseDetail(){
  const navigate=useNavigate()
  const [tab,setTab]=useState('overview')
  const [shareOpen,setShareOpen]=useState(false)
  const c=MOCK
  const s=STATUS_CONFIG[c.status]
  return <div className="space-y-4 animate-fade-in">
    <div className="flex items-center gap-3">
      <button onClick={()=>navigate('/cases')} className="btn-ghost p-2 rounded-lg"><ArrowLeft size={18}/></button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-primary-700 font-semibold">{c.caseNumber}</span>
          <Badge variant={s.color.replace('badge-','')} dot>{s.label}</Badge>
          {c.priority==='high'&&<Badge variant="red">High priority</Badge>}
        </div>
        <p className="text-xs text-ink-400 mt-0.5">{c.patient.firstName} {c.patient.lastName} · Created {formatDate(c.createdAt)}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" leftIcon={<Share2 size={14}/>} onClick={()=>setShareOpen(true)}>Share with patient</Button>
        <Button variant="secondary" size="sm" leftIcon={<Download size={14}/>}>Export</Button>
        <Button variant="primary" size="sm" leftIcon={<Send size={14}/>}>Send for approval</Button>
      </div>
    </div>
    <div className="card p-4">
      <div className="flex items-center">
        {STEPS.map((step,i)=>(
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${i<3?'bg-teal-500 text-white':'bg-surface-200 text-ink-400'}`}>
                {i<3?<CheckCircle size={14}/>:i+1}
              </div>
              <span className="text-xs text-ink-500 text-center whitespace-nowrap">{step}</span>
            </div>
            {i<STEPS.length-1&&<div className={`flex-1 h-0.5 mb-4 mx-1 ${i<2?'bg-teal-400':'bg-surface-200'}`}/>}
          </div>
        ))}
      </div>
    </div>
    <div className="border-b border-surface-200">
      <div className="flex">
        {TABS.map(({id:tid,label,icon:Icon})=>(
          <button key={tid} onClick={()=>setTab(tid)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===tid?'border-primary-500 text-primary-700':'border-transparent text-ink-500 hover:text-ink-900'}`}>
            <Icon size={15}/>{label}
          </button>
        ))}
      </div>
    </div>
    {tab==='overview'&&(
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={`${c.patient.firstName} ${c.patient.lastName}`} size="lg"/>
            <div>
              <p className="font-semibold text-ink-900">{c.patient.firstName} {c.patient.lastName}</p>
              <p className="text-sm text-ink-500 capitalize">{c.patient.gender} · {new Date().getFullYear()-new Date(c.patient.dateOfBirth).getFullYear()} yrs</p>
            </div>
          </div>
          <div className="divider"/>
          {[['Email',c.patient.email],['Phone',c.patient.phone],['Allergies',c.patient.allergies]].map(([l,v])=>(
            <div key={l} className="flex justify-between text-sm">
              <span className="text-ink-400">{l}</span>
              <span className="text-ink-900 font-medium">{v}</span>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <p className="section-title mb-3">Case details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Treatment','Aligners'],['Priority',c.priority],['Clinician','Dr. Chen Wei'],['Updated',formatDate(c.updatedAt)]].map(([l,v])=>(
                <div key={l}><p className="text-xs text-ink-400 mb-0.5">{l}</p><p className="font-medium text-ink-900 capitalize">{v}</p></div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-surface-100">
              <p className="text-xs text-ink-400 mb-1">Chief complaint</p>
              <p className="text-sm text-ink-700">{c.chiefComplaint}</p>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="section-title">Scans</p>
              <Button variant="secondary" size="sm" leftIcon={<Upload size={13}/>}>Upload scan</Button>
            </div>
            <div className="space-y-2">
              {c.scans.map(scan=>(
                <div key={scan.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-50 border border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Stethoscope size={14} className="text-primary-600"/>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{scan.fileName}</p>
                      <p className="text-xs text-ink-400 uppercase">{scan.format} · {(scan.fileSize/1e6).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <Badge variant="green" dot>{scan.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
    {tab==='treatment'&&(
      <div className="card p-8 text-center">
        <Stethoscope size={48} className="text-ink-300 mx-auto mb-4"/>
        <p className="text-base font-medium text-ink-700 mb-1">3D Treatment Planner</p>
        <p className="text-sm text-ink-400 mb-4">Upload a 3D scan first, then run AI segmentation to begin planning</p>
        <Button variant="primary">Run AI analysis</Button>
      </div>
    )}
    {tab==='comments'&&(
      <div className="card p-5">
        <p className="section-title mb-4">Comments</p>
        <div className="flex gap-3">
          <Avatar name="Admin Islam" size="sm"/>
          <div className="flex-1 flex gap-2">
            <input className="input flex-1" placeholder="Add a comment…"/>
            <Button variant="primary" size="sm">Send</Button>
          </div>
        </div>
      </div>
    )}
    <Modal open={shareOpen} onClose={()=>setShareOpen(false)} title="Share with patient"
      footer={<><Button variant="secondary" onClick={()=>setShareOpen(false)}>Cancel</Button><Button variant="primary" leftIcon={<Share2 size={14}/>}>Generate link</Button></>}>
      <div className="space-y-4">
        <p className="text-sm text-ink-600">Generate a secure link for <strong>{c.patient.firstName}</strong> to view their 3D treatment simulation.</p>
        <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
          <p className="text-xs text-ink-400 mb-1">Shareable link</p>
          <div className="flex gap-2">
            <input className="input flex-1 text-sm font-mono" readOnly placeholder="https://app.orthoflow.io/portal/…"/>
            <Button variant="secondary" size="sm">Copy</Button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
}
