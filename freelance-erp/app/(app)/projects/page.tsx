'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Calendar, Users, Calculator } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE: { label: 'Actif', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  PAUSED: { label: 'En pause', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Terminé', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  CANCELLED: { label: 'Annulé', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
}

// Heures considérées dans une journée facturable standard
const HOURS_PER_DAY = 7

type Project = {
  id: string; name: string; description?: string; status: string; type: string; budget?: number
  startDate: string; endDate?: string
  client: { id: string; name: string; company?: string }
  consultants: { consultant: { id: string; name: string; role: string } }[]
  timesheets: { hours: number; consultant: { dailyRate: number } }[]
  invoices: { amount: number; status: string }[]
}
type Client = { id: string; name: string; company?: string }
const empty = { name: '', description: '', status: 'ACTIVE', type: 'HOURLY', budget: '', startDate: '', endDate: '', clientId: '' }

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('ALL')

  const load = () => {
    setLoading(true)
    Promise.all([fetch('/api/projects').then(r => r.json()), fetch('/api/clients').then(r => r.json())])
      .then(([p, c]) => { setProjects(p); setClients(c) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setModal('add') }
  const openEdit = (p: Project) => {
    setForm({ name: p.name, description: p.description ?? '', status: p.status, type: p.type, budget: p.budget?.toString() ?? '', startDate: p.startDate.split('T')[0], endDate: p.endDate?.split('T')[0] ?? '', clientId: p.client.id })
    setEditId(p.id); setModal('edit')
  }
  const save = async () => {
    setSaving(true)
    if (modal === 'add') await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    else await fetch(`/api/projects/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setModal(null); load()
  }
  const remove = async (id: string) => { if (!confirm('Supprimer ce projet ?')) return; await fetch(`/api/projects/${id}`, { method: 'DELETE' }); load() }

  const filtered = filter === 'ALL' ? projects : projects.filter(p => p.status === filter)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Projets</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{projects.length} projet{projects.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm">
          <Plus size={16} /><span className="hidden sm:inline">Nouveau projet</span><span className="sm:hidden">+</span>
        </button>
      </div>

      {/* Filter tabs — scrollable on mobile */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
        {['ALL', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${filter === s ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s === 'ALL' ? 'Tous' : STATUS_CONFIG[s]?.label}
            <span className="ml-1 opacity-60">{s === 'ALL' ? projects.length : projects.filter(p => p.status === s).length}</span>
          </button>
        ))}
      </div>

      {/* 1 col mobile, 2 desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-5 animate-pulse h-40" />) :
        filtered.map(p => {
          const totalHours = p.timesheets.reduce((s, t) => s + t.hours, 0)
          const invoicedAmount = p.invoices.reduce((s, i) => s + i.amount, 0)
          // Coût réel = pour chaque saisie, (heures / 7) * TJM du consultant concerné
          const cost = p.timesheets.reduce((s, t) => s + (t.hours / HOURS_PER_DAY) * (t.consultant?.dailyRate ?? 0), 0)
          const margin = invoicedAmount - cost
          const st = STATUS_CONFIG[p.status]
          return (
            <div key={p.id} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-3 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${st?.dot}`} />
                    <span className={`badge ${st?.color}`}>{st?.label}</span>
                    <span className="badge bg-gray-100 text-gray-600">{p.type === 'HOURLY' ? 'Régie' : 'Forfait'}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-1 truncate">{p.name}</h3>
                  {p.description && <p className="text-sm text-gray-400 mt-1 line-clamp-1">{p.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Pencil size={14} /></button>
                  <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                    {p.client.company?.[0] ?? p.client.name[0]}
                  </div>
                  <span className="truncate max-w-[120px]">{p.client.company ?? p.client.name}</span>
                </div>
                <div className="flex items-center gap-1"><Calendar size={13} />{format(new Date(p.startDate), 'dd MMM yy', { locale: fr })}</div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={13} className="text-gray-400" />
                <div className="flex -space-x-1.5">
                  {p.consultants.map(({ consultant: c }) => (
                    <div key={c.id} title={c.name} className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      {c.name[0]}
                    </div>
                  ))}
                  {!p.consultants.length && <span className="text-xs text-gray-400">—</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                <div><div className="text-xs text-gray-400">Heures</div><div className="font-semibold text-sm text-gray-800">{totalHours}h</div></div>
                <div><div className="text-xs text-gray-400">Facturé</div><div className="font-semibold text-sm text-gray-800">{invoicedAmount.toLocaleString('fr-FR')} €</div></div>
                {p.budget && <div><div className="text-xs text-gray-400">Budget</div><div className="font-semibold text-sm text-gray-800">{p.budget.toLocaleString('fr-FR')} €</div></div>}
              </div>
              {totalHours > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calculator size={13} /> Rentabilité estimée
                  </div>
                  <span className={`text-sm font-bold ${margin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {margin >= 0 ? '+' : ''}{margin.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {!loading && !filtered.length && <div className="text-center py-12 text-gray-400">Aucun projet dans cette catégorie.</div>}

      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">{modal === 'add' ? 'Nouveau projet' : 'Modifier le projet'}</h2>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du projet *</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Refonte Site Web" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                    <option value="">Sélectionner…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company ?? c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="HOURLY">Régie</option><option value="FIXED">Forfait</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget (€)</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="Optionnel" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Début *</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fin</label>
                  <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Annuler</button>
              <button onClick={save} disabled={saving || !form.name || !form.clientId || !form.startDate} className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
                <Check size={16} />{saving ? '…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
