import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export interface NotificationItem { id:string; message:string; order_ref:string; created_at:string }

export const useNotifications = () => useQuery({
  queryKey:['notifications'],
  queryFn: async()=> (await api.get<NotificationItem[]>('/notifications')).data,
  refetchInterval: 30000,
})
