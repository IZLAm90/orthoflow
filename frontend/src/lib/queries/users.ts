import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface User { id:string; name:string; email:string; role:string; status:string; phone?:string|null; last_login?:string|null; created_at:string }
export type UserCreate = { name:string; email:string; password:string; role?:string; status?:string }

export const useUsers = () => useQuery({ queryKey:['users'], queryFn: async()=> (await api.get<User[]>('/users')).data })
export const useCreateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: UserCreate) => (await api.post<User>('/users', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey:['users'] }),
  })
}
