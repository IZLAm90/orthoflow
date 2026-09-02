import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface Patient {
  id: string; first_name: string; last_name: string; email?: string|null; phone?: string|null
  date_of_birth?: string|null; gender?: string|null; allergies?: string|null
  created_at: string; cases_count: number
}
export type PatientCreate = Partial<Omit<Patient,'id'|'created_at'|'cases_count'>> & { first_name:string; last_name:string }

export const usePatients = () => useQuery({ queryKey:['patients'], queryFn: async()=> (await api.get<Patient[]>('/patients')).data })
export const usePatient = (id?:string) => useQuery({ queryKey:['patients',id], queryFn: async()=> (await api.get<Patient>(`/patients/${id}`)).data, enabled: !!id })
export const useCreatePatient = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: PatientCreate) => (await api.post<Patient>('/patients', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey:['patients'] }),
  })
}
