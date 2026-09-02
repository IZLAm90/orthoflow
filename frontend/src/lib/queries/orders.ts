import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import type { Patient } from './patients'
import type { Product } from './products'
import type { Doctor } from './doctors'
import type { DeliveryCenter } from './deliveryCenters'

export interface TreatmentPlan { id:string; order_id:string; name:string; created_at:string; status:string; type:string; total:number; issued:number }
export interface Observation { id:string; order_id:string; user_name:string; created_at:string; plan?:string|null; message:string }
export interface OrderPhase { id:string; title:string; details?:string|null; created_at:string }
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
  treatment_plans: TreatmentPlan[]; observations: Observation[]; phases: OrderPhase[]
}
export type OrderCreate = Partial<Omit<Order,'id'|'ref'|'requested_at'|'patient'|'product'|'doctor'|'delivery_center'|'treatment_plans'|'observations'|'phases'>> & { patient_id:string }

export const useOrders = () => useQuery({ queryKey:['orders'], queryFn: async()=> (await api.get<Order[]>('/orders')).data })
export const useOrder = (id?:string) => useQuery({ queryKey:['orders',id], queryFn: async()=> (await api.get<Order>(`/orders/${id}`)).data, enabled: !!id })
export const useCreateOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: OrderCreate) => (await api.post<Order>('/orders', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey:['orders'] }),
  })
}
