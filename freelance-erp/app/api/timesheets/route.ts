import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const consultantId = searchParams.get('consultantId')
    const projectId = searchParams.get('projectId')
    const month = searchParams.get('month') // YYYY-MM

    const where: Record<string, unknown> = {}
    if (consultantId) where.consultantId = consultantId
    if (projectId) where.projectId = projectId
    if (month) {
      const [year, m] = month.split('-').map(Number)
      where.date = {
        gte: new Date(year, m - 1, 1),
        lt: new Date(year, m, 1),
      }
    }

    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        consultant: true,
        project: { include: { client: true } },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(timesheets)
  } catch (error) {
    console.error('[GET /api/timesheets]', error)
    return NextResponse.json({ error: 'Échec de la récupération des saisies' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const timesheet = await prisma.timesheet.create({
      data: {
        date: new Date(body.date),
        hours: parseFloat(body.hours),
        description: body.description,
        projectId: body.projectId,
        consultantId: body.consultantId,
      },
      include: {
        consultant: true,
        project: { include: { client: true } },
      },
    })
    return NextResponse.json(timesheet)
  } catch (error) {
    console.error('[POST /api/timesheets]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la création de la saisie', detail }, { status: 500 })
  }
}
