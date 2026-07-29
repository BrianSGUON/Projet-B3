import { prisma } from '@/lib/prisma'

export const OTP_TTL_MINUTES = 10

export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createOtpCode(email: string, code: string) {
  const normalizedEmail = email.toLowerCase().trim()
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

  await prisma.otpCode.deleteMany({
    where: {
      email: normalizedEmail,
      verified: false,
    },
  })

  await prisma.otpCode.create({
    data: {
      email: normalizedEmail,
      code,
      expiresAt,
    },
  })

  return { normalizedEmail, expiresAt }
}

export async function findValidOtpCode(email: string, code: string) {
  const normalizedEmail = email.toLowerCase().trim()

  return prisma.otpCode.findFirst({
    where: {
      email: normalizedEmail,
      code,
      verified: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}
