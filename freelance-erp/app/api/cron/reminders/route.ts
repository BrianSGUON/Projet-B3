import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Seuils de relance, en jours de retard depuis la date d'échéance
const REMINDER_THRESHOLDS = [
  { level: 1, afterDays: 1 },   // rappel poli dès le 1er jour de retard
  { level: 2, afterDays: 15 },  // relance plus ferme après 15 jours
  { level: 3, afterDays: 30 },  // mise en demeure après 30 jours
]

function daysBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / 86400000)
}

// Point d'extension : remplacer par un vrai envoi d'email (Resend, SendGrid, etc.)
async function sendReminderEmail(params: { to: string; clientName: string; invoiceNumber: string; amount: number; level: number; daysOverdue: number }) {
  const messages: Record<number, string> = {
    1: `Bonjour ${params.clientName}, nous vous rappelons que la facture ${params.invoiceNumber} d'un montant de ${params.amount.toLocaleString('fr-FR')} € est en attente de paiement.`,
    2: `Bonjour ${params.clientName}, la facture ${params.invoiceNumber} est en retard de paiement depuis ${params.daysOverdue} jours. Merci de procéder au règlement dans les plus brefs délais.`,
    3: `Bonjour ${params.clientName}, malgré nos relances précédentes, la facture ${params.invoiceNumber} reste impayée depuis ${params.daysOverdue} jours. Sans règlement rapide, nous serons contraints d'engager une procédure de recouvrement.`,
  }
  console.log(`[RELANCE niveau ${params.level}] → ${params.to}: ${messages[params.level]}`)
  // TODO: brancher un vrai fournisseur d'email ici (ex: Resend, SendGrid)
  return true
}

export async function GET(req: NextRequest) {
  // Sécurise l'endpoint pour n'être appelé que par Vercel Cron
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Toutes les factures envoyées (non payées) dont l'échéance est passée
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { lt: now },
      },
      include: { client: true, reminders: true },
    })

    const results: { invoiceNumber: string; level: number; sent: boolean }[] = []

    for (const invoice of overdueInvoices) {
      const daysOverdue = daysBetween(now, invoice.dueDate)

      // Marque la facture comme en retard si elle ne l'est pas déjà
      if (invoice.status !== 'OVERDUE') {
        await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'OVERDUE' } })
      }

      // Détermine le niveau de relance le plus élevé déjà atteint
      const highestLevelSent = invoice.reminders.reduce((max: number, r: { level: number }) => Math.max(max, r.level), 0)

      // Cherche le prochain seuil applicable
      const nextThreshold = REMINDER_THRESHOLDS
        .filter(t => daysOverdue >= t.afterDays && t.level > highestLevelSent)
        .sort((a, b) => b.level - a.level)[0]

      if (nextThreshold) {
        await sendReminderEmail({
          to: invoice.client.email,
          clientName: invoice.client.company ?? invoice.client.name,
          invoiceNumber: invoice.number,
          amount: invoice.amount * (1 + invoice.tax / 100),
          level: nextThreshold.level,
          daysOverdue,
        })

        await prisma.reminder.create({
          data: {
            invoiceId: invoice.id,
            level: nextThreshold.level,
            daysOverdue,
          },
        })

        results.push({ invoiceNumber: invoice.number, level: nextThreshold.level, sent: true })
      }
    }

    return NextResponse.json({ checked: overdueInvoices.length, remindersSent: results.length, results })
  } catch (error) {
    console.error('[GET /api/cron/reminders]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec du traitement des relances', detail }, { status: 500 })
  }
}
