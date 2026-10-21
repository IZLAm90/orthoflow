import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { OdontogramMark } from '../../lib/queries/products'

// Behaviour mirrors the reference platform's odontogram: clicking a tooth opens a
// menu of the product's marks at the cursor (a single-mark product toggles it
// directly), a tooth carrying 2+ marks shows the "multiple selection" colour,
// and a mark with a limit stops accepting teeth at "(Max N)".

export const MULTIPLE_COLOR = '#0f766e'
const FALLBACK_MARK: OdontogramMark = { id:'selected', name:'Selected', color:'#f59e0b' }

// FDI order, left to right as the dentist faces the patient. `size` is the
// column's share of the width, so molars get more room than incisors.
const UPPER = [[18,6],[17,7],[16,7],[15,6],[14,7],[13,5],[12,5],[11,7],[21,6],[22,6],[23,6],[24,6],[25,6],[26,6],[27,6],[28,7]] as const
const LOWER = [[48,6],[47,7],[46,7],[45,6],[44,7],[43,5],[42,5],[41,7],[31,6],[32,6],[33,6],[34,6],[35,6],[36,6],[37,6],[38,7]] as const
const TOTAL = UPPER.reduce((s,[,w])=>s+w, 0)
const VB_W = 1000, VB_H = 260, MID = 130

type Kind = 'molar'|'premolar'|'canine'|'incisor'
const kindOf = (t:number): Kind => { const d = t % 10; return d >= 6 ? 'molar' : d >= 4 ? 'premolar' : d === 3 ? 'canine' : 'incisor' }

// Upper-jaw geometry (roots up, crown toward the midline); lower teeth are the
// same shapes mirrored across MID.
function toothPaths(t:number, cx:number, colW:number) {
  const kind = kindOf(t), upper = t < 30
  // Roots take ~2/3 of the tooth like the reference drawing; crown sits by the number.
  const crownTop = 70, crownBottom = 104
  const cw = colW * (kind==='molar' ? 0.66 : kind==='premolar' ? 0.5 : kind==='canine' ? 0.5 : t%10===2 ? 0.44 : 0.52)
  const l = cx - cw/2, r = cx + cw/2
  const rootTop = kind==='canine' ? 2 : kind==='molar' ? 22 : kind==='premolar' ? 12 : t%10===2 ? 14 : 8
  let crown: string
  if (kind === 'molar') {
    crown = `M${l},${crownTop} L${r},${crownTop} C${r+3},${crownTop+14} ${r+2},${crownBottom-6} ${r-4},${crownBottom} Q${cx+cw/4},${crownBottom-7} ${cx},${crownBottom} Q${cx-cw/4},${crownBottom-7} ${l+4},${crownBottom} C${l-2},${crownBottom-6} ${l-3},${crownTop+14} ${l},${crownTop} Z`
  } else if (kind === 'incisor') {
    crown = `M${l},${crownTop} L${r},${crownTop} C${r+2},${crownTop+18} ${r+1},${crownBottom-4} ${r-2},${crownBottom} L${l+2},${crownBottom} C${l-1},${crownBottom-4} ${l-2},${crownTop+18} ${l},${crownTop} Z`
  } else {
    // premolar / canine: rounded, canine pointed
    const tip = kind==='canine' ? crownBottom+2 : crownBottom
    crown = `M${l},${crownTop} L${r},${crownTop} C${r+4},${crownTop+16} ${r},${tip-4} ${cx},${tip} C${l},${tip-4} ${l-4},${crownTop+16} ${l},${crownTop} Z`
  }
  const roots: string[] = []
  const root = (x0:number, x1:number, apex:number, top:number) => `M${x0},${crownTop+2} C${x0},${(crownTop+top)/2} ${apex-3},${top+10} ${apex},${top} C${apex+3},${top+10} ${x1},${(crownTop+top)/2} ${x1},${crownTop+2} Z`
  if (kind === 'molar') {
    roots.push(root(l+1, cx-1, l+cw*0.18, rootTop))
    roots.push(root(cx+1, r-1, r-cw*0.18, rootTop+4))
    if (upper) roots.push(root(cx-cw*0.18, cx+cw*0.18, cx, rootTop-6))
  } else {
    roots.push(root(l+2, r-2, cx + (kind==='premolar' && t%10===4 && upper ? -1 : 0), rootTop))
  }
  return { crown, roots, upper }
}

function Tooth({ t, cx, colW, color, multiple }: { t:number; cx:number; colW:number; color:string|null; multiple:boolean }) {
  const { crown, roots, upper } = toothPaths(t, cx, colW)
  const mirror = upper ? undefined : `translate(0 ${2*MID}) scale(1 -1)`
  return (
    <g transform={mirror}>
      {roots.map((d,i)=><path key={i} d={d} fill="#c9b78a" stroke="#6b5f45" strokeWidth="1.2" strokeLinejoin="round"/>)}
      <path d={crown} fill={color ?? '#ffffff'} fillOpacity={color ? 0.85 : 1} stroke={color ? (multiple ? MULTIPLE_COLOR : color) : '#b9b9b9'} strokeWidth={color ? 2.2 : 1.6} strokeLinejoin="round"/>
    </g>
  )
}

function Dot({ color }: { color:string }) {
  return <span className="inline-block w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ backgroundColor:color }}/>
}

// "● Don't move (Max 4): 11,21" -- same line format as the reference legend
function MarkLine({ m, teeth }: { m:OdontogramMark; teeth:number[] }) {
  return (
    <li className="flex items-center gap-2 text-sm text-ink-700">
      <Dot color={m.color}/>
      <span>
        {m.name}{m.limit ? <span className="text-ink-400"> (Max {m.limit})</span> : null}
        {teeth.length > 0 && <span className="text-ink-500">: {teeth.join(',')}</span>}
      </span>
    </li>
  )
}

export interface OdontogramProps {
  marks: OdontogramMark[]
  value: Record<number, string[]>
  onChange?: (next: Record<number, string[]>) => void
  multiple?: boolean
  readOnly?: boolean
}

export default function Odontogram({ marks: productMarks, value, onChange, multiple=false, readOnly=false }: OdontogramProps) {
  const marks = productMarks.length ? productMarks : [FALLBACK_MARK]
  const wrapRef = useRef<HTMLDivElement>(null)
  const legendRef = useRef<HTMLLIElement>(null)
  const [menu, setMenu] = useState<{ tooth:number; x:number; y:number }|null>(null)
  const [legendOpen, setLegendOpen] = useState(false)

  useEffect(() => {
    if (!menu && !legendOpen) return
    const close = (e: MouseEvent) => {
      const target = e.target as Node
      if (menu && !wrapRef.current?.querySelector('[data-menu]')?.contains(target)) setMenu(null)
      if (legendOpen && !legendRef.current?.contains(target)) setLegendOpen(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(null); setLegendOpen(false) } }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [menu, legendOpen])

  const teethWith = (markId:string) => Object.keys(value).map(Number).filter(t=>value[t]?.includes(markId)).sort((a,b)=>a-b)
  const marksOf = (t:number) => (value[t] ?? []).map(id=>marks.find(m=>m.id===id)).filter((m): m is OdontogramMark => !!m)
  const colorOf = (t:number) => { const m = marksOf(t); return m.length > 1 ? MULTIPLE_COLOR : m[0]?.color ?? null }
  const atLimit = (m:OdontogramMark) => !!m.limit && teethWith(m.id).length >= m.limit

  // Same rules as the reference handleClick: remove if present; otherwise (when
  // the product is single-mark) clear the tooth first, then add within the limit.
  const apply = (tooth:number, mark:OdontogramMark) => {
    const current = value[tooth] ?? []
    const next = { ...value }
    if (current.includes(mark.id)) {
      const rest = current.filter(id=>id!==mark.id)
      if (rest.length) next[tooth] = rest; else delete next[tooth]
    } else {
      if (atLimit(mark)) return
      next[tooth] = multiple ? [...current, mark.id] : [mark.id]
    }
    onChange?.(next)
  }

  const onToothClick = (e: React.MouseEvent, tooth:number) => {
    e.preventDefault()
    if (readOnly) return
    if (marks.length === 1) { apply(tooth, marks[0]); return }
    const box = wrapRef.current!.getBoundingClientRect()
    setMenu({ tooth, x: e.clientX - box.left, y: e.clientY - box.top })
  }

  const layout = (row: readonly (readonly [number, number])[]) => {
    let x = 0
    return row.map(([t, size]) => { const w = size / TOTAL * VB_W; const cell = { t, x, w, cx: x + w/2 }; x += w; return cell })
  }
  const upper = layout(UPPER), lower = layout(LOWER)
  const used = marks.filter(m=>teethWith(m.id).length>0)
  const anyMultiple = Object.values(value).some(v=>v.length>1)

  return (
    <div>
      {productMarks.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          <li className="relative" ref={legendRef}>
            <button type="button" onClick={()=>setLegendOpen(o=>!o)} className="text-sm text-primary-600 hover:underline font-medium">View Color Legend</button>
            {legendOpen && (
              <div role="dialog" aria-label="Color Legend" className="absolute z-40 left-full top-1/2 -translate-y-1/2 ml-3 w-64 bg-white rounded-lg border border-surface-200 shadow-float">
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-white border-l border-b border-surface-200"/>
                <p className="px-4 py-2.5 border-b border-surface-100 text-sm font-semibold text-ink-900 bg-surface-50 rounded-t-lg">Color Legend</p>
                <ul className="px-4 py-3 space-y-2">
                  {multiple && marks.length > 1 && <li className="flex items-center gap-2 text-sm text-ink-700"><Dot color={MULTIPLE_COLOR}/><strong>Multiple selection</strong></li>}
                  {marks.map(m=><MarkLine key={m.id} m={m} teeth={teethWith(m.id)}/>)}
                </ul>
              </div>
            )}
          </li>
          {multiple && marks.length > 1 && anyMultiple && (
            <li className="flex items-center gap-2 text-sm text-ink-700"><Dot color={MULTIPLE_COLOR}/><strong>This color indicates that the tooth has multiple selections.</strong></li>
          )}
          {used.map(m=><MarkLine key={m.id} m={m} teeth={teethWith(m.id)}/>)}
        </ul>
      )}

      <div ref={wrapRef} className="relative select-none">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" role="img" aria-label="Odontogram">
          <line x1="0" y1={MID} x2={VB_W} y2={MID} stroke="#1f2937" strokeWidth="1.5"/>
          <line x1={VB_W/2 + 1} y1="62" x2={VB_W/2 + 1} y2={VB_H-62} stroke="#1f2937" strokeWidth="1"/>
          {[...upper, ...lower].map(({ t, x, w, cx }) => {
            const isUpper = t < 30
            const color = colorOf(t)
            return (
              <g key={t} data-tooth={t} className={readOnly ? undefined : 'cursor-pointer group'} onClick={e=>onToothClick(e,t)} onContextMenu={e=>onToothClick(e,t)}>
                <rect x={x} y={isUpper ? 0 : MID} width={w} height={MID} fill="transparent" className={readOnly ? undefined : 'group-hover:fill-primary-500/5'}/>
                <Tooth t={t} cx={cx} colW={w} color={color} multiple={marksOf(t).length>1}/>
                <text x={cx} y={isUpper ? MID-8 : MID+22} textAnchor="middle" fontSize="17" fontWeight="700" fill={color ? '#111827' : '#1e1b4b'}>{t}</text>
                <title>{`Tooth ${t}${marksOf(t).length ? ` — ${marksOf(t).map(m=>m.name).join(', ')}` : ''}`}</title>
              </g>
            )
          })}
        </svg>

        {menu && (
          <ul data-menu role="menu" style={{ left: menu.x, top: menu.y }}
            className="absolute z-40 min-w-[10rem] py-2 bg-white rounded-md border border-black/5 shadow-[0_5px_25px_rgba(34,41,47,0.1)]">
            <li className="px-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Tooth {menu.tooth}</li>
            {marks.map(m=>{
              const has = (value[menu.tooth] ?? []).includes(m.id)
              const full = !has && atLimit(m)
              return (
                <li key={m.id} role="menuitem" aria-disabled={full}
                  onClick={()=>{ if (!full) { apply(menu.tooth, m); setMenu(null) } }}
                  className={`flex items-center gap-2.5 px-5 py-2.5 text-sm ${full ? 'text-ink-300 cursor-not-allowed' : 'text-ink-600 cursor-pointer hover:bg-primary-50 hover:text-primary-700'}`}>
                  {has
                    ? <span className="w-6 h-6 -my-1 -ml-1.5 flex items-center justify-center rounded border border-surface-200 bg-white"><Trash2 size={13} className="text-red-500"/></span>
                    : <Dot color={m.color}/>}
                  <span>{m.name}{full && m.limit ? <span> (Max {m.limit})</span> : null}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
