import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const EVENTS: Record<string,{label:string;color:string}[]> = {
  '2026-06-10': [{label:'Delivery: David Park',color:'bg-teal-100 text-teal-700'}],
  '2026-06-15': [{label:'Order: Sarah Mitchell',color:'bg-primary-100 text-primary-700'}],
  '2026-06-18': [{label:'Lab: AlignTech order',color:'bg-purple-100 text-purple-700'}],
  '2026-06-21': [{label:'Today',color:'bg-primary-600 text-white'}],
  '2026-06-22': [{label:'Delivery: Marcus Webb',color:'bg-teal-100 text-teal-700'}],
  '2026-06-25': [{label:'Order: James Okonkwo',color:'bg-primary-100 text-primary-700'},{label:'Delivery: Amara Hassan',color:'bg-teal-100 text-teal-700'}],
  '2026-07-02': [{label:'Delivery: Sarah Mitchell',color:'bg-teal-100 text-teal-700'}],
}

export default function CalendarPage() {
  const [view, setView] = useState<'month'|'week'|'day'|'list'>('month')
  const [date, setDate] = useState(new Date(2026,5,1))
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year,month,1).getDay()
  const daysInMonth = new Date(year,month+1,0).getDate()
  const prev = () => setDate(new Date(year,month-1,1))
  const next = () => setDate(new Date(year,month+1,1))
  const pad = (n:number) => String(n).padStart(2,'0')

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Calendar</h2><p className="text-muted">Deliveries & appointments</p></div>
        <div className="flex items-center gap-2">
          <button className="btn-primary btn-sm">+ Event</button>
          <div className="flex border border-surface-200 rounded-lg overflow-hidden">
            {(['month','week','day','list'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)} className={cn('px-3 py-1.5 text-sm font-medium capitalize transition-colors',view===v?'bg-primary-600 text-white':'bg-white text-ink-500 hover:bg-surface-50')}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <button onClick={prev} className="btn-ghost p-2 rounded-lg"><ChevronLeft size={18}/></button>
          <h3 className="text-base font-semibold text-ink-900">{MONTHS[month]} {year}</h3>
          <button onClick={next} className="btn-ghost p-2 rounded-lg"><ChevronRight size={18}/></button>
        </div>

        {view==='month'&&(
          <>
            <div className="grid grid-cols-7 border-b border-surface-200 bg-surface-50">
              {DAYS.map(d=><div key={d} className="py-2.5 text-center text-xs font-semibold text-ink-400 uppercase tracking-wide">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({length:firstDay}).map((_,i)=>(
                <div key={`empty-${i}`} className="border-b border-r border-surface-100 min-h-[110px] bg-surface-50/40"/>
              ))}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day = i+1
                const key = `${year}-${pad(month+1)}-${pad(day)}`
                const events = EVENTS[key]||[]
                const isToday = key==='2026-06-21'
                const col = (firstDay+i)%7
                const isLastCol = col===6
                return (
                  <div key={day} className={cn('border-b border-surface-100 min-h-[110px] p-2 hover:bg-surface-50 transition-colors',!isLastCol&&'border-r')}>
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1.5 transition-colors',isToday?'bg-primary-600 text-white':'text-ink-600 hover:bg-surface-200 cursor-pointer')}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {events.map((ev,ei)=>(
                        <div key={ei} className={cn('text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium cursor-pointer hover:opacity-80',ev.color)}>
                          {ev.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {view==='list'&&(
          <div className="divide-y divide-surface-100">
            {Object.entries(EVENTS).sort().map(([dateKey,evs])=>(
              <div key={dateKey} className="px-6 py-4 flex gap-8 hover:bg-surface-50 transition-colors">
                <div className="w-28 flex-shrink-0">
                  <p className="text-sm font-semibold text-ink-900">
                    {new Date(dateKey+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </p>
                  <p className="text-xs text-ink-400">
                    {new Date(dateKey+'T12:00:00').toLocaleDateString('en-US',{weekday:'long'})}
                  </p>
                </div>
                <div className="space-y-1.5 flex-1">
                  {evs.map((ev,i)=>(
                    <div key={i} className={cn('text-sm px-3 py-1.5 rounded-lg font-medium cursor-pointer hover:opacity-80 transition-opacity',ev.color)}>
                      {ev.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {view==='week'&&(
          <div className="p-8 text-center">
            <p className="text-ink-400 text-sm">Week view — switch to Month or List to see events</p>
          </div>
        )}

        {view==='day'&&(
          <div className="p-8 text-center">
            <p className="text-ink-400 text-sm">Day view — switch to Month or List to see events</p>
          </div>
        )}
      </div>
    </div>
  )
}
