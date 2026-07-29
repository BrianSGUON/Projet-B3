'use client'
import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, AlertCircle, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Impossible d’envoyer le code')
      return
    }

    setOtpStep(true)
    setOtpError('')
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError('')
    setOtpLoading(true)

    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: otpCode }),
    })

    const data = await res.json()
    setOtpLoading(false)

    if (!res.ok) {
      setOtpError(data.error || 'Code invalide')
      return
    }

    const authRes = await signIn('credentials', { email, password, redirect: false })
    if (authRes?.error) {
      setOtpError('La vérification a réussi, mais la connexion a échoué')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  const resendOtp = async () => {
    setOtpError('')
    setLoading(true)

    const res = await fetch('/api/otp/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setOtpError(data.error || 'Impossible de renvoyer le code')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <Briefcase size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900">FreelanceOS</span>
        </Link>

        <div className="card p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Connexion</h1>
          <p className="text-sm text-gray-500 mb-6">Heureux de vous revoir.</p>

          {(error || otpError) && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3 py-2.5 mb-5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error || otpError}</span>
            </div>
          )}

          {otpStep ? (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Code de vérification</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm tracking-[0.35em] text-center"
                  placeholder="123456"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Un code à 6 chiffres a été envoyé à {email}.
                </p>
              </div>
              <button
                type="submit"
                disabled={otpLoading || otpCode.length !== 6}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                {otpLoading ? 'Vérification…' : 'Vérifier le code'}
              </button>
              <button
                type="button"
                onClick={resendOtp}
                disabled={loading}
                className="w-full text-sm text-violet-600 font-medium hover:underline disabled:opacity-60"
              >
                {loading ? 'Envoi…' : 'Renvoyer le code'}
              </button>
            </form>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                  placeholder="vous@agence.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          )}

          <p className="text-sm text-gray-500 text-center mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-violet-600 font-medium hover:underline">S&apos;inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
