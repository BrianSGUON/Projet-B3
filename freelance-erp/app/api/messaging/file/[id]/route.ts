import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!currentUser) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  const { id } = await params
  const attachment = await prisma.messageAttachment.findUnique({
    where: { id },
    include: { message: { include: { conversation: true } } },
  })
  if (!attachment) {
    return NextResponse.json({ error: 'Pièce jointe introuvable' }, { status: 404 })
  }

  const isParticipant = attachment.message.conversation.userAId === currentUser.id || attachment.message.conversation.userBId === currentUser.id
  if (!isParticipant) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
  }

  const absolutePath = path.join(moduleDir, '..', '..', '..', '..', '..', attachment.filePath.replace(/^\/+/, ''))
  const bytes = await readFile(absolutePath)

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `inline; filename="${attachment.fileName}"`,
    },
  })
}
