import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Upload, X, FileText, Plus, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '../lib/utils'
import { useProduct } from '../lib/queries/products'
import { usePatients } from '../lib/queries/patients'
import { useDoctors } from '../lib/queries/doctors'
import { useDeliveryCenters } from '../lib/queries/deliveryCenters'
import { useCompanySettings } from '../lib/queries/company'
import { useCreateOrder, useModifyOrder, useOrder, useUploadOrderFile } from '../lib/queries/orders'
import type { OdontogramMark, Product } from '../lib/queries/products'
import type { Order } from '../lib/queries/orders'
import Odontogram from '../components/order/Odontogram'
import InfoTip from '../components/ui/InfoTip'
import { Spinner } from '../components/ui'
import { OrderStepper, ProductHeader, ProductOptionsForm, PriceDetails } from '../components/order/OrderParts'
import { deliveryAddress, optionDefaults, optionErrors, pricedOptions, toAnswers, type OptionValues } from '../lib/orderOptions'

// Order form laid out like the reference platform's checkout: stepper, product
// card, Patient | Doctor, Delivery Center, odontogram, the product's own
// options, delivery date, additional instructions, photos, files, consent —
// with Order Details / Price Details / Place Order on the right.

const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

function FieldError({ show, children }: { show:boolean; children:React.ReactNode }) {
  return show ? <p className="text-xs text-red-500 mt-1">{children}</p> : null
}

const PHOTO_ZONES = [
  { label: 'Right', key: 'right', help: 'Upload an image of the right side of the teeth, clearly showing the lateral molar area.' },
  { label: 'Front', key: 'front', help: 'Upload a frontal image, centered on the incisors and showing the full smile.' },
  { label: 'Left', key: 'left', help: 'Upload an image of the left side of the teeth, clearly showing the lateral molar area.' },
  { label: 'Upper', key: 'upper', help: 'Upload an image of the entire upper arch from an occlusal angle.' },
  { label: 'Lower', key: 'lower', help: 'Upload an image of the entire lower arch from an occlusal angle.' },
  { label: 'Orthopantomography', key: 'ortho', help: 'Upload the panoramic X-ray of the complete denture (Orthopantomography).' },
]

function PhotoUpload({ label, infoTip, onFile, file, existingUrl, error }: { label:string; infoTip?:string; onFile:(f:File)=>void; file?:File; existingUrl?:string; error?:boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const preview = useMemo(() => file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null, [file])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const shown = preview ?? (!file ? existingUrl : undefined)
  return (
    <div>
      <label className="label">{label} {infoTip && <InfoTip text={infoTip}/>}</label>
      <button type="button" onClick={() => ref.current?.click()}
        className={cn('w-full border-2 border-dashed rounded-[0.428rem] transition-all h-36 flex flex-col items-center justify-center gap-2 group',
          file || existingUrl ? 'border-teal-400 bg-teal-50' : error ? 'border-red-400 bg-red-50/40' : 'border-primary-300 bg-primary-50/30 hover:bg-primary-50')}>
        {shown ? <img src={shown} alt={label} className="h-28 w-full object-cover rounded-md"/>
          : file ? <span className="flex flex-col items-center gap-1"><FileText size={28} className="text-teal-500"/><span className="text-xs text-teal-700 truncate max-w-[120px]">{file.name}</span></span>
          : <><Upload size={28} className="text-primary-400 group-hover:text-primary-600"/><span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">{label}</span></>}
      </button>
      <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}/>
      <FieldError show={!!error}>This image is mandatory</FieldError>
    </div>
  )
}

// What a modified order starts from: its saved answers, falling back to the product defaults.
function initialValues(product?:Product|null, existing?:Order|null): OptionValues {
  const options = product?.options ?? []
  const v = optionDefaults(options)
  if (!existing) return v
  for (const o of options) {
    if (o.type === 'SECTION') continue
    const a = (existing.options ?? []).find(x => x.id === o.id)
    if (o.type === 'BOOLEAN') v[o.id] = !!a && (a.value === true || a.value === 'true')
    else if (a) v[o.id] = o.multiple ? String(a.value).split(',').filter(Boolean) : String(a.value)
  }
  return v
}

export default function OrderForm() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const editId = search.get('edit') ?? undefined
  const { data:product, isLoading } = useProduct(id)
  const { data:existing, isLoading:loadingOrder } = useOrder(editId)
  if (isLoading || (editId && loadingOrder)) return <div className="flex justify-center py-24"><Spinner/></div>
  return <OrderFormBody key={`${id}:${existing?.id ?? 'new'}`} productId={id} product={product} existing={editId ? existing : undefined}/>
}

function OrderFormBody({ productId:id, product, existing }: { productId?:string; product?:Product; existing?:Order }) {
  const editId = existing?.id
  const navigate = useNavigate()
  const { data:patients=[] } = usePatients()
  const { data:doctors=[] } = useDoctors()
  const { data:deliveryCenters=[] } = useDeliveryCenters()
  const { data:company } = useCompanySettings()
  const createOrder = useCreateOrder(), modifyOrder = useModifyOrder(), uploadFile = useUploadOrderFile()
  const [progress, setProgress] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [odontogram, setOdontogram] = useState<Record<number, string[]>>(() =>
    Object.fromEntries((existing?.teeth ?? []).map(t => [t, existing?.odontogram?.[t] ?? ['selected']])))
  const [photos, setPhotos] = useState<Record<string, File>>({})
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const filesRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(() => ({
    patientName: existing?.patient ? `${existing.patient.first_name} ${existing.patient.last_name}`.trim() : '',
    doctorId: existing?.doctor_id ?? '', deliveryCenterId: existing?.delivery_center_id ?? '',
    deliveryDate: existing?.delivery_on?.slice(0,10) ?? '', additionalInstructions: existing?.additional_instructions ?? '',
    noScans: existing?.no_scans ?? false, consent: existing?.consent_accepted ?? false,
  }))
  const [values, setValues] = useState<OptionValues>(() => initialValues(product, existing))
  const [now] = useState(() => Date.now())
  const upd = <K extends keyof typeof form>(k:K, v:(typeof form)[K]) => setForm(f=>({ ...f, [k]:v }))

  const options = product?.options ?? []
  const marks: OdontogramMark[] = product?.odontogram_marks ?? []
  const selected = Object.keys(odontogram).map(Number).sort((a,b)=>a-b)
  const markLines = marks.filter(m=>(m.price ?? 0) > 0).map(m => {
    const count = selected.filter(t=>odontogram[t]?.includes(m.id)).length
    return { key:`mark:${m.id}`, label:`${m.name} × ${count}`, cost: count * (m.price ?? 0) }
  }).filter(l => l.cost > 0)
  const lines = [...pricedOptions(options, values), ...markLines]
  const total = (product?.price ?? 0) + lines.reduce((s,l)=>s+l.cost, 0)

  const deliveryStartDays = product?.delivery_start_days ?? 3
  const minDeliveryDate = toISODate(new Date(now + deliveryStartDays * 86400000))
  const deliveryDate = form.deliveryDate || minDeliveryDate
  const deliveryLabel = new Date(`${deliveryDate}T00:00:00`).toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const doctor = doctors.find(d=>d.id===form.doctorId)
  const center = deliveryCenters.find(c=>c.id===form.deliveryCenterId)
  const existingPhoto = (slot:string) => existing?.files.find(f=>f.kind==='photo' && f.slot===slot)?.url
  const existingFiles = existing?.files.filter(f=>f.kind==='file') ?? []

  const showUpload = product?.has_upload ?? true
  const showPhotos = product?.has_upload_boxes ?? true
  const optErrors = optionErrors(options, values)
  const errors = {
    patient: !form.patientName.trim(),
    doctor: !(product?.has_doctor_optional ?? true) && !form.doctorId,
    deliveryCenter: (product?.has_delivery_center ?? true) && !form.deliveryCenterId,
    deliveryDate: deliveryDate < minDeliveryDate,
    photos: showPhotos && !(product?.has_upload_boxes_optional ?? true) ? PHOTO_ZONES.filter(z=>!photos[z.key] && !existingPhoto(z.key)).map(z=>z.key) : [],
    files: showUpload && !(product?.has_upload_optional) && files.length + existingFiles.length === 0 && !form.noScans,
    consent: !!product?.has_consent && !form.consent,
    odontogram: (product?.has_odontogram ?? true) && !!product?.odontogram_mandatory && selected.length===0,
  }
  const hasErrors = errors.patient || errors.doctor || errors.deliveryCenter || errors.deliveryDate || errors.photos.length>0
    || errors.files || errors.consent || errors.odontogram || Object.keys(optErrors).length > 0

  const handleSubmit = async () => {
    setSubmitted(true)
    if (hasErrors) {
      toast.error('Please complete the highlighted fields')
      requestAnimationFrame(()=>document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior:'smooth', block:'center' }))
      return
    }
    setSubmitting(true); setProgress(editId ? 'Saving…' : 'Placing order…')
    const body = {
      patient_name: form.patientName.trim(), product_id: id,
      doctor_id: form.doctorId || undefined, delivery_center_id: form.deliveryCenterId || undefined,
      delivery_on: deliveryDate, additional_instructions: form.additionalInstructions || undefined,
      no_scans: form.noScans, consent_accepted: form.consent,
      teeth: selected.length ? selected : undefined,
      odontogram: marks.length && selected.length ? odontogram : undefined,
      options: toAnswers(options, values), total,
    }
    let order
    try { order = editId ? await modifyOrder.mutateAsync({ id: editId, ...body }) : await createOrder.mutateAsync(body) }
    catch (e) {
      const detail = (e as { response?:{ data?:{ detail?:string } } }).response?.data?.detail
      toast.error(detail ?? (editId ? 'Failed to modify the order' : 'Failed to place order'))
      setSubmitting(false); setProgress(''); return
    }
    // The order exists from here on; a failed upload shouldn't lose it.
    const uploads = [
      ...Object.entries(photos).map(([slot,file])=>({ file, kind:'photo' as const, slot })),
      ...files.map(file=>({ file, kind:'file' as const, slot:undefined })),
    ]
    const failed: string[] = []
    for (let i = 0; i < uploads.length; i++) {
      setProgress(`Uploading ${i+1} of ${uploads.length}…`)
      try { await uploadFile.mutateAsync({ orderId: order.id, ...uploads[i] }) } catch { failed.push(uploads[i].file.name) }
    }
    setSubmitting(false); setProgress('')
    if (failed.length) toast.error(`Order saved, but ${failed.length} file(s) failed to upload: ${failed.join(', ')}`, { duration:8000 })
    else toast.success(editId ? `Order ${order.ref} modified` : `Order ${order.ref} placed`)
    navigate(`/orders/${order.id}`)
  }

  return (
    <div className="animate-fade-in">
      <OrderStepper step="order"/>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-[2rem] items-start">
        <div className="card">
          <div className="p-[1.5rem]"><ProductHeader product={product}/></div>
          <div className="px-[1.5rem] pb-[1.5rem] space-y-[1.2rem]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div data-invalid={submitted&&errors.patient}>
                <label className="label" htmlFor="patient">Patient <InfoTip text="Patient name or your system reference"/></label>
                <input id="patient" className={cn('input', submitted&&errors.patient&&'border-red-500')} placeholder="Patient" maxLength={65} list="order-patients" autoComplete="off"
                  value={form.patientName} onChange={e=>upd('patientName', e.target.value)}/>
                <datalist id="order-patients">{patients.map(p=><option key={p.id} value={`${p.first_name} ${p.last_name}`.trim()}/>)}</datalist>
                <FieldError show={submitted&&errors.patient}>This field is required</FieldError>
              </div>
              <div data-invalid={submitted&&errors.doctor}>
                <label className="label" htmlFor="doctor">Doctor <InfoTip text="This field is used to assign a Doctor for this order"/></label>
                <div className="flex gap-2">
                  <select id="doctor" className={cn('input', submitted&&errors.doctor&&'border-red-500')} value={form.doctorId} onChange={e=>upd('doctorId', e.target.value)}>
                    <option value="">Select</option>
                    {doctors.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <button type="button" className="btn-primary btn-sm whitespace-nowrap gap-1" onClick={()=>navigate('/settings')}><Plus size={14}/>Add</button>
                </div>
                <FieldError show={submitted&&errors.doctor}>This field is required</FieldError>
              </div>
            </div>

            {(product?.has_delivery_center ?? true) && (
              <div data-invalid={submitted&&errors.deliveryCenter}>
                <label className="label" htmlFor="deliveryCenter">Delivery Center <InfoTip text="You need to, at least, select one delivery center where this order will be sent"/></label>
                <div className="flex gap-2">
                  <select id="deliveryCenter" className={cn('input', submitted&&errors.deliveryCenter&&'border-red-500')} value={form.deliveryCenterId} onChange={e=>upd('deliveryCenterId', e.target.value)}>
                    <option value="">Select</option>
                    {deliveryCenters.map(dc=><option key={dc.id} value={dc.id}>{dc.name}{deliveryAddress(dc) ? ` — ${deliveryAddress(dc)}` : ''}</option>)}
                  </select>
                  <button type="button" className="btn-primary btn-sm whitespace-nowrap gap-1" onClick={()=>navigate('/settings')}><Plus size={14}/>Add</button>
                </div>
                <FieldError show={submitted&&errors.deliveryCenter}>This field is required</FieldError>
              </div>
            )}

            {(product?.has_odontogram ?? true) && (
              <div data-invalid={submitted&&errors.odontogram}>
                <p className="text-ink-900 mb-2">Odontogram{product?.odontogram_mandatory && <span className="text-red-500"> *</span>}</p>
                <Odontogram marks={marks} value={odontogram} onChange={setOdontogram} multiple={!!product?.odontogram_multiple}/>
                <FieldError show={submitted&&errors.odontogram}>You must select at least one piece in the odontogram</FieldError>
              </div>
            )}

            {options.length > 0 && (
              <ProductOptionsForm options={options} values={values} errors={optErrors} submitted={submitted}
                onChange={(k,v)=>setValues(s=>({ ...s, [k]:v }))}/>
            )}

            <div className="max-w-xs" data-invalid={submitted&&errors.deliveryDate}>
              <label className="label" htmlFor="deliveryDate">Delivery Date <InfoTip text={`The first available delivery date starts in ${deliveryStartDays} days. The default selected date is for the standard delivery.`}/></label>
              <div className="flex">
                <input ref={dateRef} id="deliveryDate" type="date" className={cn('input rounded-r-none', submitted&&errors.deliveryDate&&'border-red-500')} min={minDeliveryDate}
                  value={deliveryDate} onChange={e=>upd('deliveryDate', e.target.value)}/>
                <button type="button" aria-label="Open calendar" className="px-3 border border-l-0 border-ink-500 text-ink-500 rounded-r-[0.357rem] hover:bg-[#82868b0a]"
                  onClick={()=>dateRef.current?.showPicker?.()}><Calendar size={16}/></button>
              </div>
              <FieldError show={submitted&&errors.deliveryDate}>The first available delivery date starts in {deliveryStartDays} days</FieldError>
            </div>

            <div className="flex rounded-[0.357rem] border border-surface-300 focus-within:border-primary-600 overflow-hidden">
              <label htmlFor="observation" className="px-4 py-2 bg-surface-50 border-r border-surface-300 text-ink-700 flex items-center whitespace-nowrap">Additional Instructions</label>
              <textarea id="observation" rows={3} maxLength={5000} className="flex-1 px-4 py-2 outline-none resize-y text-ink-700"
                value={form.additionalInstructions} onChange={e=>upd('additionalInstructions', e.target.value)}/>
            </div>

            {showPhotos && (
              <div>
                <p className="text-ink-900 font-medium mb-1">Detailed photos of teeth <InfoTip text="Upload detailed photos of teeth from different angles"/></p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-invalid={submitted&&errors.photos.length>0}>
                  {PHOTO_ZONES.map(z => <PhotoUpload key={z.key} label={z.label} infoTip={z.help} file={photos[z.key]} existingUrl={existingPhoto(z.key)}
                    error={submitted && errors.photos.includes(z.key)} onFile={f=>setPhotos(p=>({ ...p, [z.key]: f }))}/>)}
                </div>
              </div>
            )}

            {product?.has_upload_optional && (
              <div>
                <p className="text-ink-900 font-medium">Pick up Physical Models <InfoTip text="Place the models identified with the order reference in a suitable and protected container to prevent breakage during transport. The courier company will automatically pick up the package as soon as possible."/></p>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" className="accent-primary-600 w-[1.15rem] h-[1.15rem]" checked={form.noScans} onChange={e=>upd('noScans', e.target.checked)}/>
                  If you do not have digital models or scanned files, we will request collection of physical models.
                </label>
              </div>
            )}

            {showUpload && (
              <div data-invalid={submitted&&errors.files}>
                <p className="text-ink-900 font-medium mb-2">Files <InfoTip text="Upload the scaned files. You can upload a Zip or multiple files unzipped with the next formats/extensions: *.stl, *.ply, *.obj, *.zip, *.pdf and all types of images & videos"/></p>
                <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)}
                  onDrop={e=>{e.preventDefault();setDragging(false);setFiles(f=>[...f, ...Array.from(e.dataTransfer.files)])}}
                  onClick={()=>filesRef.current?.click()} role="button" tabIndex={0}
                  className={cn('border-2 border-dashed rounded-[0.428rem] cursor-pointer transition-all py-10 flex flex-col items-center justify-center gap-3',
                    dragging ? 'border-primary-600 bg-primary-50' : submitted&&errors.files ? 'border-red-400 bg-red-50/40' : 'border-primary-300 bg-primary-50/20 hover:bg-primary-50')}>
                  <Upload size={34} className="text-primary-500"/>
                  <p className="font-semibold text-primary-600 uppercase tracking-wide">Click or Drop Files Here To Upload</p>
                  <input ref={filesRef} type="file" multiple accept=".stl,.ply,.obj,.zip,.pdf,image/*,video/*" className="hidden" onChange={e=>setFiles(f=>[...f, ...Array.from(e.target.files ?? [])])}/>
                </div>
                {(existingFiles.length > 0 || files.length > 0) && (
                  <table className="w-full mt-3 text-sm">
                    <thead><tr><th className="text-left px-3 py-2 uppercase">File Name</th><th className="text-left px-3 py-2 uppercase">Size</th><th className="px-3 py-2 uppercase text-right">Actions</th></tr></thead>
                    <tbody>
                      {existingFiles.map(f=>(
                        <tr key={f.id} className="table-row"><td className="px-3 py-2"><a href={f.url} target="_blank" rel="noreferrer">{f.file_name}</a></td><td className="px-3 py-2">{(f.file_size/1e6).toFixed(2)} MB</td><td className="px-3 py-2 text-right text-teal-600">Uploaded</td></tr>
                      ))}
                      {files.map((f,i)=>(
                        <tr key={i} className="table-row"><td className="px-3 py-2">{f.name}</td><td className="px-3 py-2">{(f.size/1e6).toFixed(2)} MB</td>
                          <td className="px-3 py-2 text-right"><button type="button" aria-label={`Remove ${f.name}`} onClick={()=>setFiles(fs=>fs.filter((_,j)=>j!==i))} className="text-red-500 p-1"><X size={14}/></button></td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <FieldError show={submitted&&errors.files}>You must upload at least one Zip file or multiple files unzipped</FieldError>
              </div>
            )}

            {product?.has_consent && (
              <div data-invalid={submitted&&errors.consent}>
                <p className="text-ink-900 font-medium">Mandatory Consent</p>
                <label className="flex items-start gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" className="accent-primary-600 w-[1.15rem] h-[1.15rem] mt-0.5" checked={form.consent} onChange={e=>upd('consent', e.target.checked)}/>
                  <span>By checking and accepting the order I declare that I have informed the patient and they have signed the consent document</span>
                </label>
                <FieldError show={submitted&&errors.consent}>You must have read and approved the consent document</FieldError>
              </div>
            )}
          </div>
        </div>

        {/* checkout-options */}
        <div className="card p-[1.5rem] xl:sticky xl:top-0">
          <h6 className="font-semibold text-ink-900 mb-3">Order Details</h6>
          <ul className="space-y-2.5 text-ink-700">
            {center && (
              <li>Delivery Address <strong className="capitalize">{company?.company_name ?? ''}{center.name ? ` (${center.name})` : ''}</strong>
                {deliveryAddress(center) && <div className="text-sm text-ink-500">{deliveryAddress(center)}</div>}</li>
            )}
            <li>Delivery on <span className="text-teal-600 capitalize">{deliveryLabel}</span></li>
            {(doctor || form.patientName) && (
              <li>{doctor && <>Order by <span className="text-teal-600">{doctor.name}</span> </>}{form.patientName && <>for patient <strong className="capitalize">{form.patientName}</strong></>}</li>
            )}
          </ul>
          <hr className="my-4 border-surface-200"/>
          <h6 className="font-semibold text-ink-900 mb-3">Price Details</h6>
          <PriceDetails productName={product?.name ?? 'Product'} productPrice={product?.price ?? 0} lines={lines} total={total}/>
          <button type="button" className="btn-primary w-full mt-5" disabled={submitting} onClick={handleSubmit}>
            {submitting && <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"/>}
            {submitting ? (progress || 'Placing order…') : editId ? 'Modify Order' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
