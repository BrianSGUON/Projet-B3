'use client'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, addWeeks, subWeeks, startOfWeek, addDays, isToday, isSameMonth } from 'date-fns'
import { fr } from 'date-fns/locale'

type Timesheet = {
  id: string
  date: string
  hours: number
  description?: string
  projectId: string
  consultantId: string
  project: { id: string; name: string; client: { id: string; name: string; company?: string } }
  consultant: { id: string; name: string; role: string }
}
type Project = { id: string; name: string; client: { id: string; name: string; company?: string } }
type Consultant = { id: string; name: string; role: string; projects?: { project: { id: string } }[] }

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function WeekTimesheetGrid({ clientId }: { clientId: string }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [entries, setEntries] = useState<Timesheet[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [consultantId, setConsultantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [manualRows, setManualRows] = useState<string[]>([])
  const [addingRow, setAddingRow] = useState(false)
  const [pending, setPending] = useState<Record<string, boolean>>({})

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const weekEnd = addDays(weekStart, 7)

  useEffect(() => {
    fetch('/api/consultants').then(r => r.json()).then(c => {
      const list = Array.isArray(c) ? c : []
      setConsultants(list)
      setConsultantId(prev => prev || list[0]?.id || '')
    })
    fetch('/api/projects').then(r => r.json()).then(p => setProjects(Array.isArray(p) ? p : []))
  }, [])

  const load = () => {
    if (!consultantId) return
    setLoading(true)
    const params = new URLSearchParams({
      consultantId,
      start: format(weekStart, 'yyyy-MM-dd'),
      end: format(weekEnd, 'yyyy-MM-dd'),
    })
    if (clientId) params.set('clientId', clientId)
    fetch(`/api/timesheets?${params}`)
      .then(r => r.json())
      .then(t => setEntries(Array.isArray(t) ? t : []))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [consultantId, clientId, weekStart.getTime()])

  const consultantProjects = consultants.find(c => c.id === consultantId)?.projects?.map(p => p.project.id) || []
  const rowProjectIds = Array.from(new Set([
    ...consultantProjects,
    ...entries.map(e => e.projectId),
    ...manualRows,
  ]))
  const availableProjects = projects.filter(p => !clientId || p.client.id === clientId)
  const rows = rowProjectIds
    .map(id => availableProjects.find(p => p.id === id) || projects.find(p => p.id === id))
    .filter((p): p is Project => !!p && (!clientId || p.client.id === clientId))
    .sort((a, b) => a.name.localeCompare(b.name))

  const cellEntries = (projectId: string, day: Date) => {
    const key = format(day, 'yyyy-MM-dd')
    return entries.filter(e => e.projectId === projectId && e.date.split('T')[0] === key)
  }

  const saveCell = async (projectId: string, day: Date, value: string) => {
    const key = format(day, 'yyyy-MM-dd')
    const cellKey = `${projectId}-${key}`
    const hours = value === '' ? 0 : parseFloat(value)
    if (Number.isNaN(hours) || hours < 0) return

    const existing = cellEntries(projectId, day)
    setPending(p => ({ ...p, [cellKey]: true }))
    try {
      if (existing.length === 0) {
        if (hours === 0) return
        await fetch('/api/timesheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: key, hours, projectId, consultantId, description: '' }),
        })
      } else {
        const [first, ...rest] = existing
        await Promise.all(rest.map(e => fetch(`/api/timesheets/${e.id}`, { method: 'DELETE' })))
        if (hours === 0) {
          await fetch(`/api/timesheets/${first.id}`, { method: 'DELETE' })
        } else {
          await fetch(`/api/timesheets/${first.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hours }),
          })
        }
      }
      load()
    } finally {
      setPending(p => { const n = { ...p }; delete n[cellKey]; return n })
    }
  }

  const rowTotal = (projectId: string) => entries.filter(e => e.projectId === projectId).reduce((s, e) => s + e.hours, 0)
  const dayTotal = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd')
    return entries.filter(e => e.date.split('T')[0] === key).reduce((s, e) => s + e.hours, 0)
  }
  const weekTotal = entries.reduce((s, e) => s + e.hours, 0)

  const addableProjects = availableProjects.filter(p => !rowProjectIds.includes(p.id))

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-gray-100 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
            value={consultantId}
            onChange={e => setConsultantId(e.target.value)}
          >
            {consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span className="text-sm text-gray-400">{weekTotal}h cette semaine</span>
        </div>
        <div className="flex items-center gap-1 px-1">
          <button onClick={() => setWeekStart(w => subWeeks(w, 1))} className="hover:text-violet-600 p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={16} /></button>
          <span className="text-xs sm:text-sm font-semibold w-[170px] text-center capitalize">
            {format(weekStart, 'd MMM', { locale: fr })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: fr })}
          </span>
          <button onClick={() => setWeekStart(w => addWeeks(w, 1))} className="hover:text-violet-600 p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[720px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 sticky left-0 bg-gray-50/60 min-w-[180px]">Projet</th>
              {days.map(day => (
                <th key={day.toISOString()} className={`text-center text-xs font-semibold uppercase tracking-wide px-2 py-2.5 min-w-[72px] ${isToday(day) ? 'text-violet-600' : 'text-gray-400'} ${!isSameMonth(day, weekStart) ? 'opacity-60' : ''}`}>
                  <div>{WEEKDAYS[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
                  <div className={`text-[11px] font-normal ${isToday(day) ? 'text-violet-500' : 'text-gray-400'}`}>{format(day, 'd MMM', { locale: fr })}</div>
                </th>
              ))}
              <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2.5 min-w-[64px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center text-gray-400 text-sm py-8 animate-pulse">Chargement…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="text-center text-gray-400 text-sm py-8">Aucun projet. Ajoutez-en un ci-dessous.</td></tr>
            ) : rows.map(project => (
              <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50/40 group">
                <td className="px-4 py-2 sticky left-0 bg-white group-hover:bg-gray-50/40">
                  <div className="text-sm font-medium text-gray-800 truncate max-w-[220px]">{project.name}</div>
                  <div className="text-xs text-gray-400 truncate max-w-[220px]">{project.client.company ?? project.client.name}</div>
                </td>
                {days.map(day => {
                  const key = format(day, 'yyyy-MM-dd')
                  const cellKey = `${project.id}-${key}`
                  const hours = cellEntries(project.id, day).reduce((s, e) => s + e.hours, 0)
                  return (
                    <td key={cellKey} className="px-1.5 py-1.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        defaultValue={hours || ''}
                        key={`${cellKey}-${hours}`}
                        disabled={!!pending[cellKey]}
                        placeholder="–"
                        onBlur={e => { if (e.target.value !== String(hours || '')) saveCell(project.id, day, e.target.value) }}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                        className={`w-14 text-center border rounded-lg py-1.5 text-sm outline-none transition-colors ${hours > 0 ? 'border-violet-200 bg-violet-50 text-violet-700 font-semibold' : 'border-gray-200 text-gray-500'} focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-50`}
                      />
                    </td>
                  )
                })}
                <td className="px-3 py-2 text-center text-sm font-bold text-gray-800">{rowTotal(project.id) || '–'}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-100">
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50">Total</td>
                {days.map(day => (
                  <td key={day.toISOString()} className="px-2 py-2.5 text-center text-sm font-semibold text-gray-700">{dayTotal(day) || '–'}</td>
                ))}
                <td className="px-3 py-2.5 text-center text-sm font-bold text-violet-700">{weekTotal}h</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="px-4 sm:px-5 py-3 border-t border-gray-100">
        {addingRow ? (
          <select
            autoFocus
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
            defaultValue=""
            onChange={e => { if (e.target.value) setManualRows(r => [...r, e.target.value]); setAddingRow(false) }}
            onBlur={() => setAddingRow(false)}
          >
            <option value="" disabled>Choisir un projet…</option>
            {addableProjects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client.company ?? p.client.name}</option>)}
          </select>
        ) : (
          <button onClick={() => setAddingRow(true)} className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium">
            <Plus size={15} /> Ajouter un projet
          </button>
        )}
      </div>
    </div>
  )
}
