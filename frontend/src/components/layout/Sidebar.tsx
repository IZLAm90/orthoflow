import { NavLink, useLocation } from 'react-router-dom'
import { ShoppingCart, FileText, Users, Settings, ChevronLeft, Stethoscope, Calendar, HelpCircle, LogOut, Package } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { Avatar } from '../ui'
import { cn } from '../../lib/utils'

const NAV = [
  { to:'/products',  icon:ShoppingCart, label:'Products'  },
  { to:'/orders',    icon:Package,      label:'Orders'    },
  { to:'/invoices',  icon:FileText,     label:'Invoices'  },
  { to:'/users',     icon:Users,        label:'Users'     },
  { to:'/settings',  icon:Settings,     label:'Settings'  },
  { to:'/calendar',  icon:Calendar,     label:'Calendar'  },
  { to:'/help',      icon:HelpCircle,   label:'FAQ'       },
]

export default function Sidebar(){
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const location = useLocation()
  const collapsed = !sidebarOpen
  return (
    <aside className={cn(
      'flex flex-col bg-white h-full transition-all duration-300 flex-shrink-0 shadow-[0_0_15px_0_rgba(34,41,47,0.05)]',
      collapsed ? 'w-[80px]' : 'w-[260px]'
    )}>
      <div className="h-[4.45rem] flex items-center pl-[1.64rem] pr-4 gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0 shadow-[0_8px_25px_-8px_#7367f0]">
          <Stethoscope size={17} className="text-white"/>
        </div>
        {!collapsed && <span className="font-semibold text-primary-600 text-[1.45rem] tracking-[0.01rem]">OrthoFlow</span>}
        <button onClick={toggleSidebar} className={cn('text-primary-600 p-1 rounded-lg hover:bg-primary-50', collapsed ? 'mx-auto' : 'ml-auto')}>
          <ChevronLeft size={18} className={cn('transition-transform', collapsed && 'rotate-180')}/>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto pt-2 pb-3 space-y-[5px]">
        {NAV.map(({to,icon:Icon,label})=>{
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <NavLink key={to} to={to}
              onClick={()=>{ if(window.innerWidth < 768) toggleSidebar() }}
              className={cn(active ? 'nav-link-active' : 'nav-link', collapsed && 'justify-center px-0 hover:pl-0')}
              title={collapsed ? label : undefined}>
              <Icon size={18} className="flex-shrink-0"/>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          )
        })}
      </nav>
      <div className="p-3 border-t border-surface-200">
        {user && (
          <div className={cn('flex items-center gap-2 px-2 py-2 rounded-lg', collapsed && 'justify-center')}>
            <Avatar name={user.name} size="sm"/>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink-900 truncate">{user.name}</p>
                <p className="text-[10px] text-ink-400 capitalize">{user.role}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={logout} className="text-ink-400 hover:text-red-500 p-1 flex-shrink-0">
                <LogOut size={13}/>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
