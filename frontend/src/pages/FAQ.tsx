import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react'

const FAQS = [
  {
    category: 'Getting Started',
    items: [
      { q: 'How do I place my first order?', a: 'Go to Products, choose a product, click Order now, fill in patient details, complete the Odontogram and clinical fields, upload photos and files, then click Place Order.' },
      { q: 'What file formats are accepted?', a: 'We accept STL, PLY, OBJ (3D scan files), ZIP archives, PDF documents, and all common image formats (JPG, PNG, TIFF) and video files.' },
      { q: 'How do I add a new patient?', a: 'Type the patient name directly in the Patient field on the order form. Each order is linked to one patient.' },
    ]
  },
  {
    category: 'Orders & Delivery',
    items: [
      { q: 'How long does delivery take?', a: 'Standard delivery takes 3-5 business days from order confirmation. You can track the delivery date in the Order Details section.' },
      { q: 'Can I cancel or modify an order?', a: 'Orders can be modified or cancelled within 2 hours of placement if processing has not yet begun. Contact support immediately via the form below.' },
      { q: 'What is the WE SEGMENT CBCT option?', a: 'The WE SEGMENT CBCT option (+5.00 EUR) means our lab will perform the CBCT scan segmentation for you. Toggle it ON and upload your CBCT files.' },
      { q: 'What does Finished status mean?', a: 'A Finished status means your order is complete and the treatment plan files are ready. Find them in the Order Detail view under Treatment Plans.' },
    ]
  },
  {
    category: 'Treatment Plans',
    items: [
      { q: 'How do I approve a treatment plan?', a: 'Open the order from the Orders page, scroll to Treatment Plans, click View next to the plan, review the details, and click the approval button.' },
      { q: 'What does Finish plan mean?', a: 'Finish plan marks the treatment plan as complete and ready for manufacturing. Only click this after fully reviewing and approving the treatment plan.' },
      { q: 'Can I request changes to a treatment plan?', a: 'Yes. In the Treatment Plan Observations section on the order detail page, you can leave comments. The lab will review and update the plan.' },
    ]
  },
  {
    category: 'Billing & Invoices',
    items: [
      { q: 'How are invoices generated?', a: 'Invoices are generated automatically at the end of each billing period (monthly). View and download all invoices from the Invoices page in the sidebar.' },
      { q: 'What payment methods are accepted?', a: 'We accept bank transfers and major credit/debit cards. Payment details are in the Billing section of your Account Settings.' },
      { q: 'How do I update billing information?', a: 'Go to Settings then click Billing. Update your company name, VAT number, billing address, and email. Click Save Changes to confirm.' },
    ]
  },
  {
    category: 'Account & Settings',
    items: [
      { q: 'How do I add a new doctor?', a: 'Go to Settings then Doctors. Click Add doctor and fill in the full name, email, and phone number. The doctor will be available to select when placing orders.' },
      { q: 'How do I add a delivery center?', a: 'Go to Settings then Delivery centers. Click Add center and enter the center name, address, and phone number. You can add multiple delivery centers.' },
      { q: 'How do I change my password?', a: 'Go to Settings then Change Password. Enter your current password, new password, confirm it, and click Update Password.' },
      { q: 'How do I manage email notifications?', a: 'Go to Settings then Notifications. Toggle on or off notifications for orders, deliveries, treatment plan approvals, messages, invoices, and promotions.' },
    ]
  },
]

export default function FAQPage() {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0)

  const toggle = (key: string) => setOpen(o => o === key ? null : key)

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-soft">
          <HelpCircle size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-ink-900 mb-2">Frequently Asked Questions</h2>
        <p className="text-ink-500">Find answers to common questions about OrthoFlow</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          className="input pl-12 py-3 text-base w-full"
          placeholder="Search questions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-ink-400 text-sm">No results found for "{search}"</p>
        </div>
      )}

      {filtered.map(cat => (
        <div key={cat.category}>
          <h3 className="text-sm font-bold text-ink-400 uppercase tracking-widest mb-3 px-1">{cat.category}</h3>
          <div className="card overflow-hidden divide-y divide-surface-100">
            {cat.items.map((item, i) => {
              const key = cat.category + i
              const isOpen = open === key
              return (
                <div key={i}>
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-50 transition-colors text-left"
                    onClick={() => toggle(key)}
                  >
                    <p className="text-sm font-semibold text-ink-900 pr-4">{item.q}</p>
                    {isOpen
                      ? <ChevronUp size={18} className="text-primary-500 flex-shrink-0" />
                      : <ChevronDown size={18} className="text-ink-400 flex-shrink-0" />
                    }
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 bg-primary-50/30">
                      <p className="text-sm text-ink-600 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="card p-6 bg-gradient-to-br from-primary-50 to-teal-50 border border-primary-100">
        <h3 className="text-base font-bold text-ink-900 mb-1">Still have questions?</h3>
        <p className="text-sm text-ink-500 mb-4">Our support team is here to help you</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: MessageCircle, label: 'Live Chat', sub: 'Chat with us', color: 'text-primary-600 bg-primary-100' },
            { icon: Mail, label: 'Email Support', sub: 'support@orthoflow.io', color: 'text-teal-600 bg-teal-100' },
            { icon: Phone, label: 'Phone', sub: '+1 555-ORTHO', color: 'text-purple-600 bg-purple-100' },
          ].map(({ icon: Icon, label, sub, color }) => (
            <button key={label} className="card p-4 flex flex-col items-center gap-2 hover:shadow-card transition-all text-center">
              <div className={'w-10 h-10 rounded-xl flex items-center justify-center ' + color}>
                <Icon size={20} />
              </div>
              <p className="text-xs font-semibold text-ink-900">{label}</p>
              <p className="text-xs text-ink-400">{sub}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
