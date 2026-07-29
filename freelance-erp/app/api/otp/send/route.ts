import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendOTPEmail } from '@/lib/email'
import { createOtpCode, generateOtpCode } from '@/lib/otp'

function isPrismaUnavailable(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes('Environment variable not found') ||
      error.message.includes('DATABASE_URL') ||
      error.message.includes('PrismaClientInitializationError'))
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 },
      )
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 },
      )
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
      message: 'Code envoyé par email',
    })
  } catch (error) {
    console.error('Erreur lors de l’envoi du code OTP:', error)

    if (isPrismaUnavailable(error)) {
      return NextResponse.json(
        {
          error:
            'La base de données n’est pas configurée. Vérifiez DATABASE_URL et la connexion Prisma.',
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 },
    )
  }
}
