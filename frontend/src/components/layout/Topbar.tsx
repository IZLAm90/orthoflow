import { useEffect, useRef, useState } from 'react'
import { Search, Bell, Plus, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { useNotifications } from '../../lib/queries/notifications'
import { formatDate } from '../../lib/utils'
import { Avatar } from '../ui'

function useClickOutside(ref: React.RefObject<HTMLElement>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onOutside() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onOutside])
}

export default function Topbar() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const { data:notifications=[] } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  useClickOutside(panelRef, () => setOpen(false))

  return (
    <header className="h-14 bg-white border-b border-surface-200 flex items-center gap-3 px-4 flex-shrink-0">
      {/* Hamburger - mobile only */}
      <button onClick={toggleSidebar} className="md:hidden text-ink-500 hover:text-ink-800 p-1">
        <Menu size={20}/>
      </button>
      <div className="relative flex-1 max-w-xs hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/>
        <input className="input pl-8 py-1.5 text-sm w-full" placeholder="Search..."/>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={()=>navigate('/products')} className="btn-primary btn-sm gap-1.5 hidden sm:flex">
          <Plus size={14}/><span>New case</span>
        </button>
        <button onClick={()=>navigate('/products')} className="btn-primary p-2 rounded-lg sm:hidden">
          <Plus size={16}/>
        </button>
        <div className="relative" ref={panelRef}>
          <button onClick={()=>setOpen(o=>!o)} className="relative text-ink-400 hover:text-ink-700 p-2 rounded-lg hover:bg-surface-100">
            <Bell size={18}/>
            {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"/>}
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-float border border-surface-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-100">
                <p className="text-sm font-semibold text-ink-900">Notifications</p>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-surface-100">
                {notifications.length === 0 && (
                  <p className="text-center text-sm text-ink-400 py-8">No notifications yet</p>
                )}
                {notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { setOpen(false); navigate('/orders') }}
                    className="w-full text-left px-4 py-3 hover:bg-surface-50 transition-colors"
                  >
                    <p className="text-sm text-ink-800">{n.message}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{formatDate(n.created_at, { hour:'2-digit', minute:'2-digit' })}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {user && <Avatar name={user.name} size="sm"/>}
      </div>
    </header>
  )
}
