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
      'flex flex-col bg-white border-r border-surface-200 h-full transition-all duration-300 flex-shrink-0',
      collapsed ? 'w-16' : 'w-56'
    )}>
      <div className="h-14 flex items-center px-3 border-b border-surface-200 gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center flex-shrink-0">
          <Stethoscope size={15} className="text-white"/>
        </div>
        {!collapsed && <span className="font-bold text-ink-900 text-sm tracking-tight">OrthoFlow</span>}
        <button onClick={toggleSidebar} className={cn('text-ink-400 hover:text-ink-700 p-1 rounded-lg hover:bg-surface-100', collapsed ? 'mx-auto' : 'ml-auto')}>
          <ChevronLeft size={15} className={cn('transition-transform', collapsed && 'rotate-180')}/>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({to,icon:Icon,label})=>{
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <NavLink key={to} to={to}
              onClick={()=>{ if(window.innerWidth < 768) toggleSidebar() }}
              className={cn('nav-link', active && 'nav-link-active', collapsed && 'justify-center px-0')}
              title={collapsed ? label : undefined}>
              <Icon size={17} className="flex-shrink-0"/>
              {!collapsed && <span className="text-sm">{label}</span>}
            </NavLink>
          )
        })}
      </nav>
      <div className="p-2 border-t border-surface-200">
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
