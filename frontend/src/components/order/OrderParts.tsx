import { ClipboardList, CheckCircle2, ChevronRight, Star } from 'lucide-react'
import { cn } from '../../lib/utils'
import InfoTip from '../ui/InfoTip'
import type { Product, ProductOption } from '../../lib/queries/products'
import { optionVisible, type OptionValues } from '../../lib/orderOptions'

// Pieces shared by the order form and the order detail, laid out like the
// reference platform's checkout (bs-stepper header, product card, price list).

export function OrderStepper({ step }: { step:'order'|'finish' }) {
  const steps = [
    { id:'order', icon:ClipboardList, title:'Order', sub:'Your customized product' },
    { id:'finish', icon:CheckCircle2, title:'Finish', sub:'And wait for the delivery' },
  ] as const
  return (
    <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-[1.5rem] py-[1rem] mb-[2rem]" aria-label="Order steps">
      {steps.map((s, i) => {
        const active = s.id === step
        const done = step === 'finish' && s.id === 'order'
        const Icon = s.icon
        return (
          <div key={s.id} className="flex items-center gap-6">
            {i > 0 && <ChevronRight size={18} className="text-ink-400"/>}
            <div className="flex items-center gap-3" aria-current={active ? 'step' : undefined}>
              <span className={cn('w-[38px] h-[38px] rounded-[6px] flex items-center justify-center transition-all',
                active ? 'bg-primary-600 text-white shadow-[0_3px_6px_0_rgba(115,103,240,0.4)]' : done ? 'bg-[#7367f01f] text-primary-600' : 'bg-[#babfc71f] text-ink-500')}>
                <Icon size={18}/>
              </span>
              <span>
                <span className={cn('block font-semibold leading-tight', active || done ? 'text-primary-600' : 'text-ink-500')}>{s.title}</span>
                <span className="block text-[0.85rem] text-ink-400">{s.sub}</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// The animated success check shown on the finished order (reference: .success-checkmark)
export function SuccessCheckmark() {
  return (
    <div className="w-[80px] h-[80px] flex-shrink-0" aria-hidden="true">
      <svg viewBox="0 0 52 52" className="w-full h-full">
        <circle cx="26" cy="26" r="24" fill="none" stroke="#28c76f33" strokeWidth="2.5"/>
        <circle cx="26" cy="26" r="24" fill="none" stroke="#28c76f" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="151" strokeDashoffset="151" className="animate-[checkCircle_0.6s_ease-out_forwards]" transform="rotate(-90 26 26)"/>
        <path d="M15 27 l7 7 l15 -16" fill="none" stroke="#28c76f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="40" strokeDashoffset="40" className="animate-[checkTick_0.35s_0.55s_ease-out_forwards]"/>
      </svg>
    </div>
  )
}

export function ProductImage({ className }: { className?:string }) {
  return (
    <div className={cn('rounded-[0.428rem] bg-gradient-to-br from-primary-50 to-teal-50 flex items-center justify-center', className)}>
      <svg viewBox="0 0 80 80" className="w-3/4 h-3/4">
        <ellipse cx="40" cy="58" rx="28" ry="10" fill="#e8d5c0" opacity="0.4"/>
        <rect x="18" y="18" width="13" height="32" rx="6.5" fill="#f5f0ea" stroke="#d4c5b0" strokeWidth="1.2"/>
        <rect x="33" y="15" width="14" height="35" rx="7" fill="#f5f0ea" stroke="#d4c5b0" strokeWidth="1.2"/>
        <rect x="49" y="18" width="13" height="32" rx="6.5" fill="#f5f0ea" stroke="#d4c5b0" strokeWidth="1.2"/>
        <ellipse cx="25" cy="17" rx="4" ry="3" fill="#fbbf24" opacity="0.7"/>
        <ellipse cx="40" cy="14" rx="4" ry="3" fill="#fbbf24" opacity="0.5"/>
      </svg>
    </div>
  )
}

export function Rating({ n=5 }: { n?:number }) {
  return <div className="flex gap-0.5" aria-label={`${n} out of 5`}>{Array.from({ length:5 }).map((_,i)=><Star key={i} size={14} className={i < Math.round(n) ? 'fill-amber-600 text-amber-600' : 'text-surface-300'}/>)}</div>
}

/** "By brand" product card that heads the order form and the finished order. */
export function ProductHeader({ product, children }: { product?:Product|null; children?:React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5">
      <ProductImage className="h-[160px] sm:h-[150px]"/>
      <div className="space-y-1.5 min-w-0">
        <h5 className="text-[1.1rem] font-medium text-ink-900 capitalize">{product?.name ?? '…'}</h5>
        <p className="text-sm">By <a className="text-primary-600 capitalize">{product?.provider ?? '—'}</a></p>
        <Rating n={product?.rating ?? 5}/>
        {product?.description && <p className="text-ink-700 first-letter:uppercase">{product.description}</p>}
        {children}
      </div>
    </div>
  )
}

const money = (n:number) => `${n.toFixed(2)} €`

/** Renders a product's configured options (SECTION / INPUT / CHOOSER / LIST / BOOLEAN). */
export function ProductOptionsForm({ options, values, onChange, errors, submitted }: {
  options: ProductOption[]; values: OptionValues; onChange:(id:string, v:string|boolean|string[])=>void
  errors: Record<string,string>; submitted:boolean
}) {
  return (
    <div className="space-y-4">
      {options.filter(o => optionVisible(o, values)).map(o => {
        const err = submitted ? errors[o.id] : undefined
        const help = o.help ? <InfoTip text={o.help}/> : null
        if (o.type === 'SECTION') return (
          <div key={o.id} className="pt-2">
            <div className="flex items-center gap-3 text-primary-600">
              <div className="flex-1 h-px bg-primary-200"/><span className="font-medium capitalize">{o.title}</span><div className="flex-1 h-px bg-primary-200"/>
            </div>
            {o.help && <blockquote className="mt-2 pl-3 border-l-[3px] border-primary-600 text-ink-700">{o.help}</blockquote>}
          </div>
        )
        if (o.type === 'INPUT') return (
          <div key={o.id} data-invalid={!!err}>
            <label className="label capitalize" htmlFor={`opt-${o.id}`}>{o.title} {help}</label>
            <input id={`opt-${o.id}`} className={cn('input', err && 'border-red-500')} maxLength={o.max_length ?? 1000}
              value={String(values[o.id] ?? '')} onChange={e=>onChange(o.id, e.target.value)}/>
            {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
          </div>
        )
        if (o.type === 'BOOLEAN') {
          const on = values[o.id] === true || values[o.id] === 'true'; const cost = o.items?.[0]?.cost
          return (
            <div key={o.id} className="flex items-center gap-3">
              <button type="button" role="switch" aria-checked={on} aria-label={o.title} onClick={()=>onChange(o.id, !on)}
                className={cn('w-[3rem] h-[1.7rem] rounded-full relative transition-colors flex-shrink-0', on ? 'bg-primary-600' : 'bg-surface-300')}>
                <span className={cn('absolute left-0 top-[0.2rem] w-[1.3rem] h-[1.3rem] rounded-full bg-white shadow transition-transform', on ? 'translate-x-[1.5rem]' : 'translate-x-[0.2rem]')}/>
              </button>
              <span className="text-ink-900 capitalize">{o.title}{cost ? <span className="text-ink-400"> (+{money(cost)})</span> : null}</span>
              {help}
            </div>
          )
        }
        // CHOOSER: radios / checkboxes; LIST: dropdown
        const current = values[o.id]
        const chosen = Array.isArray(current) ? current : typeof current === 'string' && current ? [current] : []
        const set = (v:string) => o.multiple
          ? onChange(o.id, chosen.includes(v) ? chosen.filter(x=>x!==v) : [...chosen, v])
          : onChange(o.id, v)
        return (
          <div key={o.id} data-invalid={!!err}>
            <label className="label capitalize" htmlFor={o.type === 'LIST' ? `opt-${o.id}` : undefined}>{o.title} {help}</label>
            {o.type === 'CHOOSER' ? (
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
                {(o.items ?? []).map(i => (
                  <label key={i.value} className="flex items-center gap-2 cursor-pointer text-ink-700">
                    <input type={o.multiple ? 'checkbox' : 'radio'} name={`opt-${o.id}`} className="accent-primary-600 w-[1.15rem] h-[1.15rem]"
                      checked={chosen.includes(i.value)} onChange={()=>set(i.value)}/>
                    <span className="first-letter:uppercase">{i.label}{i.cost ? <span className="text-ink-400"> (+{money(i.cost)})</span> : null}</span>
                  </label>
                ))}
              </div>
            ) : (
              <select id={`opt-${o.id}`} multiple={o.multiple} className={cn('input', err && 'border-red-500', o.multiple && 'min-h-[6rem]')}
                value={o.multiple ? chosen : (chosen[0] ?? '')}
                onChange={e=>onChange(o.id, o.multiple ? Array.from(e.target.selectedOptions).map(x=>x.value) : e.target.value)}>
                {!o.multiple && <option value="">Select…</option>}
                {(o.items ?? []).map(i=><option key={i.value} value={i.value}>{i.label}{i.cost ? ` (+${money(i.cost)})` : ''}</option>)}
              </select>
            )}
            {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
          </div>
        )
      })}
    </div>
  )
}

/** Price Details list shared by the order form and the finished order. */
export function PriceDetails({ productName, productPrice, lines, total }: {
  productName:string; productPrice:number; lines:{ key:string; label:string; cost:number }[]; total:number
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between gap-3"><span className="capitalize">{productName}</span><span className="text-ink-900">{money(productPrice)}</span></div>
      {lines.map(l => <div key={l.key} className="flex justify-between gap-3"><span className="first-letter:uppercase">{l.label}</span><span className="text-ink-900">{money(l.cost)}</span></div>)}
      <div className="flex justify-between gap-3"><span>Standard Delivery</span><span className="text-teal-600">Free</span></div>
      <hr className="border-surface-200"/>
      <div className="flex justify-between gap-3 font-semibold text-ink-900"><span>Total</span><span>{money(total)}</span></div>
    </div>
  )
}
