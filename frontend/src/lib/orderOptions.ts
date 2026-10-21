import type { ProductOption } from './queries/products'
import type { DeliveryCenter } from './queries/deliveryCenters'

// Client side of the product-options order form (server: App\\Support\\ProductOptions).

const isOn = (v: unknown) => v === true || v === 'true'

export function deliveryAddress(dc?:DeliveryCenter|null) {
  if (!dc) return null
  return [dc.address, dc.locality, dc.postal_code, dc.city, dc.country].filter(Boolean).join(', ')
}

export type OptionValues = Record<string, string|boolean|string[]>

export function optionDefaults(options: ProductOption[]): OptionValues {
  const v: OptionValues = {}
  for (const o of options) {
    if (o.type === 'SECTION') continue
    if (o.type === 'BOOLEAN') v[o.id] = o.default === true || o.default === 'true'
    else if (o.multiple) v[o.id] = typeof o.default === 'string' && o.default ? o.default.split(',') : []
    else v[o.id] = typeof o.default === 'string' ? o.default : ''
  }
  return v
}

export const optionVisible = (o: ProductOption, values: OptionValues) => !o.depends_on || isOn(values[o.depends_on])

export function optionErrors(options: ProductOption[], values: OptionValues): Record<string,string> {
  const errs: Record<string,string> = {}
  for (const o of options) {
    if (o.type === 'SECTION' || o.type === 'BOOLEAN' || o.optional || !optionVisible(o, values)) continue
    const v = values[o.id]
    if (Array.isArray(v) ? v.length === 0 : !String(v ?? '').trim()) errs[o.id] = 'This field is required'
  }
  return errs
}

/** Priced selections, for the price details list. */
export function pricedOptions(options: ProductOption[], values: OptionValues) {
  const lines: { key:string; label:string; cost:number }[] = []
  for (const o of options) {
    if (o.type === 'SECTION' || !optionVisible(o, values)) continue
    const v = values[o.id]
    if (o.type === 'BOOLEAN') {
      const cost = o.items?.[0]?.cost ?? 0
      if (isOn(v) && cost) lines.push({ key:o.id, label:o.items?.[0]?.label || o.title, cost })
      continue
    }
    const chosen = Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []
    for (const c of chosen) {
      const item = o.items?.find(i => i.value === c)
      if (item?.cost) lines.push({ key:`${o.id}:${c}`, label:`${o.title}: ${item.label}`, cost:item.cost })
    }
  }
  return lines
}

export const toAnswers = (options: ProductOption[], values: OptionValues) =>
  options.filter(o => o.type !== 'SECTION' && optionVisible(o, values)).map(o => {
    const v = values[o.id]
    return { id:o.id, value: Array.isArray(v) ? v.join(',') : (v as string|boolean) }
  })

