'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Briefcase, Menu, X } from 'lucide-react'

export default function LandingNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
            <Briefcase size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">FreelanceOS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#fonctionnalites" className="hover:text-gray-900">Fonctionnalités</a>
          <a href="#tarifs" className="hover:text-gray-900">Tarifs</a>
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">
            Se connecter
          </Link>
          <Link href="/register" className="text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl transition-colors">
            S&apos;inscrire
          </Link>
        </div>

        <button onClick={() => setOpen(o => !o)} className="sm:hidden p-2 text-gray-600">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="sm:hidden border-t border-gray-100 px-4 py-4 space-y-3 bg-white">
          <a href="#fonctionnalites" onClick={() => setOpen(false)} className="block text-sm font-medium text-gray-600">Fonctionnalités</a>
          <a href="#tarifs" onClick={() => setOpen(false)} className="block text-sm font-medium text-gray-600">Tarifs</a>
          <Link href="/login" className="block text-sm font-medium text-gray-600 py-2">Se connecter</Link>
          <Link href="/register" className="block text-center text-sm font-medium bg-violet-600 text-white px-4 py-2.5 rounded-xl">S&apos;inscrire</Link>
        </div>
      )}
    </header>
  )
}
