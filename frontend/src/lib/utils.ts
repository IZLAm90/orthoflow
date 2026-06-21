import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function formatDate(date: string, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',...opts}).format(new Date(date))
}
export function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff/60000)
  if(mins<1) return 'just now'
  if(mins<60) return `${mins}m ago`
  const hrs = Math.floor(mins/60)
  if(hrs<24) return `${hrs}h ago`
  const days = Math.floor(hrs/24)
  if(days<7) return `${days}d ago`
  return formatDate(date)
}
export function getInitials(name: string) {
  return name.split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2)
}
export const STATUS_CONFIG: Record<string,{label:string;color:string;dot:string}> = {
  new:{label:'New',color:'badge-blue',dot:'bg-primary-500'},
  in_planning:{label:'In planning',color:'badge-amber',dot:'bg-amber-500'},
  awaiting_approval:{label:'Awaiting approval',color:'badge-amber',dot:'bg-amber-400'},
  approved:{label:'Approved',color:'badge-green',dot:'bg-teal-500'},
  in_treatment:{label:'In treatment',color:'badge-green',dot:'bg-teal-600'},
  completed:{label:'Completed',color:'badge-gray',dot:'bg-ink-400'},
  on_hold:{label:'On hold',color:'badge-red',dot:'bg-red-500'},
}
