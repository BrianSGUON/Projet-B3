import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: true,
        consultants: { include: { consultant: true } },
        timesheets: { include: { consultant: true } },
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error('[GET /api/projects]', error)
    return NextResponse.json({ error: 'Échec de la récupération des projets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        status: body.status || 'ACTIVE',
        type: body.type || 'HOURLY',
        budget: body.budget ? parseFloat(body.budget) : null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        clientId: body.clientId,
      },
      include: { client: true },
    })
    return NextResponse.json(project)
  } catch (error) {
    console.error('[POST /api/projects]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la création du projet', detail }, { status: 500 })
  }
}
