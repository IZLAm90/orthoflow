import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ClipboardList, List, Pencil, Printer, FileText, Eye, Download, ListPlus } from 'lucide-react'
import { cn } from '../lib/utils'
import { Spinner, Modal } from '../components/ui'
import { useOrder } from '../lib/queries/orders'
import { useCreateInvoice } from '../lib/queries/invoices'
import { useAuthStore } from '../stores/authStore'
import { useAddObservation } from '../lib/queries/treatmentPlans'
import Odontogram from '../components/order/Odontogram'
import TreatmentPlansTable from '../components/treatment/TreatmentPlansTable'
import TreatmentPlanModal from '../components/treatment/TreatmentPlanModal'
import { OrderStepper, ProductImage, Rating, SuccessCheckmark, PriceDetails } from '../components/order/OrderParts'
import { deliveryAddress } from '../lib/orderOptions'
import { Panel, Timeline, ChatInput } from '../components/order/Panels'

// Finished-order screen (reference: checkout "Finish" step / details/:product/:order).

const SUMMARY: Record<string,string> = {
  plan_pending: 'Order pending treatment approval',
  processing: 'Order In Progress',
  finished: 'Order finished',
}
const LEGACY_LABELS: Record<string, Record<string,string>> = {
  treatment_plan_type: { full_arch:'Full Arch', anterior_only:'Anterior Only', '4_4_only':'4 - 4 only', no_6_7:'Dont Move 6 - 7 only' },
  ap_relationship: { maintain:'Maintain', canine_only:'Improve canine only', canine_molar:'Improve canine and molar', both:'Correct both Molar and Canine' },
  open_bite: { correct:'Correct', maintain:'Maintain', improved:'Improved' },
  midline: { maintain:'Maintain', correct:'Correct' },
  crossbite: { correct:'Correct', maintain:'Maintain', anterior:'Correct only anterior', posterior:'Correct only posterior' },
  spaces: { close_all:'Close all spaces', maintain:'Maintain spaces' },
}

export default function OrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore(s=>s.user)
  const isLab = user?.role === 'admin'
  const { data:order, isLoading, isError } = useOrder(orderId)
  const createInvoice = useCreateInvoice(), addObs = useAddObservation()
  const [message, setMessage] = useState('')
  const [photosOpen, setPhotosOpen] = useState(false)
  const [newPlan, setNewPlan] = useState(false)

  if (isLoading) return <div className="flex justify-center py-24"><Spinner/></div>
  if (isError || !order) return <div className="card p-10 text-center">Order not found. <button className="text-primary-600 underline" onClick={()=>navigate('/orders')}>View Orders</button></div>

  const patient = order.patient ? `${order.patient.first_name} ${order.patient.last_name}`.trim() : ''
  const photos = order.files.filter(f=>f.kind==='photo')
  const files = order.files.filter(f=>f.kind==='file')
  const center = order.delivery_center
  const deliveryOn = order.delivery_on ? new Date(order.delivery_on).toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) : null

  // "Options Selected": the product-option snapshot, or the legacy columns for older orders.
  const optionLines: [string,string][] = order.options?.length
    ? order.options.map(o => [o.title, o.label])
    : ([
        ['Chief Complain', order.chief_complain], ['Treat both arch', order.treat_both_arch ? 'yes' : null],
        ['Treatment plan', order.treatment_plan_type && LEGACY_LABELS.treatment_plan_type[order.treatment_plan_type]],
        ['AP Relationship', order.ap_relationship && LEGACY_LABELS.ap_relationship[order.ap_relationship]],
        ['Open Bite', order.open_bite && LEGACY_LABELS.open_bite[order.open_bite]], ['Midline', order.midline && LEGACY_LABELS.midline[order.midline]],
        ['Crossbite', order.crossbite && LEGACY_LABELS.crossbite[order.crossbite]], ['Spaces', order.spaces && LEGACY_LABELS.spaces[order.spaces]],
        ['IPR', order.ipr], ['Extractions', order.extractions], ['Special Instructions', order.special_instructions],
      ].filter(([,v]) => v) as [string,string][])
  const priceLines = (order.options ?? []).filter(o => o.cost > 0).map(o => ({ key:o.id, label:o.type === 'BOOLEAN' ? o.title : `${o.title}: ${o.label}`, cost:o.cost }))
  const productPrice = order.product?.price ?? Math.max(0, order.total - priceLines.reduce((s,l)=>s+l.cost,0))

  const openInvoice = async () => {
    let id = order.invoice_id
    if (!id) { try { id = (await createInvoice.mutateAsync({ order_ids:[order.id] })).id } catch { toast.error('Could not create the invoice'); return } }
    navigate('/invoices', { state:{ invoiceId:id } })
  }
  const send = async () => {
    if (!message.trim()) return
    try { await addObs.mutateAsync({ orderId: order.id, user_name: user?.name ?? 'User', message: message.trim() }); setMessage('') }
    catch { toast.error('Could not send the message') }
  }
  const chat = order.observations.filter(o => !o.plan)
  const planMessages = order.observations.filter(o => o.plan)
  const iconBtn = 'w-9 h-9 flex items-center justify-center rounded-md text-primary-600 hover:bg-primary-50'

  return (
    <div className="animate-fade-in">
      <OrderStepper step="finish"/>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-[2rem] items-start">
        <div className="space-y-[2rem] min-w-0">
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-3 px-[1.5rem] pt-[1.5rem]">
              <h4 className="text-[1.285rem] font-medium text-teal-600">
                {SUMMARY[order.status] ?? order.status} {order.ref}{patient && ` (${patient})`}
              </h4>
              <div className="flex items-center gap-1 print:hidden">
                <button type="button" className={iconBtn} title={order.invoice_id ? 'Invoice' : 'Create invoice'} aria-label={order.invoice_id ? 'Open invoice' : 'Create invoice'}
                  disabled={createInvoice.isPending} onClick={openInvoice}><FileText size={20}/></button>
                <button type="button" className={iconBtn} title="Print the work card" aria-label="Print" onClick={()=>window.print()}><Printer size={20}/></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-5 p-[1.5rem]">
              <ProductImage className="h-[150px]"/>
              <div className="space-y-1.5 min-w-0">
                <h6 className="font-medium text-ink-900 capitalize">{order.product?.name ?? '—'}</h6>
                <p className="text-sm">By <a className="text-primary-600">{order.product?.provider ?? '—'}</a></p>
                <Rating n={order.product?.rating ?? 5}/>
                {order.product?.description && <p className="first-letter:uppercase">{order.product.description}</p>}
                {center && <p>Delivery Address <strong className="capitalize">{center.name}</strong>{deliveryAddress(center) && <span className="block text-sm text-ink-500">{deliveryAddress(center)}</span>}</p>}
                {deliveryOn && <p>Delivery on <strong className="text-teal-600 capitalize">{deliveryOn}</strong></p>}
                {(order.doctor || patient) && <p>{order.doctor && <>Order by <strong className="text-teal-600">{order.doctor.name}</strong> </>}{patient && <>for patient <strong className="capitalize">{patient}</strong></>}</p>}
                {order.no_scans && <p className="font-semibold">Pick up Physical Models</p>}
              </div>
              <SuccessCheckmark/>
            </div>
            <div className="px-[1.5rem] pb-[1.5rem] space-y-1">
              {optionLines.map(([k,v]) => <p key={k} className="first-letter:uppercase"><b className="text-ink-900">{k}:</b> {v}</p>)}
              {order.additional_instructions && <p className="whitespace-pre-wrap pt-1"><b className="text-ink-900">Additional Instructions</b> {order.additional_instructions}</p>}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-5 print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className="btn-primary gap-1.5" onClick={()=>navigate('/products')}><ClipboardList size={15}/>New Order</button>
                  <button type="button" className="btn-primary gap-1.5" onClick={()=>navigate('/orders')}><List size={15}/>View Orders</button>
                  {isLab && <button type="button" className="btn-primary gap-1.5" onClick={()=>setNewPlan(true)}><ListPlus size={15}/>{order.treatment_plans.length ? 'Add Treatment Plan' : 'Create Treatment Plan'}</button>}
                  {photos.length > 0 && <button type="button" title="Detailed photos of teeth" aria-label="View photos" className="btn border-primary-600 text-primary-600 hover:bg-[#7367f00a] px-3" onClick={()=>setPhotosOpen(true)}><Eye size={16}/></button>}
                </div>
                {order.product_id && <button type="button" className="btn-primary gap-1.5" onClick={()=>navigate(`/products/${order.product_id}?edit=${order.id}`)}><Pencil size={15}/>Modify Order</button>}
              </div>
            </div>
          </div>

          {order.treatment_plans.length > 0 && (
            <Panel id="panelMargin0" title="Treatment Plans">
              <TreatmentPlansTable order={order}/>
              {planMessages.length > 0 && <div className="mt-6"><Timeline items={planMessages.map(o=>({ id:o.id, title:<>{o.user_name} <span className="text-primary-600 font-normal">· {o.plan}</span></>, body:o.message === 'PLAN APPROVED' ? <span className="text-teal-600 font-semibold">PLAN APPROVED</span> : o.message, time:o.created_at, color:o.message === 'PLAN APPROVED' ? 'success' : 'primary' }))}/></div>}
            </Panel>
          )}

          {(order.teeth?.length ?? 0) > 0 && (
            <Panel id="panelOdontogram" title="Odontogram">
              <div className="max-w-3xl">
                <Odontogram readOnly marks={order.product?.odontogram_marks ?? []} multiple={!!order.product?.odontogram_multiple}
                  value={Object.fromEntries((order.teeth ?? []).map(t=>[t, order.odontogram?.[t] ?? ['selected']]))}/>
              </div>
            </Panel>
          )}

          {order.files.length > 0 && (
            <Panel id="panelMargin1" title="Shared Files">
              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                  {photos.map(f=>(
                    <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="block group">
                      {f.mime_type?.startsWith('image/') ? <img src={f.url} alt={f.slot ?? f.file_name} className="h-24 w-full object-cover rounded-md border border-surface-200 group-hover:border-primary-400"/>
                        : <div className="h-24 rounded-md border border-surface-200 flex items-center justify-center"><FileText className="text-primary-600"/></div>}
                      <p className="text-xs text-ink-500 mt-1 capitalize text-center">{f.slot === 'ortho' ? 'Orthopantomography' : f.slot}</p>
                    </a>
                  ))}
                </div>
              )}
              {files.length > 0 && (
                <table className="w-full text-sm">
                  <thead><tr><th className="text-left px-3 py-2 uppercase">File Name</th><th className="text-left px-3 py-2 uppercase">Size</th><th className="px-3 py-2 uppercase text-right">Actions</th></tr></thead>
                  <tbody>{files.map(f=>(
                    <tr key={f.id} className="table-row"><td className="px-3 py-2">{f.file_name}</td><td className="px-3 py-2">{(f.file_size/1e6).toFixed(2)} MB</td>
                      <td className="px-3 py-2 text-right"><a href={f.url} target="_blank" rel="noreferrer" aria-label={`Download ${f.file_name}`} className="inline-flex p-1.5 text-primary-600"><Download size={15}/></a></td></tr>
                  ))}</tbody>
                </table>
              )}
            </Panel>
          )}

          <Panel id="chat" title={isLab ? 'External message with client' : 'Direct message with lab'}>
            <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-5 items-start">
              <div className="card p-[1.5rem] shadow-[0_2px_15px_0_rgba(34,41,47,0.25)]"><ChatInput value={message} onChange={setMessage} onSend={send} busy={addObs.isPending}/></div>
              <Timeline empty="No messages yet" items={chat.map(o=>({ id:o.id, title:o.user_name, body:o.message, time:o.created_at, color:o.user_name === user?.name ? 'primary' : 'success' }))}/>
            </div>
          </Panel>
        </div>

        <div className="space-y-[2rem]">
          <Panel title="Price Details">
            <PriceDetails productName={order.product?.name ?? 'Product'} productPrice={productPrice} lines={priceLines} total={order.total}/>
          </Panel>
          <Panel title="Status">
            <Timeline items={order.phases.map((p,i)=>({ id:p.id, title:p.title, body:p.details, time:p.created_at, color: i === order.phases.length-1 ? 'primary' : 'success' }))}/>
          </Panel>
        </div>
      </div>

      <Modal open={photosOpen} onClose={()=>setPhotosOpen(false)} title="Detailed photos of teeth" size="xl"
        footer={<button className="btn-primary btn-sm" onClick={()=>setPhotosOpen(false)}>Accept</button>}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map(f=>(
            <figure key={f.id}>
              {f.mime_type?.startsWith('image/') ? <img src={f.url} alt={f.slot ?? f.file_name} className="w-full h-48 object-cover rounded-md"/> : <a href={f.url} className="block p-6 border rounded-md text-center">{f.file_name}</a>}
              <figcaption className={cn('text-sm text-center mt-1 capitalize')}>{f.slot === 'ortho' ? 'Orthopantomography' : f.slot}</figcaption>
            </figure>
          ))}
        </div>
      </Modal>
      {newPlan && <TreatmentPlanModal open orderId={order.id} onClose={()=>setNewPlan(false)} onSaved={id=>navigate(`/orders/${order.id}/treatment/${id}`)}/>}
    </div>
  )
}
