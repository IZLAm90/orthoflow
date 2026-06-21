import React, { forwardRef } from 'react'
import { X } from 'lucide-react'
import { cn, getInitials } from '../../lib/utils'

export const Button = forwardRef<HTMLButtonElement,any>(
  ({variant='secondary',size='md',loading,leftIcon,rightIcon,className,children,disabled,...props},ref)=>{
    const cls={primary:'btn-primary',secondary:'btn-secondary',ghost:'btn-ghost',danger:'btn-danger'}[variant as string]||'btn-secondary'
    const sz=size==='sm'?'btn-sm':size==='lg'?'btn-lg':''
    return <button ref={ref} className={cn(cls,sz,className)} disabled={disabled||loading} {...props}>
      {loading?<svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>:leftIcon}
      {children}{rightIcon}
    </button>
  }
)
Button.displayName='Button'

export const Input = forwardRef<HTMLInputElement,any>(({label,error,hint,leftAddon,className,id,...props},ref)=>{
  const inputId=id||label?.toLowerCase().replace(/\s/g,'-')
  return <div className="flex flex-col gap-1">
    {label&&<label className="label" htmlFor={inputId}>{label}</label>}
    <div className="relative">
      {leftAddon&&<div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{leftAddon}</div>}
      <input ref={ref} id={inputId} className={cn('input',leftAddon&&'pl-9',error&&'border-red-400',className)} {...props}/>
    </div>
    {error&&<p className="text-xs text-red-600">{error}</p>}
    {hint&&!error&&<p className="text-xs text-ink-400">{hint}</p>}
  </div>
})
Input.displayName='Input'

export const Select = forwardRef<HTMLSelectElement,any>(({label,error,options,className,id,...props},ref)=>{
  const sid=id||label?.toLowerCase().replace(/\s/g,'-')
  return <div className="flex flex-col gap-1">
    {label&&<label className="label" htmlFor={sid}>{label}</label>}
    <select ref={ref} id={sid} className={cn('input cursor-pointer',className)} {...props}>
      {options.map((o:any)=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error&&<p className="text-xs text-red-600">{error}</p>}
  </div>
})
Select.displayName='Select'

export const Textarea = forwardRef<HTMLTextAreaElement,any>(({label,error,className,id,...props},ref)=>{
  const tid=id||label?.toLowerCase().replace(/\s/g,'-')
  return <div className="flex flex-col gap-1">
    {label&&<label className="label" htmlFor={tid}>{label}</label>}
    <textarea ref={ref} id={tid} className={cn('input min-h-[80px] resize-y',className)} {...props}/>
    {error&&<p className="text-xs text-red-600">{error}</p>}
  </div>
})
Textarea.displayName='Textarea'

export function Spinner({size=20,className}:{size?:number;className?:string}){
  return <svg className={cn('animate-spin',className)} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
}

const COLORS=['bg-primary-100 text-primary-700','bg-teal-100 text-teal-700','bg-purple-100 text-purple-700','bg-amber-100 text-amber-700','bg-rose-100 text-rose-700']
export function Avatar({name,src,size='md',className}:{name:string;src?:string;size?:string;className?:string}){
  const sz:any={xs:'w-6 h-6 text-[10px]',sm:'w-8 h-8 text-xs',md:'w-9 h-9 text-sm',lg:'w-11 h-11 text-base',xl:'w-14 h-14 text-lg'}
  const color=COLORS[name.charCodeAt(0)%COLORS.length]
  if(src) return <img src={src} alt={name} className={cn('rounded-full object-cover',sz[size],className)}/>
  return <div className={cn('rounded-full flex items-center justify-center font-semibold flex-shrink-0',sz[size],color,className)}>{getInitials(name)}</div>
}

export function Badge({variant='gray',children,dot,className}:{variant?:string;children:React.ReactNode;dot?:boolean;className?:string}){
  return <span className={cn(`badge-${variant}`,className)}>
    {dot&&<span className={cn('w-1.5 h-1.5 rounded-full inline-block mr-1',{'bg-primary-500':variant==='blue','bg-teal-500':variant==='green','bg-amber-500':variant==='amber','bg-red-500':variant==='red','bg-ink-400':variant==='gray'})}/>}
    {children}
  </span>
}

export function Modal({open,onClose,title,children,size='md',footer}:any){
  const sz:any={sm:'max-w-sm',md:'max-w-lg',lg:'max-w-2xl',xl:'max-w-4xl'}
  if(!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
    <div className={cn('relative w-full bg-white rounded-xl2 shadow-float flex flex-col max-h-[90vh]',sz[size])} onClick={(e:any)=>e.stopPropagation()}>
      {title&&<div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X size={16}/></button>
      </div>}
      <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      {footer&&<div className="px-6 py-4 border-t border-surface-200 flex justify-end gap-3">{footer}</div>}
    </div>
  </div>
}

export function EmptyState({icon,title,description,action}:any){
  return <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon&&<div className="text-ink-300 mb-4">{icon}</div>}
    <p className="text-base font-medium text-ink-700 mb-1">{title}</p>
    {description&&<p className="text-sm text-ink-400 mb-4 max-w-xs">{description}</p>}
    {action}
  </div>
}

export function ProgressBar({value,max=100,color='primary',className}:any){
  const pct=Math.min(100,Math.max(0,(value/max)*100))
  const bar:any={primary:'bg-primary-500',teal:'bg-teal-500',amber:'bg-amber-500',red:'bg-red-500'}
  return <div className={cn('h-1.5 rounded-full bg-surface-200 overflow-hidden',className)}>
    <div className={cn('h-full rounded-full transition-all duration-500',bar[color])} style={{width:`${pct}%`}}/>
  </div>
}

export function Card({className,children,...props}:any){
  return <div className={cn('card p-4',className)} {...props}>{children}</div>
}
