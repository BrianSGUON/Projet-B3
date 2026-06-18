import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function daysBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / 86400000)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await prisma.invoice.findUnique({ where: { id }, include: { client: true, reminders: true } })

    if (!invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    const now = new Date()
    const daysOverdue = Math.max(0, daysBetween(now, invoice.dueDate))
    const highestLevelSent = invoice.reminders.reduce((max: number, r: { level: number }) => Math.max(max, r.level), 0)
    const nextLevel = Math.min(highestLevelSent + 1, 3)

    console.log(`[RELANCE MANUELLE niveau ${nextLevel}] → ${invoice.client.email} pour ${invoice.number}`)
    // TODO: brancher un vrai fournisseur d'email ici (ex: Resend, SendGrid)

    const reminder = await prisma.reminder.create({
      data: { invoiceId: invoice.id, level: nextLevel, daysOverdue },
    })

    if (invoice.status === 'SENT' && daysOverdue > 0) {
      await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'OVERDUE' } })
    }

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('[POST /api/invoices/[id]/remind]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de l\'envoi de la relance', detail }, { status: 500 })
  }
}
