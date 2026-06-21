import { BrowserRouter,Routes,Route,Navigate } from 'react-router-dom'
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientsPage from './pages/Patients'
import CasesPage from './pages/Cases'
import CaseDetail from './pages/CaseDetail'
import NewCase from './pages/NewCase'
import LabPage from './pages/Lab'
import AnalyticsPage from './pages/Analytics'
import ProductsPage from './pages/Products'
import OrderForm from './pages/OrderForm'
import OrdersPage from './pages/Orders'
import InvoicesPage from './pages/Invoices'
import UsersPage from './pages/Users'
import CalendarPage from './pages/Calendar'
import SettingsPage from './pages/Settings'
import FAQPage from './pages/FAQ'
import { useAuthStore } from './stores/authStore'

const qc=new QueryClient()

function Private({children}:{children:React.ReactNode}){
  const {isAuthenticated}=useAuthStore()
  return isAuthenticated?<>{children}</>:<Navigate to="/login" replace/>
}

export default function App(){
  return <QueryClientProvider client={qc}>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element={<Private><AppLayout/></Private>}>
          <Route index element={<Dashboard/>}/>
          <Route path="patients" element={<PatientsPage/>}/>
          <Route path="cases" element={<CasesPage/>}/>
          <Route path="cases/new" element={<NewCase/>}/>
          <Route path="cases/:id" element={<CaseDetail/>}/>
          <Route path="lab" element={<LabPage/>}/>
          <Route path="analytics" element={<AnalyticsPage/>}/>
          <Route path="products" element={<ProductsPage/>}/>
          <Route path="products/:id" element={<OrderForm/>}/>
          <Route path="orders" element={<OrdersPage/>}/>
          <Route path="invoices" element={<InvoicesPage/>}/>
          <Route path="users" element={<UsersPage/>}/>
          <Route path="calendar" element={<CalendarPage/>}/>
          <Route path="settings" element={<SettingsPage/>}/>
          <Route path="help" element={<FAQPage/>}/>
        </Route>
      </Routes>
      <Toaster position="top-right" toastOptions={{style:{borderRadius:'10px',fontSize:'13px'}}}/>
    </BrowserRouter>
  </QueryClientProvider>
}
