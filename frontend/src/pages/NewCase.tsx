import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft,CheckCircle,Upload,Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar,Button,Badge,Spinner } from '../components/ui'
import { cn } from '../lib/utils'
import { usePatients } from '../lib/queries/patients'
import { useCreateCase, useUploadScan } from '../lib/queries/cases'

const STEPS=['Patient','Case details','Upload scans','Confirm']

export default function NewCase(){
  const navigate=useNavigate()
  const { data:patients=[], isLoading:patientsLoading } = usePatients()
  const createCase = useCreateCase()
  const uploadScan = useUploadScan()
  const [step,setStep]=useState(0)
  const [form,setForm]=useState({patientId:'',treatmentType:'aligners',priority:'normal',chiefComplaint:'',scans:[] as File[]})
  const [dragging,setDragging]=useState(false)
  const [submitting,setSubmitting]=useState(false)
  const upd=(k:string,v:any)=>setForm(f=>({...f,[k]:v}))
  const sel=patients.find(p=>p.id===form.patientId)
  const handleFiles=(files:FileList|null)=>{
    if(!files) return
    upd('scans',[...form.scans,...Array.from(files).filter(f=>f.name.match(/\.(stl|obj|ply)$/i))])
  }
  const handleCreate=async()=>{
    setSubmitting(true)
    try{
      const created = await createCase.mutateAsync({
        patient_id: form.patientId, treatment_type: form.treatmentType,
        priority: form.priority, chief_complaint: form.chiefComplaint||undefined,
      })
      for(let i=0;i<form.scans.length;i++){
        await uploadScan.mutateAsync({ caseId: created.id, file: form.scans[i], type: i%2===0?'upper':'lower' })
      }
      toast.success('Case created')
      navigate(`/cases/${created.id}`)
    }catch{
      toast.error('Failed to create case')
      setSubmitting(false)
    }
  }
  return <div className="max-w-2xl mx-auto animate-fade-in">
    <div className="flex items-center gap-3 mb-6">
      <button onClick={()=>navigate('/cases')} className="btn-ghost p-2 rounded-lg"><ArrowLeft size={18}/></button>
      <div><h2 className="section-title">New case</h2><p className="text-muted">Step {step+1} of {STEPS.length}</p></div>
    </div>
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s,i)=>(
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',i<step?'bg-teal-500 border-teal-500 text-white':i===step?'bg-white border-primary-500 text-primary-600':'bg-white border-surface-200 text-ink-300')}>
              {i<step?<CheckCircle size={14}/>:i+1}
            </div>
            <span className={cn('text-xs mt-1.5 font-medium',i===step?'text-primary-700':i<step?'text-teal-700':'text-ink-400')}>{s}</span>
          </div>
          {i<STEPS.length-1&&<div className={cn('flex-1 h-0.5 mb-4 mx-1',i<step?'bg-teal-400':'bg-surface-200')}/>}
        </div>
      ))}
    </div>
    <div className="card p-6 space-y-5">
      {step===0&&<>
        <h3 className="font-semibold text-ink-900">Select patient</h3>
        {patientsLoading?<div className="flex justify-center py-8"><Spinner/></div>:
        <div className="space-y-2">
          {patients.map(p=>{
            const name = `${p.first_name} ${p.last_name}`
            return <button key={p.id} onClick={()=>upd('patientId',p.id)} className={cn('w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',form.patientId===p.id?'border-primary-400 bg-primary-50':'border-surface-200 hover:border-primary-300')}>
              <Avatar name={name} size="sm"/>
              <span className="text-sm font-medium text-ink-900 flex-1">{name}</span>
              {form.patientId===p.id&&<CheckCircle size={16} className="text-primary-600"/>}
            </button>
          })}
          {patients.length===0 && <p className="text-sm text-ink-400">No patients yet — add one first.</p>}
        </div>}
        <Button variant="secondary" size="sm" leftIcon={<Plus size={13}/>} onClick={()=>navigate('/patients')}>Add new patient</Button>
      </>}
      {step===1&&<>
        <h3 className="font-semibold text-ink-900">Case details</h3>
        <div>
          <label className="label">Treatment type</label>
          <select className="input" value={form.treatmentType} onChange={e=>upd('treatmentType',e.target.value)}>
            <option value="aligners">Clear aligners</option>
            <option value="braces">Fixed braces</option>
            <option value="retainer">Retainer</option>
            <option value="surgical">Surgical</option>
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={e=>upd('priority',e.target.value)}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="label">Chief complaint</label>
          <textarea className="input min-h-[80px]" placeholder="Describe the patient's primary concern…" value={form.chiefComplaint} onChange={e=>upd('chiefComplaint',e.target.value)}/>
        </div>
      </>}
      {step===2&&<>
        <h3 className="font-semibold text-ink-900">Upload 3D scans</h3>
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true)}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files)}}
          className={cn('border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',dragging?'border-primary-400 bg-primary-50':'border-surface-300 hover:border-primary-300 hover:bg-surface-50')}
          onClick={()=>document.getElementById('scan-input')?.click()}>
          <Upload size={32} className={cn('mx-auto mb-3',dragging?'text-primary-500':'text-ink-300')}/>
          <p className="text-sm font-medium text-ink-700">Drop 3D scan files here</p>
          <p className="text-xs text-ink-400 mt-1">STL, OBJ, PLY · Max 50MB</p>
          <input id="scan-input" type="file" multiple accept=".stl,.obj,.ply" className="hidden" onChange={e=>handleFiles(e.target.files)}/>
        </div>
        {form.scans.length>0&&(
          <div className="space-y-2">
            {form.scans.map((f,i)=>(
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-200">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-xs font-mono text-primary-700">{f.name.split('.').pop()?.toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{f.name}</p>
                  <p className="text-xs text-ink-400">{(f.size/1e6).toFixed(1)} MB</p>
                </div>
                <Badge variant="green" dot>Ready</Badge>
              </div>
            ))}
          </div>
        )}
      </>}
      {step===3&&<>
        <h3 className="font-semibold text-ink-900">Confirm & create</h3>
        <div className="space-y-3 text-sm">
          {([['Patient',sel?`${sel.first_name} ${sel.last_name}`:'—'],['Treatment',form.treatmentType],['Priority',form.priority],['Scans',`${form.scans.length} file(s)`]] as [string,string][]).map(([l,v])=>(
            <div key={l} className="flex justify-between py-2 border-b border-surface-100">
              <span className="text-ink-500">{l}</span>
              <span className="font-medium text-ink-900 capitalize">{v}</span>
            </div>
          ))}
        </div>
        <div className="bg-primary-50 rounded-xl p-4 text-sm text-primary-800">
          <strong>What happens next:</strong> Case created, scans uploaded, AI segmentation starts automatically.
        </div>
      </>}
    </div>
    <div className="flex justify-between mt-4">
      <Button variant="secondary" onClick={()=>step===0?navigate('/cases'):setStep(step-1)} disabled={submitting}>
        {step===0?'Cancel':'Back'}
      </Button>
      <Button variant="primary" loading={submitting} onClick={()=>step===STEPS.length-1?handleCreate():setStep(step+1)} disabled={step===0&&!form.patientId}>
        {step===STEPS.length-1?'Create case':'Continue'}
      </Button>
    </div>
  </div>
}
