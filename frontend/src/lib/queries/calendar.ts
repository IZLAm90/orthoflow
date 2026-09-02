import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export interface CalendarEvent { id:string; category:string; date:string; title:string; ref:string; url:string }

export const useCalendarEvents = () => useQuery({ queryKey:['calendar'], queryFn: async()=> (await api.get<CalendarEvent[]>('/calendar')).data })
