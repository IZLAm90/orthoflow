import { useState, Fragment } from 'react'
import { Download, Eye, FileText, ChevronLeft } from 'lucide-react'
import { cn, formatDate } from '../lib/utils'
import { useInvoices, type InvoiceOrderLine } from '../lib/queries/invoices'
import { Spinner, EmptyState } from '../components/ui'

export default function InvoicesPage() {
  const { data:invoices=[], isLoading } = useInvoices()
  const [selected, setSelected] = useState<string | null>(null)
  const inv = invoices.find(i => i.id === selected)

  // Orders are grouped by prescribing doctor, each group followed by its own subtotal row.
  const doctorGroups: { doctor:string; orders:InvoiceOrderLine[] }[] = []
  if (inv) {
    for (const order of inv.orders) {
      const key = order.doctor || 'No doctor assigned'
      let group = doctorGroups.find(g => g.doctor === key)
      if (!group) { group = { doctor: key, orders: [] }; doctorGroups.push(group) }
      group.orders.push(order)
    }
  }

  if (selected && inv) {
    return (
      <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
        <button onClick={() => setSelected(null)} className="btn-ghost btn-sm gap-2">
          <ChevronLeft size={16}/> Back to invoices
        </button>

        <div className="card p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center">
                  <FileText size={20} className="text-white"/>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-ink-900">Invoice {inv.number}</h2>
                  <p className="text-sm text-ink-500">{inv.summary}</p>
                </div>
              </div>
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold',
                inv.status === 'paid' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
              )}>
                {inv.status === 'paid' ? 'Paid' : 'Draft'}
              </span>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm gap-2"><Download size={14}/>Download PDF</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-3">Billed To</p>
              <p className="font-semibold text-ink-900">{inv.billing_company||'—'}</p>
              <p className="text-sm text-ink-600">{inv.billing_address}</p>
              <p className="text-sm text-ink-600">VAT: {inv.billing_vat||'—'}</p>
              <p className="text-sm text-primary-600">{inv.billing_email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-ink-400 uppercase tracking-wide mb-3">Invoice Details</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">Invoice Number</span><span className="font-semibold text-ink-900">{inv.number}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Issue Date</span><span className="text-ink-700">{formatDate(inv.issue_date)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Due Date</span><span className="text-ink-700">{inv.due_date?formatDate(inv.due_date):'—'}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Status</span>
                  <span className={inv.status === 'paid' ? 'text-teal-600 font-semibold' : 'text-amber-600 font-semibold'}>
                    {inv.status === 'paid' ? 'Paid' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-surface-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50 text-xs font-medium text-ink-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Order Ref.</th>
                  <th className="text-left px-5 py-3">Patient</th>
                  <th className="text-left px-5 py-3">Product</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-right px-5 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {inv.orders.length===0 && <tr><td colSpan={5} className="text-center text-sm text-ink-400 py-6">No linked orders</td></tr>}
                {doctorGroups.map(group => (
                  <Fragment key={group.doctor}>
                    {group.orders.map((order, i) => (
                      <tr key={group.doctor+i} className="hover:bg-surface-50 transition-colors">
                        <td className="px-5 py-3 text-primary-600 font-semibold text-sm">{order.ref}</td>
                        <td className="px-5 py-3 text-sm text-ink-900">{order.patient}</td>
                        <td className="px-5 py-3 text-sm text-ink-600">{order.product}</td>
                        <td className="px-5 py-3 text-sm text-ink-500">{formatDate(order.date)}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-ink-900 text-right">{order.amount.toFixed(2)} EUR</td>
                      </tr>
                    ))}
                    <tr className="bg-surface-50/60">
                      <td colSpan={4} className="px-5 py-2 text-xs font-semibold text-ink-500 text-right">Total {group.doctor}</td>
                      <td className="px-5 py-2 text-xs font-bold text-ink-700 text-right">
                        {group.orders.reduce((sum,o)=>sum+o.amount,0).toFixed(2)} EUR
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-ink-500">Subtotal</span><span className="text-ink-700">{inv.total.toFixed(2)} EUR</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-500">VAT (0%)</span><span className="text-ink-700">0,00 EUR</span></div>
              <div className="divider"/>
              <div className="flex justify-between font-bold text-ink-900 text-lg">
                <span>Total</span>
                <span>{inv.total.toFixed(2)} EUR</span>
              </div>
              {inv.status === 'paid' && (
                <div className="text-center pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200">
                    ✓ Payment received
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="section-title">Invoices</h2><p className="text-muted">{invoices.length} invoices</p></div>
        <button className="btn-secondary btn-sm gap-2"><Download size={14}/>Export</button>
      </div>
      <div className="card p-3 flex gap-3 flex-wrap">
        <select className="input py-1.5 text-sm w-28"><option>All</option><option>Draft</option><option>Paid</option></select>
        <input type="date" className="input py-1.5 text-sm w-36"/>
        <span className="self-center text-ink-400 text-sm">-</span>
        <input type="date" className="input py-1.5 text-sm w-36"/>
        <input className="input py-1.5 text-sm flex-1" placeholder="Search…"/>
      </div>
      <div className="card overflow-hidden">
        {isLoading?<div className="flex justify-center py-16"><Spinner/></div>:invoices.length===0?(
          <EmptyState title="No invoices yet"/>
        ):(
        <table className="w-full">
          <thead>
            <tr className="bg-surface-50 text-xs font-medium text-ink-400 uppercase tracking-wide">
              <th className="text-left px-5 py-3">Invoice N°</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Issue Date</th>
              <th className="text-left px-5 py-3">Due Date</th>
              <th className="text-left px-5 py-3">Total</th>
              <th className="text-left px-5 py-3">Summary</th>
              <th className="text-left px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="table-row cursor-pointer" onClick={() => setSelected(inv.id)}>
                <td className="px-5 py-4 text-primary-600 font-bold text-sm">{inv.number}</td>
                <td className="px-5 py-4">
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', inv.status === 'paid' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700')}>
                    {inv.status === 'paid' ? 'Paid' : 'Draft'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-ink-700">{formatDate(inv.issue_date)}</td>
                <td className="px-5 py-4 text-sm text-ink-700">{inv.due_date?formatDate(inv.due_date):'—'}</td>
                <td className="px-5 py-4 text-sm font-bold text-ink-900">{inv.total.toFixed(2)} EUR</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-sm text-ink-700">
                    <FileText size={14} className="text-ink-400"/>{inv.summary}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <button className="text-ink-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-colors" onClick={e => { e.stopPropagation(); setSelected(inv.id) }}><Eye size={15}/></button>
                    <button className="text-ink-400 hover:text-primary-600 p-1.5 rounded-lg hover:bg-primary-50 transition-colors" onClick={e => e.stopPropagation()}><Download size={15}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        <div className="px-5 py-3 border-t border-surface-100">
          <p className="text-sm text-ink-500">{invoices.length} Total | Amount {invoices.reduce((sum,i)=>sum+i.total,0).toFixed(2)} EUR</p>
        </div>
      </div>
    </div>
  )
}
