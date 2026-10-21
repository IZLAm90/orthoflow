import { useState } from 'react'
import { ChevronDown, Send } from 'lucide-react'
import { cn, formatDate } from '../../lib/utils'

// Collapsible card, like the reference platform's ngb-accordion panels (open by default).
export function Panel({ id, title, children, actions, defaultOpen=true, icon }: {
  id?:string; title:React.ReactNode; children:React.ReactNode; actions?:React.ReactNode; defaultOpen?:boolean; icon?:React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section id={id} className="card overflow-visible">
      <div className="flex flex-wrap items-center gap-3 px-[1.5rem] py-[1rem]">
        <button type="button" onClick={()=>setOpen(o=>!o)} aria-expanded={open} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
          {icon && <span className="text-primary-600">{icon}</span>}
          <span className="font-medium text-ink-900 text-[1.1rem]">{title}</span>
          <ChevronDown size={16} className={cn('text-ink-400 transition-transform ml-auto', open && 'rotate-180')}/>
        </button>
        {actions}
      </div>
      {open && <div className="px-[1.5rem] pb-[1.5rem] pt-1">{children}</div>}
    </section>
  )
}

export interface TimelineItem { id:string; title:React.ReactNode; body?:React.ReactNode; time?:string|null; color?:'primary'|'success'|'warning'|'danger'|'secondary' }
const POINT: Record<string,string> = { primary:'bg-primary-600 shadow-[0_0_0_4px_#7367f01f]', success:'bg-teal-600 shadow-[0_0_0_4px_#28c76f1f]', warning:'bg-amber-600 shadow-[0_0_0_4px_#ff9f431f]', danger:'bg-red-500 shadow-[0_0_0_4px_#ea54551f]', secondary:'bg-ink-500 shadow-[0_0_0_4px_#82868b1f]' }

// Vertical timeline (reference: app-timeline).
export function Timeline({ items, empty='Nothing yet' }: { items:TimelineItem[]; empty?:string }) {
  if (!items.length) return <p className="text-ink-400">{empty}</p>
  return (
    <ul className="relative ml-1.5 border-l border-surface-200">
      {items.map(it => (
        <li key={it.id} className="relative pl-6 pb-5 last:pb-0">
          <span className={cn('absolute -left-[6px] top-1.5 w-[12px] h-[12px] rounded-full', POINT[it.color ?? 'primary'])}/>
          <div className="flex flex-wrap justify-between gap-x-3">
            <h6 className="font-semibold text-ink-900">{it.title}</h6>
            {it.time && <span className="text-[0.85rem] text-ink-400">{formatDate(it.time, { hour:'2-digit', minute:'2-digit' })}</span>}
          </div>
          {it.body && <div className="text-ink-700 whitespace-pre-line mt-0.5">{it.body}</div>}
        </li>
      ))}
    </ul>
  )
}

// Message box used in the order and treatment communication panels.
export function ChatInput({ value, onChange, onSend, busy, placeholder='Write a message…', children }: {
  value:string; onChange:(v:string)=>void; onSend?:()=>void; busy?:boolean; placeholder?:string; children?:React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <textarea className="input min-h-[96px]" placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}
        onKeyDown={e=>{ if (e.key==='Enter' && (e.metaKey || e.ctrlKey) && onSend) onSend() }} aria-label="Message"/>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {children}
        {onSend && <button type="button" className="btn-primary btn-sm gap-1.5" disabled={busy || !value.trim()} onClick={onSend}><Send size={13}/>Send</button>}
      </div>
    </div>
  )
}
