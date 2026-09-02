import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Patient } from './patients'

export interface LabOrder {
  id:string; ref:string; case_id?:string|null; case_number?:string|null
  order_id?:string|null; order_ref?:string|null
  patient_id:string; patient?:Patient|null; lab?:string|null; status:string
  ordered_at:string; eta?:string|null; stages:number
}

export const useLabOrders = () => useQuery({ queryKey:['labOrders'], queryFn: async()=> (await api.get<LabOrder[]>('/lab-orders')).data })
