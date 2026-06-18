'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Mail, Phone, Building2, AlertCircle, Link2, Copy, CheckCheck } from 'lucide-react'
import { isValidEmail } from '@/lib/validation'

type Client = { id: string; name: string; email: string; company?: string; phone?: string; portalToken: string; projects: { id: string; status: string }[]; invoices: { id: string; amount: number; status: string }[] }
const empty = { name: '', email: '', company: '', phone: '' }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [formError, setFormError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = () => { setLoading(true); fetch('/api/clients').then(r => r.json()).then(setClients).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setEmailError(''); setFormError(''); setModal('add') }
  const openEdit = (c: Client) => { setForm({ name: c.name, email: c.email, company: c.company ?? '', phone: c.phone ?? '' }); setEditId(c.id); setEmailError(''); setFormError(''); setModal('edit') }

  const handleEmailChange = (value: string) => {
    setForm(f => ({ ...f, email: value }))
    if (value && !isValidEmail(value)) setEmailError('Email invalide (ex: nom@domaine.com)')
    else setEmailError('')
  }

  const save = async () => {
    setFormError('')
    if (!isValidEmail(form.email)) { setEmailError('Email invalide (ex: nom@domaine.com)'); return }
    setSaving(true)
    const res = modal === 'add'
      ? await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      : await fetch(`/api/clients/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setFormError(err.detail ?? err.error ?? 'Erreur lors de la sauvegarde')
      return
    }
    setModal(null); load()
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.detail ?? err.error ?? 'Échec de la suppression du client')
      return
    }
    load()
  }

  const copyPortalLink = async (client: Client) => {
    const url = `${window.location.origin}/portal/${client.portalToken}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(client.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      alert(url)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm">
          <Plus size={16} /><span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {/* Cards on mobile */}
      <div className="sm:hidden space-y-3">
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-20" />) :
        clients.map(c => {
          const totalCA = c.invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0)
          return (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0">
                    {c.company?.[0] ?? c.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{c.name}</div>
                    {c.company && <div className="text-xs text-gray-400">{c.company}</div>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => copyPortalLink(c)} title="Copier le lien du portail client" className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600">
                    {copiedId === c.id ? <CheckCheck size={14} className="text-emerald-500" /> : <Link2 size={14} />}
                  </button>
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil size={14} /></button>
                  <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <span className="truncate">{c.email}</span>
                <span className="font-semibold text-gray-800 ml-2 shrink-0">{totalCA.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table on sm+ */}
      <div className="hidden sm:block card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Client', 'Contact', 'Projets', 'CA Total', ''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
              </tr>
            )) : clients.map(c => {
              const totalCA = c.invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0)
              const activeProjects = c.projects.filter(p => p.status === 'ACTIVE').length
              return (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0">
                        {c.company?.[0] ?? c.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{c.name}</div>
                        {c.company && <div className="text-xs text-gray-400 flex items-center gap-1"><Building2 size={11} />{c.company}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-600"><Mail size={12} />{c.email}</div>
                      {c.phone && <div className="flex items-center gap-1.5 text-gray-400"><Phone size={12} />{c.phone}</div>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm">
                    <span className="font-semibold text-gray-800">{c.projects.length}</span>
                    <span className="text-gray-400 ml-1">({activeProjects} actif{activeProjects > 1 ? 's' : ''})</span>
                  </td>
                  <td className="px-5 py-4"><span className="font-semibold text-gray-800">{totalCA.toLocaleString('fr-FR')} €</span></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => copyPortalLink(c)} title="Copier le lien du portail client" className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 flex items-center gap-1">
                        {copiedId === c.id ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Pencil size={14} /></button>
                      <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && !clients.length && <div className="text-center py-10 text-gray-400">Aucun client.</div>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">{modal === 'add' ? 'Nouveau client' : 'Modifier'}</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
            </div>

            {formError && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3 py-2.5 mb-4">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Jean Dupont"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm ${emailError ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="jean@entreprise.fr"
                  value={form.email}
                  onChange={e => handleEmailChange(e.target.value)}
                  onBlur={e => handleEmailChange(e.target.value)}
                />
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Entreprise</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Acme SAS"
                  value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="+33 1 23 45 67 89"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Annuler</button>
              <button onClick={save} disabled={saving || !form.name || !isValidEmail(form.email)} className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
                <Check size={16} />{saving ? '…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
