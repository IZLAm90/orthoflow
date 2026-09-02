import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { useCalendarEvents } from '../lib/queries/calendar'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const CATEGORY_STYLE: Record<string,string> = {
  orders: 'bg-primary-100 text-primary-700',
  lab: 'bg-purple-100 text-purple-700',
  holidays: 'bg-red-100 text-red-700',
  personal: 'bg-teal-100 text-teal-700',
  others: 'bg-amber-100 text-amber-700',
}

// Real categories (orders/lab) come from the backend's derived feed. Holidays/Personal/Others
// mirror the reference platform's filter sidebar shape but have no data source yet.
const FILTERS = [
  { key:'orders', label:'Orders', hasData:true },
  { key:'lab', label:'Lab Orders', hasData:true },
  { key:'holidays', label:'Holidays', hasData:false },
  { key:'personal', label:'Personal', hasData:false },
  { key:'others', label:'Others', hasData:false },
]

export default function CalendarPage() {
  const { data:events=[] } = useCalendarEvents()
  const [view, setView] = useState<'month'|'week'|'day'|'list'>('month')
  const [date, setDate] = useState(new Date())
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(FILTERS.map(f=>f.key)))
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year,month,1).getDay()
  const daysInMonth = new Date(year,month+1,0).getDate()
  const prev = () => setDate(new Date(year,month-1,1))
  const next = () => setDate(new Date(year,month+1,1))
  const pad = (n:number) => String(n).padStart(2,'0')
  const todayKey = useMemo(() => { const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }, [])

  const visibleEvents = events.filter(e => activeFilters.has(e.category))
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof visibleEvents> = {}
    for (const ev of visibleEvents) {
      const d = new Date(ev.date)
      const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
      map[key] = map[key] || []
      map[key].push(ev)
    }
    return map
  }, [visibleEvents])

  const toggleFilter = (key:string) => setActiveFilters(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })
  const allChecked = activeFilters.size === FILTERS.length
  const toggleAll = () => setActiveFilters(allChecked ? new Set() : new Set(FILTERS.map(f=>f.key)))

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

      <div className="flex gap-4 items-start">
        <div className="card p-4 w-56 flex-shrink-0 space-y-3">
          <p className="text-xs font-bold text-ink-400 uppercase tracking-wide">Filters</p>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700 cursor-pointer">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded accent-primary-600"/>
            View All
          </label>
          <div className="border-t border-surface-100 pt-2 space-y-2">
            {FILTERS.map(f => (
              <label key={f.key} className={cn('flex items-center gap-2 text-sm cursor-pointer', f.hasData ? 'text-ink-600' : 'text-ink-300')}>
                <input type="checkbox" checked={activeFilters.has(f.key)} onChange={()=>toggleFilter(f.key)} className="rounded accent-primary-600"/>
                {f.label}
              </label>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden flex-1">
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
                  const dayEvents = eventsByDate[key]||[]
                  const isToday = key===todayKey
                  const col = (firstDay+i)%7
                  const isLastCol = col===6
                  return (
                    <div key={day} className={cn('border-b border-surface-100 min-h-[110px] p-2 hover:bg-surface-50 transition-colors',!isLastCol&&'border-r')}>
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1.5 transition-colors',isToday?'bg-primary-600 text-white':'text-ink-600 hover:bg-surface-200 cursor-pointer')}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.map((ev)=>(
                          <div key={ev.id} className={cn('text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium cursor-pointer hover:opacity-80',CATEGORY_STYLE[ev.category])} title={ev.title}>
                            {ev.title}
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
              {Object.keys(eventsByDate).length===0 && <p className="text-center text-sm text-ink-400 py-10">No events yet</p>}
              {Object.entries(eventsByDate).sort(([a],[b])=>a.localeCompare(b)).map(([dateKey,evs])=>(
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
                    {evs.map((ev)=>(
                      <div key={ev.id} className={cn('text-sm px-3 py-1.5 rounded-lg font-medium cursor-pointer hover:opacity-80 transition-opacity',CATEGORY_STYLE[ev.category])}>
                        {ev.title}
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
    </div>
  )
}
