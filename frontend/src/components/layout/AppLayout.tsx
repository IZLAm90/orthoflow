import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import NewOrderModal from './NewOrderModal'
import { useUIStore } from '../../stores/uiStore'
import { cn } from '../../lib/utils'

export default function AppLayout() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      {/* Sidebar - hidden on mobile unless open */}
      <div className={cn(
        'fixed md:relative z-30 h-full transition-transform duration-300 md:translate-x-0 print:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 md:px-[2rem] pt-[1.8rem] pb-[2rem] print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
      <NewOrderModal />
    </div>
  )
}
