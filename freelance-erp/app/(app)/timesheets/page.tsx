'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Check, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

type Timesheet = { id: string; date: string; hours: number; description?: string; project: { id: string; name: string; client: { name: string; company?: string } }; consultant: { id: string; name: string; role: string } }
type Project = { id: string; name: string; client: { name: string; company?: string } }
type Consultant = { id: string; name: string; role: string }
const empty = { date: new Date().toISOString().split('T')[0], hours: '7', description: '', projectId: '', consultantId: '' }

export default function TimesheetsPage() {
  const [entries, setEntries] = useState<Timesheet[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStr = format(currentMonth, 'yyyy-MM')

  const load = () => {
    setLoading(true)
    Promise.all([fetch(`/api/timesheets?month=${monthStr}`).then(r => r.json()), fetch('/api/projects').then(r => r.json()), fetch('/api/consultants').then(r => r.json())])
      .then(([t, p, c]) => { setEntries(Array.isArray(t) ? t : []); setProjects(Array.isArray(p) ? p : []); setConsultants(Array.isArray(c) ? c : []) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [monthStr])

  const save = async () => {
    setSaving(true)
    await fetch('/api/timesheets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setModal(false); load()
  }
  const remove = async (id: string) => { await fetch(`/api/timesheets/${id}`, { method: 'DELETE' }); load() }

  const byConsultant: Record<string, Timesheet[]> = {}
  entries.forEach(e => { if (!byConsultant[e.consultant.id]) byConsultant[e.consultant.id] = []; byConsultant[e.consultant.id].push(e) })
  const totalHours = entries.reduce((s, e) => s + e.hours, 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Timesheets</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{totalHours}h enregistrées ce mois</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 card px-3 py-2">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="hover:text-violet-600 p-0.5"><ChevronLeft size={16} /></button>
            <span className="text-xs sm:text-sm font-semibold w-[100px] sm:w-[120px] text-center capitalize">{format(currentMonth, 'MMM yyyy', { locale: fr })}</span>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="hover:text-violet-600 p-0.5"><ChevronRight size={16} /></button>
          </div>
          <button onClick={() => { setForm(empty); setModal(true) }} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-xl font-medium text-sm">
            <Plus size={16} /><span className="hidden sm:inline">Saisir heures</span>
          </button>
        </div>
      </div>

      {/* Summary cards — scrollable row on mobile */}
      <div className="flex gap-3 mb-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {consultants.map(c => {
          const hours = (byConsultant[c.id] || []).reduce((s, e) => s + e.hours, 0)
          return (
            <div key={c.id} className="card p-4 shrink-0 w-36 sm:w-auto">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{c.name[0]}</div>
                <div className="text-sm font-medium text-gray-700 truncate">{c.name.split(' ')[0]}</div>
              </div>
              <div className="text-lg font-bold text-gray-900">{hours}h</div>
              <div className="text-xs text-gray-400">{Math.round(hours / 7 * 10) / 10}j</div>
            </div>
          )
        })}
      </div>

      {/* Entries — cards on mobile, table on desktop */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock size={16} className="text-violet-500" />
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Saisies du mois</h2>
          <span className="text-xs text-gray-400">({entries.length})</span>
        </div>

        {loading ? <div className="p-8 text-center text-gray-400 animate-pulse text-sm">Chargement…</div> :
        entries.length === 0 ? <div className="p-8 text-center text-gray-400 text-sm">Aucune saisie ce mois.</div> : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {entries.map(e => (
                <div key={e.id} className="flex items-center justify-between px-4 py-3 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{e.consultant.name[0]}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{e.project.name}</div>
                      <div className="text-xs text-gray-400">{format(new Date(e.date), 'dd MMM', { locale: fr })} · {e.consultant.name.split(' ')[0]}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-sm">{e.hours}h</span>
                    <button onClick={() => remove(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <table className="hidden sm:table w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Date', 'Consultant', 'Projet', 'Client', 'Description', 'Heures', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50 group">
                    <td className="px-5 py-3 text-sm text-gray-600">{format(new Date(e.date), 'dd MMM', { locale: fr })}</td>
                    <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{e.consultant.name[0]}</div><span className="text-sm font-medium text-gray-800">{e.consultant.name.split(' ')[0]}</span></div></td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-700">{e.project.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{e.project.client.company ?? e.project.client.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-400 max-w-[160px] truncate">{e.description ?? '—'}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{e.hours}h</td>
                    <td className="px-5 py-3"><button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-opacity"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-gray-50"><td colSpan={5} className="px-5 py-3 text-sm font-semibold text-gray-700">Total</td><td className="px-5 py-3 font-bold">{totalHours}h</td><td /></tr></tfoot>
            </table>
          </>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Saisir des heures</h2>
              <button onClick={() => setModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label><input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Heures *</label><input type="number" min="0.5" max="24" step="0.5" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Consultant *</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={form.consultantId} onChange={e => setForm(f => ({ ...f, consultantId: e.target.value }))}>
                  <option value="">Sélectionner…</option>{consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Projet *</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white" value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
                  <option value="">Sélectionner…</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Ex: Intégration page d'accueil" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Annuler</button>
              <button onClick={save} disabled={saving || !form.date || !form.hours || !form.consultantId || !form.projectId} className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
                <Check size={16} />{saving ? '…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
