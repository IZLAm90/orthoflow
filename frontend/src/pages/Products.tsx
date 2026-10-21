import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutGrid, List, Shapes, ZoomIn, ZoomOut, ChevronDown, FileSpreadsheet, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn, downloadCsv } from '../lib/utils'
import { useProducts, type Product } from '../lib/queries/products'
import { useAuthStore } from '../stores/authStore'
import { Spinner, EmptyState } from '../components/ui'
import { ProductImage, Rating } from '../components/order/OrderParts'

// Product catalog laid out like the reference platform's shop: results count,
// zoom, sort, category filter, grid / list / categories views, search, pages.

type View = 'GRID'|'LIST'|'CATEGORIES'
type Sort = 'featured'|'lowest'|'highest'
const SORT_LABEL: Record<Sort,string> = { featured:'Featured', lowest:'Lowest', highest:'Highest' }
const PAGE_SIZE = 9

function Dropdown({ label, items, onPick }: { label:string; items:{ key:string; label:string; active?:boolean }[]; onPick:(k:string)=>void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative" onBlur={e=>{ if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false) }}>
      <button type="button" className="btn btn-sm border-primary-600 text-primary-600 hover:bg-[#7367f00a] gap-1.5" aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(o=>!o)}>
        {label}<ChevronDown size={14}/>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 z-30 min-w-[10rem] py-2 bg-white rounded-md border border-black/5 shadow-float">
          {items.map(i => (
            <button key={i.key} type="button" role="menuitem" onClick={()=>{ onPick(i.key); setOpen(false) }}
              className={cn('w-full text-left px-5 py-2 capitalize hover:bg-primary-50 hover:text-primary-600', i.active ? 'text-primary-600' : 'text-ink-700')}>{i.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductCard({ p, list, onOrder }: { p:Product; list:boolean; onOrder:()=>void }) {
  return (
    <div className={cn('card overflow-hidden flex transition-shadow hover:shadow-[0_4px_25px_0_rgba(34,41,47,0.25)]', list ? 'flex-row' : 'flex-col')}>
      <button type="button" onClick={onOrder} className={cn('block', list ? 'w-64 flex-shrink-0 p-4' : 'p-4 pb-0')} aria-label={`Order ${p.name}`}>
        <ProductImage className={list ? 'h-full min-h-[150px]' : 'h-52'}/>
      </button>
      <div className={cn('p-[1.5rem] flex-1 flex flex-col min-w-0', list && 'border-l border-surface-200')}>
        <div className="flex items-center justify-between mb-2">
          <Rating n={p.rating}/>
          {!list && <h6 className="font-semibold text-ink-900">{p.price.toFixed(2)} €</h6>}
        </div>
        <button type="button" onClick={onOrder} className="text-left font-semibold text-ink-900 hover:text-primary-600 capitalize">{p.name}</button>
        <p className="text-sm">By <span className="text-primary-600">{p.provider ?? '—'}</span></p>
        {p.description && <p className="text-ink-700 mt-2 line-clamp-2 first-letter:uppercase">{p.description}</p>}
        <div className={cn('mt-auto pt-4 flex items-center gap-3', list ? 'justify-between' : 'justify-end')}>
          {list && <h6 className="font-semibold text-ink-900 text-[1.2rem]">{p.price.toFixed(2)} €</h6>}
          <button type="button" className="btn-primary btn-sm" onClick={onOrder}>Order</button>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const isLab = useAuthStore(s=>s.user?.role === 'admin')
  const { data:products=[], isLoading } = useProducts()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('GRID')
  const [columns, setColumns] = useState(3)
  const [sort, setSort] = useState<Sort>('featured')
  const [category, setCategory] = useState<string|null>(null)
  const [page, setPage] = useState(1)

  const categories = useMemo(() => [...new Set(products.map(p=>p.category).filter((c): c is string => !!c))].sort(), [products])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = products.filter(p => (!category || p.category === category) && (!q || p.name.toLowerCase().includes(q) || (p.provider ?? '').toLowerCase().includes(q)))
    if (sort === 'lowest') return [...list].sort((a,b)=>a.price-b.price)
    if (sort === 'highest') return [...list].sort((a,b)=>b.price-a.price)
    return list
  }, [products, search, category, sort])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const shown = filtered.slice((current-1)*PAGE_SIZE, current*PAGE_SIZE)
  const pick = (c:string|null) => { setCategory(c); setPage(1); if (view === 'CATEGORIES') setView('GRID') }
  const exportExcel = () => downloadCsv(`products-${new Date().toISOString().slice(0,10)}.csv`, [
    ['Name','Provider','Category','Price','Delivery days','Rating'],
    ...filtered.map(p=>[p.name, p.provider, p.category, p.price.toFixed(2), p.delivery_start_days, p.rating]),
  ])
  const viewBtn = (v:View, Icon:typeof LayoutGrid, label:string) => (
    <button type="button" aria-label={label} aria-pressed={view===v} title={label} onClick={()=>setView(v)}
      className={cn('w-10 h-[2.4rem] flex items-center justify-center border border-primary-600 -ml-px first:ml-0 first:rounded-l-[0.358rem] last:rounded-r-[0.358rem]', view===v ? 'bg-primary-600 text-white' : 'text-primary-600 hover:bg-[#7367f00a]')}>
      <Icon size={17}/>
    </button>
  )

  return (
    <div className="space-y-[1.5rem] animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {view === 'CATEGORIES' || category ? (
          <div className="flex items-center gap-2 text-[1.1rem]">
            <button type="button" className={cn(category ? 'text-primary-600 hover:underline' : 'text-ink-900 font-medium')} onClick={()=>{ setCategory(null); setView('CATEGORIES') }}>Categories</button>
            {category && <><ChevronRight size={16} className="text-ink-400"/><span className="text-ink-900 font-medium capitalize">{category}</span></>}
          </div>
        ) : (
          <p className="font-semibold text-ink-900">{filtered.length} results found</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {view === 'GRID' && (
            <div className="hidden lg:flex">
              <button type="button" aria-label="Zoom out" title="Show more per row" disabled={columns >= 5} onClick={()=>setColumns(c=>c+1)}
                className="w-10 h-[2.4rem] flex items-center justify-center border border-primary-600 text-primary-600 rounded-l-[0.358rem] hover:bg-[#7367f00a] disabled:opacity-50"><ZoomOut size={16}/></button>
              <button type="button" aria-label="Zoom in" title="Show fewer per row" disabled={columns <= 1} onClick={()=>setColumns(c=>c-1)}
                className="w-10 h-[2.4rem] flex items-center justify-center border border-primary-600 -ml-px text-primary-600 rounded-r-[0.358rem] hover:bg-[#7367f00a] disabled:opacity-50"><ZoomIn size={16}/></button>
            </div>
          )}
          {categories.length > 0 && view !== 'CATEGORIES' && (
            <Dropdown label={category ?? 'Filter by category'} onPick={k=>pick(k === '*' ? null : k)}
              items={[...(category ? [{ key:'*', label:'All categories' }] : []), ...categories.filter(c=>c!==category).map(c=>({ key:c, label:c }))]}/>
          )}
          <Dropdown label={SORT_LABEL[sort]} onPick={k=>setSort(k as Sort)} items={(Object.keys(SORT_LABEL) as Sort[]).map(k=>({ key:k, label:SORT_LABEL[k], active:k===sort }))}/>
          {isLab && <button type="button" title="Export to Excel" aria-label="Export to Excel" className="w-10 h-[2.4rem] flex items-center justify-center border border-primary-600 rounded-[0.358rem] text-primary-600 hover:bg-[#7367f00a]" onClick={exportExcel}><FileSpreadsheet size={17}/></button>}
          <div className="flex">
            {viewBtn('GRID', LayoutGrid, 'Grid view')}
            {viewBtn('LIST', List, 'List view')}
            {categories.length > 0 && viewBtn('CATEGORIES', Shapes, 'Categories view')}
          </div>
        </div>
      </div>

      {view !== 'CATEGORIES' && (
        <div className="relative">
          <input className="input pr-11 shadow-card border-0" placeholder="Search Product" aria-label="Search Product" value={search} onChange={e=>{ setSearch(e.target.value); setPage(1) }}/>
          <Search size={17} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400"/>
        </div>
      )}

      {isLoading ? <div className="flex justify-center py-16"><Spinner/></div> : view === 'CATEGORIES' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[2rem]">
          {categories.map(c => {
            const count = products.filter(p=>p.category===c).length
            return (
              <button key={c} type="button" onClick={()=>pick(c)} className="card p-[1.5rem] text-left hover:shadow-[0_4px_25px_0_rgba(34,41,47,0.25)] transition-shadow">
                <ProductImage className="h-40 mb-4"/>
                <h5 className="font-semibold text-ink-900 capitalize">{c}</h5>
                <p className="text-ink-500">{count} product{count===1?'':'s'}</p>
              </button>
            )
          })}
        </div>
      ) : filtered.length === 0 ? <EmptyState title="No products found"/> : (
        <>
          <section className={view === 'LIST' ? 'space-y-[2rem]' : 'grid gap-[2rem]'}
            style={view === 'GRID' ? { gridTemplateColumns:`repeat(${columns}, minmax(0, 1fr))` } : undefined} aria-label="Products">
            {shown.map(p => <ProductCard key={p.id} p={p} list={view==='LIST'} onOrder={()=>navigate(`/products/${p.id}`)}/>)}
          </section>
          {pages > 1 && (
            <nav className="flex justify-center gap-1" aria-label="Pages">
              {[[ChevronsLeft,1,'First'],[ChevronLeft,current-1,'Previous']].map(([I,n,l])=>{ const Icon = I as typeof ChevronLeft; return (
                <button key={l as string} type="button" aria-label={l as string} disabled={current===1} onClick={()=>setPage(n as number)} className="w-9 h-9 rounded-full bg-surface-100 flex items-center justify-center disabled:opacity-50"><Icon size={15}/></button>) })}
              {Array.from({ length:pages }, (_,i)=>i+1).map(n=>(
                <button key={n} type="button" aria-current={n===current ? 'page' : undefined} onClick={()=>setPage(n)}
                  className={cn('w-9 h-9 rounded-full', n===current ? 'bg-primary-600 text-white shadow-[0_4px_18px_-4px_#7367f0]' : 'bg-surface-100 hover:text-primary-600')}>{n}</button>
              ))}
              {[[ChevronRight,current+1,'Next'],[ChevronsRight,pages,'Last']].map(([I,n,l])=>{ const Icon = I as typeof ChevronLeft; return (
                <button key={l as string} type="button" aria-label={l as string} disabled={current===pages} onClick={()=>setPage(n as number)} className="w-9 h-9 rounded-full bg-surface-100 flex items-center justify-center disabled:opacity-50"><Icon size={15}/></button>) })}
            </nav>
          )}
        </>
      )}
    </div>
  )
}
