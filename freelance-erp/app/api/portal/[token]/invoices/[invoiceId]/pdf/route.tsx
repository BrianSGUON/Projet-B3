import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import InvoicePdf from '@/lib/InvoicePdf'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; invoiceId: string }> }
) {
  try {
    const { token, invoiceId } = await params

    const client = await prisma.client.findUnique({ where: { portalToken: token } })
    if (!client) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, project: true, items: true },
    })

    // S'assure que la facture appartient bien au client du token
    if (!invoice || invoice.clientId !== client.id) {
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
    console.error('[GET /api/portal/[token]/invoices/[invoiceId]/pdf]', error)
    return NextResponse.json({ error: 'Échec de la génération du PDF' }, { status: 500 })
  }
}
