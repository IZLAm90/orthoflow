import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutGrid, List } from 'lucide-react'
import { cn } from '../lib/utils'

const PRODUCTS = [
  { id:'GCCEMS', name:'Aligner Design ONLY W Onyxceph', provider:'Predict', price:'50,00 €', rating:5, description:'3D Design for Transparent Aligners. Design and 3D files to print your own aligners.' },
  { id:'GCCEMS2', name:'Aligner Design + CBCT Segmentation', provider:'Predict', price:'30,00 €', rating:5, description:'Full arch segmentation from CBCT scan with aligner design files included.' },
]

function Stars({ n }: { n: number }) {
  return <div className="flex gap-0.5">{Array.from({length:5}).map((_,i)=>(
    <svg key={i} className={i<n?'text-amber-400':'text-surface-200'} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  ))}</div>
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid'|'list'>('grid')
  const filtered = PRODUCTS.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Products</h2><p className="text-muted">{filtered.length} results found</p></div>
      </div>
      <div className="card p-3 flex gap-3 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/>
          <input className="input pl-8 py-1.5 text-sm" placeholder="Search Product" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex items-center border border-surface-200 rounded-lg overflow-hidden">
          <button onClick={()=>setView('grid')} className={cn('p-2',view==='grid'?'bg-primary-50 text-primary-600':'text-ink-400 hover:bg-surface-50')}><LayoutGrid size={16}/></button>
          <button onClick={()=>setView('list')} className={cn('p-2',view==='list'?'bg-primary-50 text-primary-600':'text-ink-400 hover:bg-surface-50')}><List size={16}/></button>
        </div>
      </div>
      <div className={cn(view==='grid'?'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6':'space-y-4')}>
        {filtered.map(p=>(
          <div key={p.id} className="card overflow-hidden hover:shadow-card transition-all cursor-pointer" onClick={()=>navigate(`/products/${p.id}`)}>
            <div className="bg-gradient-to-br from-primary-50 to-teal-50 h-52 flex items-center justify-center border-b border-surface-200">
              <div className="w-36 h-36 rounded-2xl bg-white shadow-card flex items-center justify-center">
                <svg viewBox="0 0 80 80" className="w-28 h-28">
                  <ellipse cx="40" cy="58" rx="28" ry="10" fill="#e8d5c0" opacity="0.4"/>
                  <rect x="18" y="18" width="13" height="32" rx="6.5" fill="#f5f0ea" stroke="#d4c5b0" strokeWidth="1.2"/>
                  <rect x="33" y="15" width="14" height="35" rx="7" fill="#f5f0ea" stroke="#d4c5b0" strokeWidth="1.2"/>
                  <rect x="49" y="18" width="13" height="32" rx="6.5" fill="#f5f0ea" stroke="#d4c5b0" strokeWidth="1.2"/>
                  <ellipse cx="25" cy="17" rx="4" ry="3" fill="#fbbf24" opacity="0.7"/>
                  <ellipse cx="40" cy="14" rx="4" ry="3" fill="#fbbf24" opacity="0.5"/>
                </svg>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-primary-600 font-semibold mb-1">By {p.provider}</p>
              <p className="text-sm font-bold text-ink-900 mb-2 leading-snug">{p.name}</p>
              <Stars n={p.rating}/>
              <p className="text-xs text-ink-500 mt-2 line-clamp-2 leading-relaxed">{p.description}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-100">
                <span className="text-xl font-bold text-ink-900">{p.price}</span>
                <button className="btn-primary btn-sm" onClick={e=>{e.stopPropagation();navigate(`/products/${p.id}`)}}>Order now</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
