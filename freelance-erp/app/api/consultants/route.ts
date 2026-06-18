import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidEmail } from '@/lib/validation'

export async function GET() {
  try {
    const consultants = await prisma.consultant.findMany({
      include: {
        timesheets: true,
        projects: { include: { project: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(consultants)
  } catch (error) {
    console.error('[GET /api/consultants]', error)
    return NextResponse.json({ error: 'Échec de la récupération des consultants' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const consultant = await prisma.consultant.create({
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        skills: JSON.stringify(body.skills || []),
        dailyRate: body.dailyRate || 500,
      },
    })
    return NextResponse.json(consultant)
  } catch (error) {
    console.error('[POST /api/consultants]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la création du consultant', detail }, { status: 500 })
  }
}
