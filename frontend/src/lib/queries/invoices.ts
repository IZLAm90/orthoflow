import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface InvoiceOrderLine { ref:string; patient:string; product:string; date:string; amount:number; doctor?:string|null }
export interface Invoice {
  id:string; number:string; status:string; issue_date:string; due_date?:string|null; total:number
  summary?:string|null; billing_company?:string|null; billing_address?:string|null
  billing_vat?:string|null; billing_email?:string|null; orders: InvoiceOrderLine[]
}

export const useInvoices = () => useQuery({ queryKey:['invoices'], queryFn: async()=> (await api.get<Invoice[]>('/invoices')).data })
export const useCreateInvoice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { order_ids:string[] }) => (await api.post<Invoice>('/invoices', body)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey:['invoices'] }); qc.invalidateQueries({ queryKey:['orders'] }) },
  })
}
