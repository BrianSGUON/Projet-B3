'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { LayoutDashboard, Users, Briefcase, Clock, FileText, Building2, Menu, X, LogOut, ChevronDown, Calculator } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/consultants', label: 'Consultants', icon: Users },
  { href: '/clients', label: 'Clients', icon: Building2 },
  { href: '/projects', label: 'Projets', icon: Briefcase },
  { href: '/timesheets', label: 'Timesheets', icon: Clock },
  { href: '/invoices', label: 'Factures', icon: FileText },
  { href: '/rentabilite', label: 'Rentabilité', icon: Calculator },
]

function AccountBadge({ compact = false }: { compact?: boolean }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const name = session?.user?.name ?? 'Mon compte'
  const company = session?.user?.company
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 w-full text-left group"
      >
        <div className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center font-bold text-sm shrink-0">
          {initials || 'F'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm tracking-wide truncate">{name}</div>
          <div className="text-xs text-slate-400 truncate">{company || 'Mon agence'}</div>
        </div>
        {!compact && <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-10">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Close on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const NavContent = () => (
    <>
      <div className="px-4 py-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <AccountBadge />
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-800 text-slate-400 shrink-0"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-6 py-5 border-t border-slate-700">
        <div className="text-xs text-slate-500">FreelanceOS · v1.0.0</div>
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-slate-900 text-white flex-col shrink-0">
        <NavContent />
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex-1 min-w-0 mr-2">
          <AccountBadge compact />
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 shrink-0"
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Drawer panel */}
          <aside
            className="relative z-10 w-72 max-w-[85vw] bg-slate-900 text-white flex flex-col h-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
