import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface Product {
  id:string; name:string; provider?:string|null; price:number; rating:number; description?:string|null
  has_odontogram:boolean; has_treatment_plan:boolean; has_upload:boolean
  has_upload_boxes:boolean; has_upload_boxes_optional:boolean; has_upload_optional:boolean
  has_delivery_center:boolean; has_doctor_optional:boolean; has_consent:boolean; has_fases:boolean
  has_treatment_plan_multiplier:boolean; has_treatment_final_retainer:boolean
  share_materials:boolean; share_phases:boolean
}
export type ProductCreate = { name:string; provider?:string; price?:number; rating?:number; description?:string }

export const useProducts = () => useQuery({ queryKey:['products'], queryFn: async()=> (await api.get<Product[]>('/products')).data })
export const useProduct = (id?:string) => useQuery({ queryKey:['products',id], queryFn: async()=> (await api.get<Product>(`/products/${id}`)).data, enabled: !!id })
export const useCreateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: ProductCreate) => (await api.post<Product>('/products', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey:['products'] }),
  })
}
