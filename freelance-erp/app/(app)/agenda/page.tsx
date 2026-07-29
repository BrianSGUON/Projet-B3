'use client'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'

type Timesheet = {
  id: string
  date: string
  hours: number
  description?: string
  project: { id: string; name: string; client: { id: string; name: string; company?: string } }
  consultant: { id: string; name: string; role: string }
}
type Client = { id: string; name: string; company?: string }

const CLIENT_COLORS = [
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-lime-100 text-lime-700 border-lime-200',
]
function colorForClient(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return CLIENT_COLORS[hash % CLIENT_COLORS.length]
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function AgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [entries, setEntries] = useState<Timesheet[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const monthStr = format(currentMonth, 'yyyy-MM')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(c => setClients(Array.isArray(c) ? c : []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ month: monthStr })
    if (clientId) params.set('clientId', clientId)
    fetch(`/api/timesheets?${params}`)
      .then(r => r.json())
      .then(t => setEntries(Array.isArray(t) ? t : []))
      .finally(() => setLoading(false))
  }, [monthStr, clientId])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const byDay: Record<string, Timesheet[]> = {}
  entries.forEach(e => {
    const key = e.date.split('T')[0]
    if (!byDay[key]) byDay[key] = []
    byDay[key].push(e)
  })

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)
  const selectedEntries = selectedDay ? (byDay[selectedDay] || []) : []
  const selectedClientLabel = clients.find(c => c.id === clientId)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {totalHours}h ce mois{selectedClientLabel ? ` pour ${selectedClientLabel.company ?? selectedClientLabel.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
            value={clientId}
            onChange={e => { setClientId(e.target.value); setSelectedDay(null) }}
          >
            <option value="">Tous les clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company ?? c.name}</option>)}
          </select>
          <div className="flex items-center gap-1 card px-3 py-2">
            <button onClick={() => { setCurrentMonth(m => subMonths(m, 1)); setSelectedDay(null) }} className="hover:text-violet-600 p-0.5"><ChevronLeft size={16} /></button>
            <span className="text-xs sm:text-sm font-semibold w-[110px] sm:w-[130px] text-center capitalize">{format(currentMonth, 'MMMM yyyy', { locale: fr })}</span>
            <button onClick={() => { setCurrentMonth(m => addMonths(m, 1)); setSelectedDay(null) }} className="hover:text-violet-600 p-0.5"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide py-2.5">{d}</div>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400 animate-pulse text-sm">Chargement…</div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map(day => {
                const key = format(day, 'yyyy-MM-dd')
                const dayEntries = byDay[key] || []
                const dayHours = dayEntries.reduce((s, e) => s + e.hours, 0)
                const inMonth = isSameMonth(day, currentMonth)
                const selected = selectedDay === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(selected ? null : key)}
                    className={`min-h-[90px] sm:min-h-[110px] border-b border-r border-gray-50 p-1.5 sm:p-2 text-left flex flex-col gap-1 transition-colors ${inMonth ? 'bg-white' : 'bg-gray-50/50'} ${selected ? 'ring-2 ring-inset ring-violet-500' : 'hover:bg-violet-50/40'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${isToday(day) ? 'bg-violet-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : inMonth ? 'text-gray-600' : 'text-gray-300'}`}>
                        {format(day, 'd')}
                      </span>
                      {dayHours > 0 && <span className="text-[10px] font-bold text-violet-600">{dayHours}h</span>}
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {dayEntries.slice(0, 2).map(e => (
                        <div key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded-md border truncate ${colorForClient(e.project.client.id)}`}>
                          {e.project.client.company ?? e.project.client.name}
                        </div>
                      ))}
                      {dayEntries.length > 2 && (
                        <div className="text-[10px] text-gray-400 px-1.5">+{dayEntries.length - 2} autre{dayEntries.length - 2 > 1 ? 's' : ''}</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="card p-4 sm:p-5 h-fit xl:sticky xl:top-4">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={16} className="text-violet-500" />
            <h2 className="font-semibold text-gray-900 text-sm capitalize">
              {selectedDay ? format(new Date(selectedDay), 'EEEE d MMMM', { locale: fr }) : 'Sélectionnez un jour'}
            </h2>
          </div>

          {!selectedDay ? (
            <p className="text-sm text-gray-400">Cliquez sur une date du calendrier pour voir le détail des heures saisies ce jour-là.</p>
          ) : selectedEntries.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune heure saisie ce jour-là.</p>
          ) : (
            <div className="space-y-3">
              {selectedEntries.map(e => (
                <div key={e.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">{e.project.client.company ?? e.project.client.name}</span>
                    <span className="text-sm font-bold text-violet-600">{e.hours}h</span>
                  </div>
                  <div className="text-xs text-gray-500">{e.project.name} · {e.consultant.name}</div>
                  {e.description && <div className="text-xs text-gray-400 mt-1">{e.description}</div>}
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-sm font-semibold text-gray-700">
                <span>Total</span>
                <span>{selectedEntries.reduce((s, e) => s + e.hours, 0)}h</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
