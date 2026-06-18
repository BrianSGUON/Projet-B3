import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidEmail } from '@/lib/validation'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const body = await req.json()

    if (body.email && !isValidEmail(body.email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    // skills peut arriver soit en tableau (depuis le formulaire), soit déjà en string JSON
    const skills = Array.isArray(body.skills)
      ? JSON.stringify(body.skills)
      : body.skills

    const updatedConsultant = await prisma.consultant.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        skills,
        dailyRate: body.dailyRate !== undefined ? Number(body.dailyRate) : undefined,
        avatar: body.avatar,
      },
    })

    return NextResponse.json(updatedConsultant)
  } catch (error) {
    console.error('[PUT /api/consultants/[id]]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la mise à jour du consultant', detail }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.consultant.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/consultants/[id]]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la suppression du consultant', detail }, { status: 500 })
  }
}
