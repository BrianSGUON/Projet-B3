import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import InvoicePdf from '@/lib/InvoicePdf'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true, project: true, items: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
    }

    const pdfBuffer = await renderToBuffer(
      <InvoicePdf
        data={{
          number: invoice.number,
          status: invoice.status,
          issuedDate: invoice.issuedDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          tax: invoice.tax,
          amount: invoice.amount,
          notes: invoice.notes,
          client: {
            name: invoice.client.name,
            company: invoice.client.company,
            email: invoice.client.email,
            phone: invoice.client.phone,
          },
          project: invoice.project ? { name: invoice.project.name } : null,
          items: invoice.items.map((i: { description: string; quantity: number; unitPrice: number }) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          issuer: {
            name: session.user.name ?? 'FreelanceOS',
            company: session.user.company ?? null,
            email: session.user.email ?? '',
          },
        }}
      />
    )

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/invoices/[id]/pdf]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la génération du PDF', detail }, { status: 500 })
  }
}
