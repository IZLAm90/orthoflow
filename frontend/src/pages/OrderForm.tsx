import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, CheckCircle, Upload, X, FileText, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'
import { useProduct } from '../lib/queries/products'
import { usePatients } from '../lib/queries/patients'
import { useDoctors } from '../lib/queries/doctors'
import { useDeliveryCenters } from '../lib/queries/deliveryCenters'
import { useCreateOrder, useUploadOrderFile } from '../lib/queries/orders'
import type { OdontogramMark } from '../lib/queries/products'
import { Modal } from '../components/ui'
import InfoTip from '../components/ui/InfoTip'

const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

function FieldError({ show, children }: { show:boolean; children:React.ReactNode }) {
  return show ? <p className="text-xs text-red-600 mt-1">{children}</p> : null
}

const UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28]
const LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]

const MULTIPLE_COLOR = '#0f766e'

// selected with no marks = plain selection (products without marks); with marks
// the tooth takes the mark's color, or MULTIPLE_COLOR when it has several.
function ToothIcon({ id, selected, marks, onClick }: { id:number; selected:boolean; marks:OdontogramMark[]; onClick:()=>void }) {
  const color = marks.length > 1 ? MULTIPLE_COLOR : marks[0]?.color ?? (selected ? '#f59e0b' : null)
  const title = `Tooth ${id}${marks.length ? ` — ${marks.map(m=>m.name).join(', ')}` : ''}`
  return (
    <button type="button" onClick={onClick} title={title} className="flex flex-col items-center gap-0.5 group">
      <svg viewBox="0 0 20 38" className={cn('w-6 h-11 transition-all group-hover:-translate-y-0.5')}>
        <ellipse cx="10" cy="11" rx="8.5" ry="10" fill={color ? `${color}33` : '#f5f0ea'} stroke={color ?? '#c9b99a'} strokeWidth={color ? 1.6 : 1.2}/>
        <path d="M3 19 Q10 24 17 19 Q15 32 10 34 Q5 32 3 19Z" fill={color ? `${color}1a` : '#ede0cc'} stroke={color ?? '#c9b99a'} strokeWidth="1"/>
        {color && <ellipse cx="10" cy="11" rx="4" ry="4.5" fill={color} opacity="0.75"/>}
      </svg>
      <span className={cn('text-[9px] font-mono leading-none', color ? 'font-bold text-ink-800' : 'text-ink-400')}>{id}</span>
    </button>
  )
}

interface PhotoUploadZone {
  label: string
  key: string
}

const PHOTO_ZONES: (PhotoUploadZone & { help:string })[] = [
  { label: 'Right', key: 'right', help: 'Upload an image of the right side of the teeth, clearly showing the lateral molar area.' },
  { label: 'Front', key: 'front', help: 'Upload a frontal image, centered on the incisors and showing the full smile.' },
  { label: 'Left', key: 'left', help: 'Upload an image of the left side of the teeth, clearly showing the lateral molar area.' },
  { label: 'Upper', key: 'upper', help: 'Upload an image of the entire upper arch from an occlusal angle.' },
  { label: 'Lower', key: 'lower', help: 'Upload an image of the entire lower arch from an occlusal angle.' },
  { label: 'Orthopantomography', key: 'ortho', help: 'Upload the panoramic X-ray of the complete denture (Orthopantomography).' },
]

function PhotoUpload({ label, infoTip, onFile, file, error }: { label:string; infoTip?:string; onFile:(f:File)=>void; file?:File; error?:boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <label className="label text-xs text-ink-600">
        {label} {infoTip && <InfoTip text={infoTip}/>}
      </label>
      <div
        onClick={() => ref.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl cursor-pointer transition-all h-36 flex flex-col items-center justify-center gap-2 group',
          file ? 'border-teal-400 bg-teal-50' : error ? 'border-red-400 bg-red-50/40' : 'border-primary-300 bg-primary-50/30 hover:bg-primary-50'
        )}
      >
        {file ? (
          <>
            {file.type.startsWith('image/') ? (
              <img src={URL.createObjectURL(file)} alt={label} className="h-24 w-full object-cover rounded-lg"/>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <FileText size={28} className="text-teal-500"/>
                <p className="text-xs text-teal-700 font-medium truncate max-w-[120px]">{file.name}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <Upload size={28} className="text-primary-400 group-hover:text-primary-600 transition-colors"/>
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide">{label.toUpperCase()}</p>
          </>
        )}
        <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}/>
      </div>
      <FieldError show={!!error}>This image is mandatory</FieldError>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked:boolean; onChange:(v:boolean)=>void; label:string }) {
  return (
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onChange(!checked)}>
      <div className={cn('w-11 h-6 rounded-full transition-colors relative', checked ? 'bg-primary-600' : 'bg-surface-300')}
        onClick={() => onChange(!checked)}>
        <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')}/>
      </div>
      <span className="text-sm text-ink-700">{label}</span>
    </div>
  )
}

export default function OrderForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data:product } = useProduct(id)
  const { data:patients=[] } = usePatients()
  const { data:doctors=[] } = useDoctors()
  const { data:deliveryCenters=[] } = useDeliveryCenters()
  const createOrder = useCreateOrder()
  const uploadFile = useUploadOrderFile()
  const [progress, setProgress] = useState('')
  const [submitted, setSubmitted] = useState(false)
  // tooth -> mark ids; a tooth present with [] is a plain selection (no marks defined)
  const [odontogram, setOdontogram] = useState<Record<number, string[]>>({})
  const [activeMark, setActiveMark] = useState<string|null>(null)
  const [legendOpen, setLegendOpen] = useState(false)
  const [photos, setPhotos] = useState<Record<string, File>>({})
  const [files, setFiles] = useState<File[]>([])
  const [draggingFiles, setDraggingFiles] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const filesRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    patientName:'', doctorId:'', deliveryCenterId:'',
    chiefComplain:'', treatBothArch:false,
    treatmentPlan:'full_arch', dontMove:'',
    apRelationship:'maintain', anteroposterior:'',
    elastics:'', openBite:'correct',
    midline:'maintain', ipr:'', biteRamps:'',
    crossbite:'correct', spaces:'close_all',
    spacesNotes:'', extractions:'', specialInstructions:'',
    cbctEnabled: true, wantManufacturing: false,
    material:'taglus', deliveryDate:'',
    additionalInstructions:'', urgent:false,
    noScans:false, consent:false,
  })

  const upd = (k:string, v:any) => setForm(f=>({...f,[k]:v}))
  const marks: OdontogramMark[] = product?.odontogram_marks ?? []
  const currentMark = marks.find(m=>m.id===activeMark) ?? marks[0]
  const selected = Object.keys(odontogram).map(Number).sort((a,b)=>a-b)
  const marksOf = (tooth:number) => (odontogram[tooth] ?? []).map(id=>marks.find(m=>m.id===id)).filter((m): m is OdontogramMark => !!m)
  const toggleTooth = (tooth:number) => setOdontogram(o => {
    const next = { ...o }
    const current = next[tooth]
    if (!currentMark) {
      if (current) delete next[tooth]; else next[tooth] = []
      return next
    }
    if (current?.includes(currentMark.id)) {
      const rest = current.filter(m=>m!==currentMark.id)
      if (rest.length) next[tooth] = rest; else delete next[tooth]
    } else {
      next[tooth] = product?.odontogram_multiple ? [...(current ?? []), currentMark.id] : [currentMark.id]
    }
    return next
  })
  // Each mark with a price is an add-on per tooth it's applied to.
  const addOns = marks.filter(m=>(m.price ?? 0) > 0).map(m=>{
    const count = selected.filter(t=>odontogram[t]?.includes(m.id)).length
    return { mark:m, count, amount: count * (m.price ?? 0) }
  }).filter(a=>a.count>0)

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return
    setFiles(f => [...f, ...Array.from(incoming)])
  }

  const total = (product?.price||50) + (form.cbctEnabled ? 5 : 0) + addOns.reduce((sum,a)=>sum+a.amount, 0)
  const deliveryStartDays = product?.delivery_start_days ?? 3
  const minDeliveryDate = toISODate(new Date(Date.now() + deliveryStartDays * 86400000))
  const estimatedDelivery = new Date(`${form.deliveryDate || minDeliveryDate}T00:00:00`)
  const estimatedDeliveryLabel = estimatedDelivery.toLocaleDateString('en-US', { weekday:'short', day:'numeric', month:'long', year:'numeric' })

  // Same required-field rules as the reference platform, driven by the product's flags.
  const showUpload = product?.has_upload ?? true
  const showPhotos = product?.has_upload_boxes ?? true
  const errors = {
    patient: !form.patientName.trim(),
    doctor: !(product?.has_doctor_optional ?? true) && !form.doctorId,
    deliveryCenter: (product?.has_delivery_center ?? true) && !form.deliveryCenterId,
    deliveryDate: !!form.deliveryDate && form.deliveryDate < minDeliveryDate,
    photos: showPhotos && !(product?.has_upload_boxes_optional ?? true)
      ? PHOTO_ZONES.filter(z=>!photos[z.key]).map(z=>z.key) : [],
    files: showUpload && files.length===0 && !(product?.has_upload_optional && form.noScans),
    consent: !!product?.has_consent && !form.consent,
    odontogram: (product?.has_odontogram ?? true) && !!product?.odontogram_mandatory && selected.length===0,
  }
  const hasErrors = errors.patient || errors.doctor || errors.deliveryCenter || errors.deliveryDate
    || errors.photos.length>0 || errors.files || errors.consent || errors.odontogram

  const handleSubmit = async () => {
    setSubmitted(true)
    if(hasErrors){
      toast.error('Please complete the highlighted fields')
      requestAnimationFrame(()=>document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior:'smooth', block:'center' }))
      return
    }
    setSubmitting(true)
    let order
    try{
      setProgress('Placing order…')
      order = await createOrder.mutateAsync({
        patient_name: form.patientName.trim(),
        product_id: id,
        doctor_id: form.doctorId||undefined,
        delivery_center_id: form.deliveryCenterId||undefined,
        total,
        chief_complain: form.chiefComplain||undefined,
        treat_both_arch: form.treatBothArch,
        treatment_plan_type: form.treatmentPlan,
        dont_move: form.dontMove||undefined,
        ap_relationship: form.apRelationship,
        anteroposterior: form.anteroposterior||undefined,
        elastics: form.elastics||undefined,
        open_bite: form.openBite,
        midline: form.midline,
        ipr: form.ipr||undefined,
        bite_ramps: form.biteRamps||undefined,
        crossbite: form.crossbite,
        spaces: form.spaces,
        special_instructions: form.specialInstructions||undefined,
        cbct_enabled: form.cbctEnabled,
        want_manufacturing: form.wantManufacturing,
        material: form.wantManufacturing?form.material:undefined,
        delivery_on: form.deliveryDate||undefined,
        no_scans: form.noScans,
        consent_accepted: form.consent,
        urgent: form.urgent,
        teeth: selected.length?selected:undefined,
        odontogram: marks.length && selected.length ? odontogram : undefined,
        spaces_notes: form.spacesNotes||undefined,
        extractions: form.extractions||undefined,
        additional_instructions: form.additionalInstructions||undefined,
      })
    }catch{
      toast.error('Failed to place order')
      setSubmitting(false)
      setProgress('')
      return
    }

    // The order exists from here on; a failed upload shouldn't lose it, so
    // report which attachments didn't make it and carry on to the order.
    const uploads = [
      ...Object.entries(photos).map(([slot,file])=>({ file, kind:'photo' as const, slot })),
      ...files.map(file=>({ file, kind:'file' as const, slot:undefined })),
    ]
    const failed: string[] = []
    for(let i=0;i<uploads.length;i++){
      setProgress(`Uploading ${i+1} of ${uploads.length}…`)
      try{ await uploadFile.mutateAsync({ orderId:order.id, ...uploads[i] }) }
      catch{ failed.push(uploads[i].file.name) }
    }
    setSubmitting(false)
    setProgress('')
    if(failed.length) toast.error(`Order placed, but ${failed.length} file(s) failed to upload: ${failed.join(', ')}`, { duration:8000 })
    else toast.success(`Order ${order.ref} placed`)
    navigate('/orders', { state:{ orderId:order.id } })
  }

  const Radio = ({ name, value, current, label }: { name:string; value:string; current:string; label:string }) => (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="radio" name={name} value={value} checked={current===value} onChange={()=>upd(name,value)} className="accent-primary-600"/>
      {label}
    </label>
  )

  const SectionDivider = ({ title }: { title:string }) => (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-surface-200"/>
      <span className="text-xs font-bold text-ink-400 uppercase tracking-widest">{title}</span>
      <div className="flex-1 h-px bg-surface-200"/>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={()=>navigate('/products')} className="btn-ghost p-2 rounded-lg"><ArrowLeft size={18}/></button>
        <div>
          <h2 className="section-title">Place Order</h2>
          <p className="text-muted">{product?.name||'Loading…'} — {total.toFixed(2)} €</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        {[{icon:ShoppingCart,label:'Order',sub:'Your customized product',active:true},{icon:CheckCircle,label:'Finish',sub:'Wait for delivery',active:false}].map(({icon:Icon,label,sub,active},i)=>(
          <div key={i} className={cn('flex items-center gap-3 px-5 py-3 rounded-xl flex-1 border',active?'bg-primary-600 text-white border-primary-600':'bg-white text-ink-400 border-surface-200')}>
            <Icon size={20} className="flex-shrink-0"/><div><p className="text-sm font-semibold">{label}</p><p className="text-xs opacity-70">{sub}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">

          {/* Patient / Doctor / Delivery */}
          <div className="card p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div data-invalid={submitted&&errors.patient}>
                <label className="label">Patient <InfoTip text="Patient name or your system reference"/></label>
                <input className={cn('input', submitted&&errors.patient&&'border-red-500')} placeholder="Patient" list="order-patients" autoComplete="off"
                  value={form.patientName} onChange={e=>upd('patientName',e.target.value)}/>
                <datalist id="order-patients">
                  {patients.map(p=><option key={p.id} value={`${p.first_name} ${p.last_name}`.trim()}/>)}
                </datalist>
                <FieldError show={submitted&&errors.patient}>This field is required</FieldError>
              </div>
              <div data-invalid={submitted&&errors.doctor}>
                <label className="label">Doctor <InfoTip text="This field is used to assign a Doctor for this order"/></label>
                <div className="flex gap-2">
                  <select className={cn('input', submitted&&errors.doctor&&'border-red-500')} value={form.doctorId} onChange={e=>upd('doctorId',e.target.value)}>
                    <option value="">-- Select Doctor --</option>
                    {doctors.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <button type="button" className="btn-secondary btn-sm" onClick={()=>navigate('/settings')}>Add</button>
                </div>
                <FieldError show={submitted&&errors.doctor}>This field is required</FieldError>
              </div>
            </div>
            {(product?.has_delivery_center ?? true) && (
              <div data-invalid={submitted&&errors.deliveryCenter}>
                <label className="label">Delivery Center <InfoTip text="You need to, at least, select one delivery center where this order will be sent"/></label>
                <div className="flex gap-2">
                  <select className={cn('input', submitted&&errors.deliveryCenter&&'border-red-500')} value={form.deliveryCenterId} onChange={e=>upd('deliveryCenterId',e.target.value)}>
                    <option value="">-- Select Delivery Center --</option>
                    {deliveryCenters.map(dc=><option key={dc.id} value={dc.id}>{dc.name}</option>)}
                  </select>
                  <button type="button" className="btn-secondary btn-sm" onClick={()=>navigate('/settings')}>Add</button>
                </div>
                <FieldError show={submitted&&errors.deliveryCenter}>This field is required</FieldError>
              </div>
            )}
            <div data-invalid={submitted&&errors.deliveryDate}>
              <label className="label">Delivery Date <InfoTip text={`The first available delivery date starts in ${deliveryStartDays} days. The default selected date is for the standard delivery.`}/></label>
              <input type="date" className={cn('input', submitted&&errors.deliveryDate&&'border-red-500')} min={minDeliveryDate}
                value={form.deliveryDate || minDeliveryDate} onChange={e=>upd('deliveryDate',e.target.value)}/>
              <FieldError show={submitted&&errors.deliveryDate}>The first available delivery date starts in {deliveryStartDays} days</FieldError>
            </div>
            <Toggle checked={form.urgent} onChange={v=>upd('urgent',v)} label="Urgent order"/>
          </div>

          {/* Odontogram — gated by the product's has_odontogram flag */}
          {(product?.has_odontogram ?? true) && (
          <div className="card p-5" data-invalid={submitted&&errors.odontogram}>
            <div className="flex items-center justify-between mb-4">
              <p className="section-title text-base">Odontogram{product?.odontogram_mandatory && <span className="text-red-500"> *</span>}</p>
              {marks.length>0 && <button type="button" onClick={()=>setLegendOpen(true)} className="text-xs text-primary-600 hover:underline font-medium">View Color Legend</button>}
            </div>
            {marks.length>0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {marks.map(m=>(
                  <button key={m.id} type="button" onClick={()=>setActiveMark(m.id)}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all',
                      currentMark?.id===m.id ? 'border-transparent text-white shadow-sm' : 'border-surface-200 text-ink-600 hover:border-surface-300 bg-white')}
                    style={currentMark?.id===m.id ? { backgroundColor:m.color } : undefined}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentMark?.id===m.id ? '#fff' : m.color }}/>
                    {m.name}{(m.price ?? 0) > 0 && <span className="opacity-80">+{m.price!.toFixed(2)} €</span>}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-ink-400 text-center mb-2 font-medium uppercase tracking-wide">Upper arch</p>
            <div className="flex justify-center gap-0.5 mb-1">
              {UPPER.map(id=><ToothIcon key={id} id={id} selected={id in odontogram} marks={marksOf(id)} onClick={()=>toggleTooth(id)}/>)}
            </div>
            <div className="border-t-2 border-dashed border-surface-200 my-3"/>
            <div className="flex justify-center gap-0.5 mb-1">
              {LOWER.map(id=><ToothIcon key={id} id={id} selected={id in odontogram} marks={marksOf(id)} onClick={()=>toggleTooth(id)}/>)}
            </div>
            <p className="text-[11px] text-ink-400 text-center mt-2 font-medium uppercase tracking-wide">Lower arch</p>
            {selected.length>0&&(
              <div className="mt-3 p-2 bg-amber-50 rounded-xl border border-amber-200 text-center">
                <p className="text-xs text-amber-700 font-semibold">
                  {selected.length} tooth selected: {selected.map(t=>marksOf(t).length?`${t} (${marksOf(t).map(m=>m.name).join(', ')})`:t).join(', ')}
                </p>
              </div>
            )}
            <FieldError show={submitted&&errors.odontogram}>You must select at least one piece in the odontogram</FieldError>
            <Modal open={legendOpen} onClose={()=>setLegendOpen(false)} title="Color Legend" size="sm">
              <div className="space-y-2">
                {marks.map(m=>(
                  <div key={m.id} className="flex items-center gap-3 py-1">
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor:m.color }}/>
                    <span className="text-sm text-ink-800 flex-1">{m.name}</span>
                    <span className="text-sm text-ink-500">{(m.price ?? 0) > 0 ? `+${m.price!.toFixed(2)} € / tooth` : 'Free'}</span>
                  </div>
                ))}
                {product?.odontogram_multiple && (
                  <div className="flex items-center gap-3 py-1 border-t border-surface-100 pt-3">
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor:MULTIPLE_COLOR }}/>
                    <span className="text-sm text-ink-800 flex-1">Multiple selection</span>
                  </div>
                )}
                <p className="text-xs text-ink-400 pt-2">Choose a mark above the odontogram, then click teeth to apply it. Click a tooth again to remove the mark.</p>
              </div>
            </Modal>
          </div>
          )}

          {/* Clinical fields — gated by the product's has_treatment_plan flag */}
          {(product?.has_treatment_plan ?? true) && (
          <div className="card p-5 space-y-5">
            <div><label className="label">Chief Complain</label><textarea className="input min-h-[60px]" value={form.chiefComplain} onChange={e=>upd('chiefComplain',e.target.value)}/></div>
            <div>
              <label className="label">Treat both arch <InfoTip text="Turn on to plan treatment for the upper and lower arch together"/></label>
              <Toggle checked={form.treatBothArch} onChange={v=>upd('treatBothArch',v)} label={form.treatBothArch?'Yes':'No'}/>
            </div>
            <div>
              <label className="label">Treatment plan</label>
              <div className="flex flex-wrap gap-5 mt-2">
                {[['full_arch','Full Arch'],['anterior_only','Anterior Only'],['4_4_only','4 - 4 only'],['no_6_7','Dont Move 6 - 7 only']].map(([v,l])=>(
                  <Radio key={v} name="treatmentPlan" value={v} current={form.treatmentPlan} label={l}/>
                ))}
              </div>
            </div>
            <div><label className="label">Don't move <InfoTip text="Teeth that must not be moved during treatment (e.g. 17, 27)"/></label><input className="input" value={form.dontMove} onChange={e=>upd('dontMove',e.target.value)}/></div>
            <div>
              <label className="label">AP Relationship</label>
              <div className="flex flex-wrap gap-5 mt-2">
                {[['maintain','Maintain'],['canine_only','Improve canine only'],['canine_molar','Improve canine and molar'],['both','Correct both Molar and Canine']].map(([v,l])=>(
                  <Radio key={v} name="apRelationship" value={v} current={form.apRelationship} label={l}/>
                ))}
              </div>
            </div>
            <div><label className="label">Anteroposterior relationship <InfoTip text="Notes on the front-to-back relationship between the arches"/></label><input className="input" placeholder="Notes…" value={form.anteroposterior} onChange={e=>upd('anteroposterior',e.target.value)}/></div>
            <div><label className="label">Elástics <InfoTip text="Elastics the patient should wear, if any (type and position)"/></label><input className="input" value={form.elastics} onChange={e=>upd('elastics',e.target.value)}/></div>
            <div>
              <label className="label">Open Bite</label>
              <div className="flex gap-5 mt-2">
                {[['correct','Correct'],['maintain','Maintain'],['improved','Improved.']].map(([v,l])=>(
                  <Radio key={v} name="openBite" value={v} current={form.openBite} label={l}/>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Midline</label>
              <div className="flex gap-5 mt-2">
                {[['maintain','Maintain'],['correct','Correct']].map(([v,l])=>(
                  <Radio key={v} name="midline" value={v} current={form.midline} label={l}/>
                ))}
              </div>
            </div>
            <div><label className="label">IPR <InfoTip text="Interproximal reduction allowed or required (teeth and amount)"/></label><input className="input" value={form.ipr} onChange={e=>upd('ipr',e.target.value)}/></div>
            <div><label className="label">Bite Ramps <InfoTip text="Where bite ramps should be placed, if any"/></label><input className="input" value={form.biteRamps} onChange={e=>upd('biteRamps',e.target.value)}/></div>
            <div>
              <label className="label">Crossbite</label>
              <div className="flex flex-wrap gap-5 mt-2">
                {[['correct','Correct'],['maintain','Maintain'],['anterior','Correct only anterior'],['posterior','Correct only posterior']].map(([v,l])=>(
                  <Radio key={v} name="crossbite" value={v} current={form.crossbite} label={l}/>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Spaces</label>
              <div className="flex gap-5 mt-2">
                {[['close_all','Close all spaces'],['maintain','Maintain spaces']].map(([v,l])=>(
                  <Radio key={v} name="spaces" value={v} current={form.spaces} label={l}/>
                ))}
              </div>
            </div>
            <div><label className="label">Spaces <InfoTip text="Specific notes about closing or keeping spaces"/></label><input className="input" value={form.spacesNotes} onChange={e=>upd('spacesNotes',e.target.value)}/></div>
            <div><label className="label">Extractions <InfoTip text="Teeth to be extracted as part of the treatment"/></label><input className="input" value={form.extractions} onChange={e=>upd('extractions',e.target.value)}/></div>
            <div><label className="label">Special Instructions</label><textarea className="input min-h-[80px]" value={form.specialInstructions} onChange={e=>upd('specialInstructions',e.target.value)}/></div>
          </div>
          )}

          {/* CBCT Toggle */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-ink-900">WE SEGMENT CBCT</span>
                <span className="ml-2 text-sm text-primary-600 font-semibold">(+€5,00)</span>
                <InfoTip className="ml-1" text="We will segment your CBCT scan"/>
              </div>
              <Toggle checked={form.cbctEnabled} onChange={v=>upd('cbctEnabled',v)} label="Enabled"/>
            </div>
          </div>

          {/* Manufacture section */}
          <div className="card p-5 space-y-4">
            <SectionDivider title="Manufacture"/>
            <p className="text-sm text-ink-500 border-l-4 border-primary-400 pl-3">If you want manufacturing, select this option</p>
            <Toggle checked={form.wantManufacturing} onChange={v=>upd('wantManufacturing',v)} label="You want Manufacturing"/>
            {form.wantManufacturing && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="label text-xs uppercase tracking-wide text-ink-400">Materials</label>
                  <div className="flex gap-5 mt-2">
                    {[['taglus','TAGLUS'],['zendura','ZENDURA'],['none','NO MANUFACTURING']].map(([v,l])=>(
                      <Radio key={v} name="material" value={v} current={form.material} label={l}/>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="label">Additional Instructions</label>
              <textarea className="input min-h-[100px]" placeholder="Additional Instructions" value={form.additionalInstructions} onChange={e=>upd('additionalInstructions',e.target.value)}/>
            </div>
          </div>

          {/* Detailed photos of teeth — gated by the product's has_upload_boxes flag */}
          {(product?.has_upload_boxes ?? true) && (
          <div className="card p-5">
            <p className="section-title text-base mb-1">Detailed photos of teeth <InfoTip text="Upload detailed photos of teeth from different angles"/></p>
            <p className="text-xs text-ink-400 mb-4">Upload clear photos from each angle for accurate treatment planning</p>
            <div className="grid grid-cols-3 gap-4" data-invalid={submitted&&errors.photos.length>0}>
              {PHOTO_ZONES.map(zone => (
                <PhotoUpload
                  key={zone.key}
                  label={zone.label}
                  infoTip={zone.help}
                  file={photos[zone.key]}
                  error={submitted && errors.photos.includes(zone.key)}
                  onFile={f => setPhotos(p => ({...p, [zone.key]: f}))}
                />
              ))}
            </div>
            {Object.keys(photos).length > 0 && (
              <div className="mt-3 p-2 bg-teal-50 rounded-xl border border-teal-200">
                <p className="text-xs text-teal-700 font-semibold">✓ {Object.keys(photos).length} photo{Object.keys(photos).length>1?'s':''} uploaded: {Object.keys(photos).map(k=>k).join(', ')}</p>
              </div>
            )}
          </div>
          )}

          {/* Files upload — gated by the product's has_upload flag */}
          {showUpload && (
          <div className="card p-5" data-invalid={submitted&&errors.files}>
            <p className="section-title text-base mb-1">Files <InfoTip text="Upload the scanned files. You can upload a Zip or multiple files unzipped with the next formats/extensions: *.stl, *.ply, *.obj, *.zip, *.pdf and all types of images & videos"/></p>
            <p className="text-xs text-ink-400 mb-4">You can upload a Zip or multiple files unzipped with the next formats/extensions: *.stl, *.ply, *.obj, *.zip, *.pdf and all types of images & videos</p>
            <div
              onDragOver={e=>{e.preventDefault();setDraggingFiles(true)}}
              onDragLeave={()=>setDraggingFiles(false)}
              onDrop={e=>{e.preventDefault();setDraggingFiles(false);handleFiles(e.dataTransfer.files)}}
              onClick={()=>filesRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl cursor-pointer transition-all py-12 flex flex-col items-center justify-center gap-3',
                draggingFiles ? 'border-primary-500 bg-primary-50' : submitted&&errors.files ? 'border-red-400 bg-red-50/40' : 'border-primary-300 bg-primary-50/20 hover:bg-primary-50'
              )}
            >
              <Upload size={36} className={cn('transition-colors', draggingFiles ? 'text-primary-600' : 'text-primary-400')}/>
              <p className="text-sm font-bold text-primary-500 uppercase tracking-wide">Click or drop files here to upload</p>
              <input ref={filesRef} type="file" multiple accept=".stl,.ply,.obj,.zip,.pdf,image/*,video/*" className="hidden" onChange={e=>handleFiles(e.target.files)}/>
            </div>
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((f,i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-200">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-[10px] font-mono font-bold text-primary-700 uppercase">
                      {f.name.split('.').pop()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{f.name}</p>
                      <p className="text-xs text-ink-400">{(f.size/1e6).toFixed(2)} MB</p>
                    </div>
                    <button onClick={()=>setFiles(fs=>fs.filter((_,j)=>j!==i))} className="text-ink-300 hover:text-red-500 p-1 transition-colors">
                      <X size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <FieldError show={submitted&&errors.files}>You must upload at least one Zip file or multiple files unzipped</FieldError>
            {product?.has_upload_optional && (
              <label className="flex items-center gap-2 mt-4 text-sm text-ink-700 cursor-pointer">
                <input type="checkbox" className="accent-primary-600" checked={form.noScans} onChange={e=>upd('noScans',e.target.checked)}/>
                I don't have scanned files but I'll send the models via Postal Mail
              </label>
            )}
          </div>
          )}

          {/* Consent — gated by the product's has_consent flag */}
          {product?.has_consent && (
          <div className="card p-5" data-invalid={submitted&&errors.consent}>
            <p className="section-title text-base mb-3">Mandatory Consent</p>
            <label className="flex items-start gap-2 text-sm text-ink-700 cursor-pointer">
              <input type="checkbox" className="accent-primary-600 mt-0.5" checked={form.consent} onChange={e=>upd('consent',e.target.checked)}/>
              <span>By checking and accepting the order I declare that I have informed the patient and they have signed the consent document</span>
            </label>
            <FieldError show={submitted&&errors.consent}>You must have read and approved the consent document</FieldError>
          </div>
          )}

        </div>

        {/* Order Summary sidebar */}
        <div>
          <div className="card p-5 sticky top-4 space-y-4">
            <p className="font-semibold text-ink-900">Order Details</p>
            <div className="text-sm space-y-1">
              <p className="text-ink-500">Delivery on <span className="text-primary-600 font-semibold">{estimatedDeliveryLabel}</span></p>
              <p className="text-ink-500">Order by <span className="text-primary-600 font-semibold">{doctors.find(d=>d.id===form.doctorId)?.name||'—'}</span></p>
            </div>
            <div className="divider"/>
            <p className="font-semibold text-ink-900">Price Details</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-600">{product?.name||'Product'}</span><span className="font-medium">{(product?.price||50).toFixed(2)} €</span></div>
              {form.cbctEnabled && <div className="flex justify-between"><span className="text-ink-600">WE SEGMENT CBCT</span><span className="font-medium">5,00 €</span></div>}
              {addOns.length>0 && <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide pt-1">Add-ons</p>}
              {addOns.map(a=>(
                <div key={a.mark.id} className="flex justify-between"><span className="text-ink-600">{a.mark.name} × {a.count}</span><span className="font-medium">{a.amount.toFixed(2)} €</span></div>
              ))}
              <div className="flex justify-between"><span className="text-ink-600">Standard Delivery</span><span className="font-semibold text-teal-600">Free</span></div>
            </div>
            <div className="divider"/>
            <div className="flex justify-between font-bold text-ink-900 text-lg">
              <span>Total</span><span>{total.toFixed(2)} €</span>
            </div>
            <button
              className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
              disabled={submitting}
              onClick={handleSubmit}>
              {submitting?(progress||'Placing order…'):'Place Order'}
            </button>

            {/* Upload summary */}
            {(Object.keys(photos).length > 0 || files.length > 0) && (
              <div className="pt-2 border-t border-surface-100 space-y-1.5 text-xs text-ink-500">
                {Object.keys(photos).length > 0 && (
                  <div className="flex items-center gap-2">
                    <Image size={12} className="text-teal-500"/>
                    <span>{Object.keys(photos).length} photo{Object.keys(photos).length>1?'s':''} attached</span>
                  </div>
                )}
                {files.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-primary-500"/>
                    <span>{files.length} file{files.length>1?'s':''} attached</span>
                  </div>
                )}
                {selected.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500">🦷</span>
                    <span>{selected.length} tooth selected</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
