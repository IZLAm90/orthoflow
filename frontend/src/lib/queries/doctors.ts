import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface Doctor { id:string; name:string; email?:string|null; phone?:string|null; denomination:string; collegiate?:string|null }
export type DoctorCreate = { name:string; email?:string; phone?:string; denomination?:string; collegiate?:string }

export const useDoctors = () => useQuery({ queryKey:['doctors'], queryFn: async()=> (await api.get<Doctor[]>('/doctors')).data })
export const useCreateDoctor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: DoctorCreate) => (await api.post<Doctor>('/doctors', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey:['doctors'] }),
  })
}
export const useDeleteDoctor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id:string) => { await api.delete(`/doctors/${id}`) },
    onSuccess: () => qc.invalidateQueries({ queryKey:['doctors'] }),
  })
}
