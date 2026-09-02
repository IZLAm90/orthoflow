import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface DeliveryCenter { id:string; name:string; address?:string|null; phone?:string|null; city?:string|null; locality?:string|null; country?:string|null; postal_code?:string|null }
export type DeliveryCenterCreate = { name:string; address?:string; phone?:string; city?:string; locality?:string; country?:string; postal_code?:string }

export const useDeliveryCenters = () => useQuery({ queryKey:['deliveryCenters'], queryFn: async()=> (await api.get<DeliveryCenter[]>('/delivery-centers')).data })
export const useCreateDeliveryCenter = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: DeliveryCenterCreate) => (await api.post<DeliveryCenter>('/delivery-centers', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey:['deliveryCenters'] }),
  })
}
export const useDeleteDeliveryCenter = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id:string) => { await api.delete(`/delivery-centers/${id}`) },
    onSuccess: () => qc.invalidateQueries({ queryKey:['deliveryCenters'] }),
  })
}
