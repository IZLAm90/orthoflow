import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import type { Patient } from './patients'

export interface Scan { id:string; case_id:string; type:string; file_name:string; file_size:number; format:string; status:string }
export interface Case {
  id:string; case_number:string; status:string; priority:string; treatment_type:string
  chief_complaint?:string|null; patient_id:string; patient?:Patient|null; scans:Scan[]
  created_at:string; updated_at:string
}
export type CaseCreate = { patient_id:string; status?:string; priority?:string; treatment_type?:string; chief_complaint?:string }

export const useCases = () => useQuery({ queryKey:['cases'], queryFn: async()=> (await api.get<Case[]>('/cases')).data })
export const useCase = (id?:string) => useQuery({ queryKey:['cases',id], queryFn: async()=> (await api.get<Case>(`/cases/${id}`)).data, enabled: !!id })
export const useCreateCase = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CaseCreate) => (await api.post<Case>('/cases', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey:['cases'] }),
  })
}
export const useUploadScan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ caseId, file, type }: { caseId:string; file:File; type:'upper'|'lower' }) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', type)
      return (await api.post<Scan>(`/cases/${caseId}/scans`, fd, { headers:{ 'Content-Type':'multipart/form-data' } })).data
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey:['cases', vars.caseId] }),
  })
}
