import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useProducts } from '../../lib/queries/products'
import { Modal, Spinner } from '../ui'

// Opened by every "New case" / "New Order" button: pick the product, then go
// straight to its order form instead of dropping the user on the catalog.
export default function NewOrderModal() {
  const navigate = useNavigate()
  const { newOrderOpen, setNewOrderOpen } = useUIStore()
  const { data:products=[], isLoading } = useProducts()
  const [search, setSearch] = useState('')
  const close = () => { setNewOrderOpen(false); setSearch('') }
  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Modal open={newOrderOpen} onClose={close} title="New case — choose a product" size="md">
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/>
          <input className="input pl-8 py-1.5 text-sm" placeholder="Search Product" autoFocus value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        {isLoading ? <div className="flex justify-center py-8"><Spinner/></div> : filtered.length === 0 ? (
          <p className="text-center text-sm text-ink-400 py-8">No products found</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => (
              <button key={p.id} onClick={() => { close(); navigate(`/products/${p.id}`) }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-surface-200 hover:border-primary-400 hover:bg-primary-50 transition-all text-left">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{p.name}</p>
                  <p className="text-xs text-primary-600">By {p.provider || '—'}</p>
                </div>
                <span className="text-sm font-bold text-ink-900">{p.price.toFixed(2)} €</span>
                <ChevronRight size={16} className="text-ink-400"/>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
