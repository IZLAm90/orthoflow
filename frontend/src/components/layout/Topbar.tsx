import { Search, Bell, Plus, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { Avatar } from '../ui'

export default function Topbar() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toggleSidebar } = useUIStore()
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
        <button className="relative text-ink-400 hover:text-ink-700 p-2 rounded-lg hover:bg-surface-100">
          <Bell size={18}/>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"/>
        </button>
        {user && <Avatar name={user.name} size="sm"/>}
      </div>
    </header>
  )
}
