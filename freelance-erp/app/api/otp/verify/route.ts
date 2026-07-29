import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findValidOtpCode } from '@/lib/otp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const code = typeof body?.code === 'string' ? body.code.trim() : ''

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email et code requis' },
        { status: 400 },
      )
    }

    const otpRecord = await findValidOtpCode(email, code)
    if (!otpRecord) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 401 })
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ error: 'Code expiré' }, { status: 401 })
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Code vérifié',
    })
  } catch (error) {
    console.error('Erreur lors de la vérification du code OTP:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    )
  }
}
