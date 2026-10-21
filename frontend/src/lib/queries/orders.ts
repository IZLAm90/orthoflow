import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import type { Patient } from './patients'
import type { Product } from './products'
import type { Doctor } from './doctors'
import type { DeliveryCenter } from './deliveryCenters'

export type PlanStatus = 'PENDING'|'APPROVED'|'REJECTED'|'FINISHED'
export type PlanType = 'TREATMENT'|'REFINEMENT'|'FINAL_REPORT'
export type ViewerType = 'URL'|'FILE'|'SHAPE3D'|'ONYXCEPH'
export interface TreatmentPlan {
  id:string; order_id:string; name:string; created_at:string; status:PlanStatus|string; type:PlanType|string
  total:number; issued:number; viewer_type?:ViewerType|null; viewer_url?:string|null
  aligners_upper:number; aligners_lower:number; cost:number; discount:number; notes?:string|null; decided_at?:string|null
}
export interface Observation { id:string; order_id:string; user_name:string; created_at:string; plan?:string|null; message:string }
export interface OrderPhase { id:string; title:string; details?:string|null; created_at:string }
export interface OrderFile { id:string; order_id:string; kind:'photo'|'file'; slot?:string|null; file_name:string; file_size:number; mime_type?:string|null; url:string; created_at:string }
export interface Order {
  id:string; ref:string; status:string
  patient_id:string; patient?:Patient|null
  product_id?:string|null; product?:Product|null
  doctor_id?:string|null; doctor?:Doctor|null
  delivery_center_id?:string|null; delivery_center?:DeliveryCenter|null
  total:number; currency:string; urgent:boolean; requested_at:string; delivery_on?:string|null
  chief_complain?:string|null; treat_both_arch:boolean; treatment_plan_type?:string|null
  dont_move?:string|null; ap_relationship?:string|null; anteroposterior?:string|null
  elastics?:string|null; open_bite?:string|null; midline?:string|null; ipr?:string|null
  bite_ramps?:string|null; crossbite?:string|null; spaces?:string|null; special_instructions?:string|null
  cbct_enabled:boolean; want_manufacturing:boolean; material?:string|null
  teeth?:number[]|null; spaces_notes?:string|null; extractions?:string|null; additional_instructions?:string|null
  no_scans:boolean; consent_accepted:boolean
  odontogram?:Record<string,string[]>|null; invoice_id?:string|null
  options?:OrderOptionAnswer[]|null; refinements_total:number; refinements_used:number
  treatment_plans: TreatmentPlan[]; observations: Observation[]; phases: OrderPhase[]; files: OrderFile[]
}
export interface OrderOptionAnswer { id:string; type:string; title:string; value:string|boolean; label:string; cost:number }
export type OrderCreate = Partial<Omit<Order,'id'|'ref'|'requested_at'|'patient'|'product'|'doctor'|'delivery_center'|'treatment_plans'|'observations'|'phases'|'files'|'invoice_id'|'options'|'refinements_total'|'refinements_used'>>
  & ({ patient_id:string } | { patient_name:string })
  & { options?: { id:string; value:string|boolean|null }[] }

export const useOrders = () => useQuery({ queryKey:['orders'], queryFn: async()=> (await api.get<Order[]>('/orders')).data })
export const useOrder = (id?:string) => useQuery({ queryKey:['orders',id], queryFn: async()=> (await api.get<Order>(`/orders/${id}`)).data, enabled: !!id })
export const useCreateOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: OrderCreate) => (await api.post<Order>('/orders', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey:['orders'] }),
  })
}
export const useUploadOrderFile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, file, kind, slot }: { orderId:string; file:File; kind:'photo'|'file'; slot?:string }) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('kind', kind)
      if (slot) fd.append('slot', slot)
      return (await api.post<OrderFile>(`/orders/${orderId}/files`, fd)).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey:['orders'] }),
  })
}
export const useModifyOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: OrderCreate & { id:string }) => (await api.put<Order>(`/orders/${id}`, { ...body, modify:true })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey:['orders'] }),
  })
}
export const useUpdateOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id:string; status?:string; refinements_total?:number }) => (await api.put<Order>(`/orders/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey:['orders'] }),
  })
}
