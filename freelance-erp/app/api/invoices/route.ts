import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        project: true,
        items: true,
        reminders: { orderBy: { sentAt: 'desc' } },
      },
      orderBy: { issuedDate: 'desc' },
    })
    return NextResponse.json(invoices)
  } catch (error) {
    console.error('[GET /api/invoices]', error)
    return NextResponse.json({ error: 'Échec de la récupération des factures' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    if (!body.clientId) return NextResponse.json({ error: 'Le client est requis' }, { status: 400 })
    if (!body.items?.length) return NextResponse.json({ error: 'Au moins une ligne de facturation est requise' }, { status: 400 })
    if (!body.dueDate) return NextResponse.json({ error: 'La date d\'échéance est requise' }, { status: 400 })

    // Auto-generate invoice number
    const count = await prisma.invoice.count()
    const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

    const items = body.items as { description: string; quantity: number; unitPrice: number }[]
    const amount = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0)

    // Only set projectId if it's a non-empty string
    const projectId = body.projectId && body.projectId !== '' ? body.projectId : null

    const invoice = await prisma.invoice.create({
      data: {
        number,
        status: 'DRAFT',
        amount,
        tax: parseFloat(body.tax ?? '20') || 20,
        dueDate: new Date(body.dueDate),
        issuedDate: new Date(body.issuedDate ?? new Date()),
        notes: body.notes || null,
        clientId: body.clientId,
        projectId,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        },
      },
      include: { client: true, project: true, items: true },
    })
    return NextResponse.json(invoice)
  } catch (error) {
    console.error('[POST /api/invoices]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la création de la facture', detail }, { status: 500 })
  }
}
