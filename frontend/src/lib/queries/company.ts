import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface CompanySettings {
  company_name?:string|null; fiscal_name?:string|null; nif?:string|null
  billing_address?:string|null; city?:string|null; postal_code?:string|null
  country?:string|null; phone?:string|null; billing_email?:string|null
}

export const useCompanySettings = () => useQuery({ queryKey:['company'], queryFn: async()=> (await api.get<CompanySettings>('/company')).data })
export const useUpdateCompanySettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CompanySettings) => (await api.put<CompanySettings>('/company', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey:['company'] }),
  })
}
