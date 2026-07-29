import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOTPEmail } from '@/lib/email'
import { createOtpCode, generateOtpCode } from '@/lib/otp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    const code = generateOtpCode()
    const emailResult = await sendOTPEmail(email, code)

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Impossible d’envoyer le code par email' },
        { status: 500 },
      )
    }

    await createOtpCode(email, code)

    return NextResponse.json({
      success: true,
      message: 'Nouveau code envoyé',
    })
  } catch (error) {
    console.error('Erreur lors du renvoi du code OTP:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    )
  }
}
