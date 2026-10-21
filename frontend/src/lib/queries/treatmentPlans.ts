import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import type { Order, TreatmentPlan, PlanType, ViewerType } from './orders'

export type PlanFileKind = 'VIEWER'|'IMAGE_MOVEMENTS'|'IMAGE_REFINEMENT'|'IMAGE_FINISHED'|'IPR'|'ATTACHMENTS'|'FILE'
export interface PlanFile { id:string; order_id:string; treatment_plan_id?:string|null; kind:PlanFileKind; file_name:string; file_size:number; mime_type?:string|null; url:string; created_at:string }
export interface TreatmentPlanDetail extends TreatmentPlan {
  files: PlanFile[]; shared_files: PlanFile[]; has_password:boolean; onyx_password?:string|null; price:number
  order: Order & { treatment_plans: TreatmentPlan[] }
}
export interface PlanInput {
  name?:string; type?:PlanType; viewer_type?:ViewerType|null; viewer_url?:string|null; viewer_password?:string|null
  aligners_upper?:number; aligners_lower?:number; cost?:number; discount?:number; notes?:string|null; status?:string
}

export const PLAN_STATUS: Record<string,{ label:string; className:string }> = {
  PENDING:  { label:'Pending',  className:'bg-amber-50 text-amber-700 border border-amber-200' },
  APPROVED: { label:'Approved', className:'bg-teal-50 text-teal-700 border border-teal-200' },
  REJECTED: { label:'Re-plan requested', className:'bg-red-50 text-red-700 border border-red-200' },
  FINISHED: { label:'Finished', className:'bg-surface-100 text-ink-600 border border-surface-200' },
  REQUESTED:{ label:'Requested', className:'bg-[#00cfe81f] text-[#00a3b8] border border-[#00cfe866]' },
}
export const PLAN_TYPE: Record<string,string> = { TREATMENT:'Treatment', REFINEMENT:'Refinement', FINAL_REPORT:'Final Report' }

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey:['treatment-plans'] })
  qc.invalidateQueries({ queryKey:['orders'] })
}

export const useTreatmentPlan = (id?:string) => useQuery({
  queryKey:['treatment-plans', id], enabled: !!id,
  queryFn: async () => (await api.get<TreatmentPlanDetail>(`/treatment-plans/${id}`)).data,
})
export const useCreateTreatmentPlan = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async ({ orderId, ...body }: PlanInput & { orderId:string }) => (await api.post<TreatmentPlanDetail>(`/orders/${orderId}/treatment-plans`, body)).data, onSuccess: () => invalidate(qc) })
}
export const useUpdateTreatmentPlan = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async ({ id, ...body }: PlanInput & { id:string }) => (await api.put<TreatmentPlanDetail>(`/treatment-plans/${id}`, body)).data, onSuccess: () => invalidate(qc) })
}
export const useDeleteTreatmentPlan = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (id:string) => { await api.delete(`/treatment-plans/${id}`) }, onSuccess: () => invalidate(qc) })
}
export const useDecidePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, decision, message, user_name }: { id:string; decision:'approve'|'replan'; message?:string; user_name?:string }) =>
      (await api.post<TreatmentPlanDetail>(`/treatment-plans/${id}/${decision}`, { message, user_name })).data,
    onSuccess: () => invalidate(qc),
  })
}
export const useUploadPlanFile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, file, kind, shared }: { planId:string; file:File; kind:PlanFileKind; shared?:boolean }) => {
      const fd = new FormData(); fd.append('file', file); fd.append('kind', kind); if (shared) fd.append('shared', '1')
      return (await api.post<PlanFile>(`/treatment-plans/${planId}/files`, fd)).data
    },
    onSuccess: () => invalidate(qc),
  })
}
export const useDeletePlanFile = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: async (id:string) => { await api.delete(`/treatment-plan-files/${id}`) }, onSuccess: () => invalidate(qc) })
}
export const useAddObservation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, ...body }: { orderId:string; user_name:string; plan?:string; message:string }) => (await api.post(`/orders/${orderId}/observations`, body)).data,
    onSuccess: () => invalidate(qc),
  })
}
export const useRequestPlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, ...body }: { orderId:string; type:'REFINEMENT'|'FINAL_REPORT'; message?:string; user_name?:string }) =>
      (await api.post<TreatmentPlanDetail>(`/orders/${orderId}/treatment-plans/request`, body)).data,
    onSuccess: () => invalidate(qc),
  })
}
