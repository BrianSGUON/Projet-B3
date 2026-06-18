'use client'
import { useEffect, useState } from 'react'
import { Plus, X, Check, Trash2, ChevronDown, FileText, Download, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
  SENT: { label: 'Envoyée', color: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'Payée', color: 'bg-emerald-100 text-emerald-700' },
  OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700' },
}

type InvoiceItem = { description: string; quantity: number; unitPrice: number }
type Reminder = { id: string; level: number; sentAt: string; daysOverdue: number }
type Invoice = { id: string; number: string; status: string; amount: number; tax: number; dueDate: string; issuedDate: string; notes?: string; client: { id: string; name: string; company?: string; email: string }; project?: { id: string; name: string }; items: InvoiceItem[]; reminders?: Reminder[] }
type Client = { id: string; name: string; company?: string }
type Project = { id: string; name: string; client: { id: string } }

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const dueDefault = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const [form, setForm] = useState({ clientId: '', projectId: '', issuedDate: today, dueDate: dueDefault, tax: '20', notes: '', items: [{ description: '', quantity: '1', unitPrice: '' }] as { description: string; quantity: string; unitPrice: string }[] })

  const load = () => {
    setLoading(true)
    Promise.all([fetch('/api/invoices').then(r => r.json()), fetch('/api/clients').then(r => r.json()), fetch('/api/projects').then(r => r.json())])
      .then(([inv, c, p]) => { setInvoices(Array.isArray(inv) ? inv : []); setClients(Array.isArray(c) ? c : []); setProjects(Array.isArray(p) ? p : []) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: '1', unitPrice: '' }] }))
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i: number, key: string, val: string) => setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [key]: val } : item) }))

  const subtotal = form.items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0)
  const total = subtotal * (1 + parseFloat(form.tax || '0') / 100)

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: form.clientId, projectId: form.projectId || null, issuedDate: form.issuedDate, dueDate: form.dueDate, tax: parseFloat(form.tax) || 20, notes: form.notes || null, items: form.items.map(it => ({ description: it.description, quantity: parseFloat(it.quantity) || 1, unitPrice: parseFloat(it.unitPrice) || 0 })) }),
    })
    setSaving(false)
    if (!res.ok) { const err = await res.json(); alert(`Erreur: ${err.detail ?? err.error ?? 'Inconnue'}`); return }
    setModal(false); load()
  }

  const updateStatus = async (id: string, status: string) => { await fetch(`/api/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); load() }
  const remove = async (id: string) => { if (!confirm('Supprimer cette facture ?')) return; await fetch(`/api/invoices/${id}`, { method: 'DELETE' }); load() }
  const remindNow = async (id: string) => {
    const res = await fetch(`/api/invoices/${id}/remind`, { method: 'POST' })
    if (!res.ok) { const err = await res.json().catch(() => ({})); alert(err.detail ?? err.error ?? 'Échec de la relance'); return }
    load()
  }

  const REMINDER_LABEL: Record<number, string> = { 1: 'Rappel poli', 2: 'Relance ferme', 3: 'Mise en demeure' }

  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'SENT').reduce((s, i) => s + i.amount, 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{invoices.length} facture{invoices.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm">
          <Plus size={16} /><span className="hidden sm:inline">Nouvelle facture</span>
        </button>
      </div>

      {/* Summary — 3 cols, smaller on mobile */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Encaissé', value: totalPaid, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'En attente', value: totalPending, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total', value: totalPaid + totalPending, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`card p-3 sm:p-5 ${bg} border-0`}>
            <div className="text-xs sm:text-sm text-gray-500 mb-1">{label}</div>
            <div className={`text-base sm:text-2xl font-bold ${color}`}>{value.toLocaleString('fr-FR')} €</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400 text-sm animate-pulse">Chargement…</div> :
        invoices.length === 0 ? <div className="p-8 text-center text-gray-400 text-sm">Aucune facture.</div> :
        invoices.map(inv => (
          <div key={inv.id} className="border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-gray-50/50">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{inv.number}</span>
                  <span className={`badge ${STATUS_CONFIG[inv.status]?.color} text-xs`}>{STATUS_CONFIG[inv.status]?.label}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">
                  {inv.client.company ?? inv.client.name}
                  {inv.project && <span className="ml-1">· {inv.project.name}</span>}
                </div>
                {/* Mobile: show date inline */}
                <div className="text-xs text-gray-400 mt-0.5 sm:hidden">
                  Éch. {format(new Date(inv.dueDate), 'dd MMM yyyy', { locale: fr })}
                </div>
              </div>
              {/* Desktop dates */}
              <div className="hidden md:block text-xs text-gray-400 whitespace-nowrap">{format(new Date(inv.dueDate), 'dd MMM yyyy', { locale: fr })}</div>
              <div className="font-bold text-gray-900 text-sm sm:text-base whitespace-nowrap">
                {(inv.amount * (1 + inv.tax / 100)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {inv.status === 'DRAFT' && <button onClick={() => updateStatus(inv.id, 'SENT')} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-200 font-medium hidden sm:block">Envoyer</button>}
                {inv.status === 'SENT' && <button onClick={() => updateStatus(inv.id, 'PAID')} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-200 font-medium hidden sm:block">Payée</button>}
                {inv.status === 'OVERDUE' && (
                  <button onClick={() => remindNow(inv.id)} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg hover:bg-orange-200 font-medium hidden sm:flex items-center gap-1">
                    <Bell size={11} /> Relancer
                  </button>
                )}
                <a
                  href={`/api/invoices/${inv.id}/pdf`}
                  title="Télécharger le PDF"
                  className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600"
                >
                  <Download size={14} />
                </a>
                <button onClick={() => setExpanded(expanded === inv.id ? null : inv.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                  <ChevronDown size={15} className={`transition-transform ${expanded === inv.id ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => remove(inv.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>

            {expanded === inv.id && (
              <div className="px-4 sm:px-6 pb-4 pt-0">
                {/* Mobile status actions */}
                <div className="flex gap-2 mb-3 sm:hidden flex-wrap">
                  {inv.status === 'DRAFT' && <button onClick={() => updateStatus(inv.id, 'SENT')} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium">Marquer envoyée</button>}
                  {inv.status === 'SENT' && <button onClick={() => updateStatus(inv.id, 'PAID')} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-medium">Marquer payée</button>}
                  {inv.status === 'OVERDUE' && (
                    <button onClick={() => remindNow(inv.id)} className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                      <Bell size={12} /> Relancer
                    </button>
                  )}
                  <a href={`/api/invoices/${inv.id}/pdf`} className="text-xs bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                    <Download size={12} /> Télécharger le PDF
                  </a>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 overflow-x-auto">
                  <table className="w-full text-sm min-w-[320px]">
                    <thead><tr className="text-gray-400 text-xs border-b border-gray-200"><th className="text-left pb-2">Description</th><th className="text-right pb-2">Qté</th><th className="text-right pb-2">PU HT</th><th className="text-right pb-2">Total HT</th></tr></thead>
                    <tbody>
                      {inv.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700">{item.description}</td>
                          <td className="py-2 text-right text-gray-600">{item.quantity}</td>
                          <td className="py-2 text-right text-gray-600">{item.unitPrice.toLocaleString('fr-FR')} €</td>
                          <td className="py-2 text-right font-medium">{(item.quantity * item.unitPrice).toLocaleString('fr-FR')} €</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr><td colSpan={3} className="pt-3 text-right text-gray-500">HT</td><td className="pt-3 text-right font-semibold">{inv.amount.toLocaleString('fr-FR')} €</td></tr>
                      <tr><td colSpan={3} className="text-right text-gray-500">TVA {inv.tax}%</td><td className="text-right">{(inv.amount * inv.tax / 100).toLocaleString('fr-FR')} €</td></tr>
                      <tr className="font-bold"><td colSpan={3} className="pt-2 text-right">TTC</td><td className="pt-2 text-right text-violet-700">{(inv.amount * (1 + inv.tax / 100)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</td></tr>
                    </tfoot>
                  </table>
                  {inv.notes && <p className="mt-3 text-xs text-gray-400 italic">{inv.notes}</p>}
                </div>

                {!!inv.reminders?.length && (
                  <div className="mt-3 bg-orange-50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 mb-2">
                      <Bell size={13} /> Historique des relances
                    </div>
                    <div className="space-y-1.5">
                      {inv.reminders.map(r => (
                        <div key={r.id} className="flex items-center justify-between text-xs text-orange-700">
                          <span>{REMINDER_LABEL[r.level] ?? `Niveau ${r.level}`} · {r.daysOverdue}j de retard</span>
                          <span className="text-orange-500">{format(new Date(r.sentAt), 'dd MMM yyyy', { locale: fr })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Nouvelle facture</h2>
              <button onClick={() => setModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value, projectId: '' }))}>
                    <option value="">Sélectionner…</option>{clients.map(c => <option key={c.id} value={c.id}>{c.company ?? c.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Projet</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
                    <option value="">Aucun</option>{projects.filter(p => !form.clientId || p.client.id === form.clientId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Émission</label><input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.issuedDate} onChange={e => setForm(f => ({ ...f, issuedDate: e.target.value }))} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Échéance</label><input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">TVA (%)</label><input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lignes *</label>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input placeholder="Description" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm min-w-0" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                      <input type="number" placeholder="Qté" className="w-16 border border-gray-200 rounded-xl px-2 py-2 text-sm" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                      <input type="number" placeholder="PU €" className="w-24 border border-gray-200 rounded-xl px-2 py-2 text-sm" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                      {form.items.length > 1 && <button onClick={() => removeItem(i)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg shrink-0"><X size={13} /></button>}
                    </div>
                  ))}
                </div>
                <button onClick={addItem} className="mt-2 text-sm text-violet-600 flex items-center gap-1"><Plus size={13} />Ajouter une ligne</button>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <div className="flex justify-between text-gray-500 mb-1"><span>HT</span><span className="font-medium">{subtotal.toLocaleString('fr-FR')} €</span></div>
                <div className="flex justify-between text-gray-500 mb-2"><span>TVA {form.tax}%</span><span>{(subtotal * parseFloat(form.tax || '0') / 100).toLocaleString('fr-FR')} €</span></div>
                <div className="flex justify-between font-bold text-gray-900"><span>TTC</span><span className="text-violet-700">{total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</span></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ex: Acompte 50%…" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Annuler</button>
              <button onClick={save} disabled={saving || !form.clientId || form.items.some(it => !it.description || !it.unitPrice)} className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
                <Check size={16} />{saving ? 'Création…' : 'Créer la facture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
