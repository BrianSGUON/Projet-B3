import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidEmail } from '@/lib/validation'

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: { projects: true, invoices: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(clients)
  } catch (error) {
    console.error('[GET /api/clients]', error)
    return NextResponse.json({ error: 'Échec de la récupération des clients' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const client = await prisma.client.create({
      data: { name: body.name, email: body.email, company: body.company, phone: body.phone },
    })
    return NextResponse.json(client)
  } catch (error) {
    console.error('[POST /api/clients]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la création du client', detail }, { status: 500 })
  }
}
