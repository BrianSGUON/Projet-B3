import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const moduleDir = path.dirname(fileURLToPath(import.meta.url))
const PRIVATE_UPLOAD_DIR = path.join(moduleDir, '..', '..', '..', 'private', 'uploads', 'messages')

const DEFAULT_PAGE_SIZE = 25

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!currentUser) return NextResponse.json([], { status: 200 })

  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE)
  const conversationId = searchParams.get('conversationId')

  if (searchParams.get('type') === 'contacts') {
    const users = await prisma.user.findMany({
      where: { id: { not: currentUser.id } },
      select: { id: true, name: true, email: true, company: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(users)
  }

  if (conversationId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ userAId: currentUser.id }, { userBId: currentUser.id }],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true } }, attachments: true },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
    }

    const startIndex = Math.max(0, conversation.messages.length - (page * pageSize))
    const pagedMessages = conversation.messages.slice(startIndex, conversation.messages.length - ((page - 1) * pageSize))
    const hasMore = startIndex > 0

    return NextResponse.json({
      messages: pagedMessages,
      page,
      pageSize,
      hasMore,
    })
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userAId: currentUser.id }, { userBId: currentUser.id }],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true } }, attachments: true },
      },
      userA: { select: { id: true, name: true, email: true, company: true } },
      userB: { select: { id: true, name: true, email: true, company: true } },
    },
  })

  const payload = conversations.map((conversation) => ({
    id: conversation.id,
    userAId: conversation.userAId,
    userBId: conversation.userBId,
    messages: conversation.messages.slice(-pageSize),
    otherUser: conversation.userAId === currentUser.id ? conversation.userB : conversation.userA,
  }))

  return NextResponse.json({
    conversations: payload,
    page,
    pageSize,
    hasMore: payload.length > pageSize,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!currentUser) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  const formData = await req.formData()
  const conversationId = formData.get('conversationId')?.toString()
  const recipientId = formData.get('recipientId')?.toString()
  const content = formData.get('content')?.toString() ?? ''
  const files = formData.getAll('files') as File[]

  let conversation: Awaited<ReturnType<typeof prisma.conversation.findFirst>> | null = null
  let otherUser: { id: string; name: string; email: string; company: string | null } | null = null

  if (conversationId) {
    conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { userA: true, userB: true },
    })
  } else if (recipientId) {
    if (recipientId === currentUser.id) {
      return NextResponse.json({ error: 'Sélectionnez un autre utilisateur' }, { status: 400 })
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } })
    if (!recipient) {
      return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 })
    }

    conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: currentUser.id, userBId: recipientId },
          { userAId: recipientId, userBId: currentUser.id },
        ],
      },
      include: { userA: true, userB: true },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userAId: currentUser.id,
          userBId: recipientId,
        },
        include: { userA: true, userB: true },
      })
    }
  } else {
    return NextResponse.json({ error: 'Conversation ou destinataire manquant' }, { status: 400 })
  }

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
  }

  otherUser = conversation.userAId === currentUser.id
    ? await prisma.user.findUnique({
        where: { id: conversation.userBId },
        select: { id: true, name: true, email: true, company: true },
      })
    : await prisma.user.findUnique({
        where: { id: conversation.userAId },
        select: { id: true, name: true, email: true, company: true },
      })

  if (conversation.userAId !== currentUser.id && conversation.userBId !== currentUser.id) {
    return NextResponse.json({ error: 'Pas autorisé' }, { status: 403 })
  }

  if (!content.trim() && !files.length) {
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        userAId: conversation.userAId,
        userBId: conversation.userBId,
        messages: [],
        otherUser,
      },
    })
  }

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderId: { not: currentUser.id },
      isRead: false,
    },
    data: { isRead: true },
  })

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: currentUser.id,
      content: content.trim() || null,
    },
    include: {
      sender: { select: { id: true, name: true } },
      attachments: true,
    },
  })

  if (files.length) {
    await mkdir(PRIVATE_UPLOAD_DIR, { recursive: true })

    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const uniqueName = `${Date.now()}-${randomUUID()}-${safeName}`
      const filePath = path.join(PRIVATE_UPLOAD_DIR, uniqueName)
      const bytes = Buffer.from(await file.arrayBuffer())
      await writeFile(filePath, bytes)

      await prisma.messageAttachment.create({
        data: {
          messageId: message.id,
          fileName: file.name,
          filePath: `/private/uploads/messages/${uniqueName}`,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        },
      })
    }

    const refreshedMessage = await prisma.message.findUnique({
      where: { id: message.id },
      include: {
        sender: { select: { id: true, name: true } },
        attachments: true,
      },
    })

    return NextResponse.json(refreshedMessage)
  }

  return NextResponse.json(message)
}
