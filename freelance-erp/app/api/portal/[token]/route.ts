import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const client = await prisma.client.findUnique({
      where: { portalToken: token },
      include: {
        projects: {
          include: {
            consultants: { include: { consultant: true } },
            timesheets: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          include: { items: true },
          orderBy: { issuedDate: 'desc' },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
    }

    // On ne renvoie jamais d'informations internes sensibles (TJM des consultants, etc.)
    type ProjectWithRelations = {
      id: string; name: string; description: string | null; status: string
      startDate: Date; endDate: Date | null
      timesheets: { hours: number }[]
      consultants: { consultant: { name: string; role: string } }[]
    }
    type InvoiceWithItems = {
      id: string; number: string; status: string; amount: number; tax: number
      dueDate: Date; issuedDate: Date
      items: { description: string; quantity: number; unitPrice: number }[]
    }

    const safeData = {
      client: {
        name: client.name,
        company: client.company,
        email: client.email,
      },
      projects: (client.projects as ProjectWithRelations[]).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        totalHours: p.timesheets.reduce((s: number, t: { hours: number }) => s + t.hours, 0),
        team: p.consultants.map((pc) => ({ name: pc.consultant.name, role: pc.consultant.role })),
      })),
      invoices: (client.invoices as InvoiceWithItems[]).map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        amount: inv.amount,
        tax: inv.tax,
        dueDate: inv.dueDate,
        issuedDate: inv.issuedDate,
        items: inv.items,
      })),
    }

    return NextResponse.json(safeData)
  } catch (error) {
    console.error('[GET /api/portal/[token]]', error)
    return NextResponse.json({ error: 'Échec du chargement du portail' }, { status: 500 })
  }
}
