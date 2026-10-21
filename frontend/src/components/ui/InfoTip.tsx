import { useEffect, useRef, useState } from 'react'

// Click-to-open help bubble (the reference platform opens its ⓘ hints on click
// and keeps them open until you click elsewhere).
export default function InfoTip({ text, className }: { text:string; className?:string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  return (
    <span ref={ref} className={`relative inline-block align-middle ${className ?? ''}`}>
      <button type="button" aria-label="Help" aria-expanded={open}
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o) }}
        className="text-primary-500 hover:text-primary-700 ml-0.5 leading-none">ⓘ</button>
      {open && (
        <span role="tooltip" className="absolute z-40 left-1/2 -translate-x-1/2 top-full mt-1.5 w-64 rounded-lg bg-ink-900 text-white text-xs font-normal normal-case tracking-normal leading-relaxed px-3 py-2 shadow-float">
          {text}
        </span>
      )}
    </span>
  )
}
