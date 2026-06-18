'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, AlertCircle } from 'lucide-react'
import { isValidEmail } from '@/lib/validation'

const ROLES = ['Dev', 'Design', 'Marketing', 'DevOps', 'Data', 'Management', 'Autre']
const ROLE_COLORS: Record<string, string> = {
  Dev: 'bg-violet-100 text-violet-700', Design: 'bg-pink-100 text-pink-700',
  Marketing: 'bg-orange-100 text-orange-700', DevOps: 'bg-cyan-100 text-cyan-700',
  Data: 'bg-blue-100 text-blue-700', Management: 'bg-emerald-100 text-emerald-700',
  Autre: 'bg-gray-100 text-gray-700',
}

type Consultant = { id: string; name: string; email: string; role: string; skills: string; dailyRate: number; timesheets: { hours: number }[] }
const empty = { name: '', email: '', role: 'Dev', skills: '', dailyRate: 500 }

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<null | 'add' | 'edit'>(null)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [formError, setFormError] = useState('')

  const load = () => { setLoading(true); fetch('/api/consultants').then(r => r.json()).then(setConsultants).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setEmailError(''); setFormError(''); setModal('add') }
  const openEdit = (c: Consultant) => {
    setForm({ name: c.name, email: c.email, role: c.role, skills: JSON.parse(c.skills || '[]').join(', '), dailyRate: c.dailyRate })
    setEditId(c.id); setEmailError(''); setFormError(''); setModal('edit')
  }

  const handleEmailChange = (value: string) => {
    setForm(f => ({ ...f, email: value }))
    if (value && !isValidEmail(value)) setEmailError('Email invalide (ex: nom@domaine.com)')
    else setEmailError('')
  }

  const save = async () => {
    setFormError('')
    if (!isValidEmail(form.email)) { setEmailError('Email invalide (ex: nom@domaine.com)'); return }
    setSaving(true)
    const body = { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean), dailyRate: Number(form.dailyRate) }
    const res = modal === 'add'
      ? await fetch('/api/consultants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch(`/api/consultants/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setFormError(err.detail ?? err.error ?? 'Erreur lors de la sauvegarde')
      return
    }
    setModal(null); load()
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce consultant ?')) return
    const res = await fetch(`/api/consultants/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.detail ?? err.error ?? 'Échec de la suppression du consultant')
      return
    }
    load()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Consultants</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{consultants.length} consultant{consultants.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm">
          <Plus size={16} /> <span className="hidden sm:inline">Ajouter</span><span className="sm:hidden">+</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5 animate-pulse"><div className="w-12 h-12 rounded-full bg-gray-200 mb-4" /><div className="h-4 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
        )) : consultants.map(c => {
          const skills: string[] = JSON.parse(c.skills || '[]')
          const totalHours = c.timesheets.reduce((s, t) => s + t.hours, 0)
          return (
            <div key={c.id} className="card p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{c.name}</div>
                    <div className="text-sm text-gray-400 truncate">{c.email}</div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Pencil size={14} /></button>
                  <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${ROLE_COLORS[c.role] ?? 'bg-gray-100 text-gray-600'}`}>{c.role}</span>
                <span className="text-xs text-gray-400">{c.dailyRate} €/j</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {skills.slice(0, 3).map(s => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{s}</span>)}
                {skills.length > 3 && <span className="text-xs text-gray-400">+{skills.length - 3}</span>}
              </div>
              <div className="pt-3 border-t border-gray-100 text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{totalHours}h</span> total loguées
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">{modal === 'add' ? 'Nouveau consultant' : 'Modifier'}</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
                <input type="text" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Alice Martin"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm ${emailError ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="alice@agency.com"
                  value={form.email}
                  onChange={e => handleEmailChange(e.target.value)}
                  onBlur={e => handleEmailChange(e.target.value)}
                />
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">TJM (€/jour)</label>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="500"
                  value={form.dailyRate} onChange={e => setForm(f => ({ ...f, dailyRate: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Compétences (séparées par virgule)</label>
                <input type="text" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="React, TypeScript"
                  value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Annuler</button>
              <button onClick={save} disabled={saving || !form.name || !isValidEmail(form.email)} className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
                <Check size={16} />{saving ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
