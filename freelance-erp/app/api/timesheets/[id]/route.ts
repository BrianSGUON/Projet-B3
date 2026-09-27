import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.hours !== undefined) data.hours = parseFloat(body.hours)
    if (body.date !== undefined) data.date = new Date(body.date)
    if (body.description !== undefined) data.description = body.description
    if (body.projectId !== undefined) data.projectId = body.projectId
    if (body.consultantId !== undefined) data.consultantId = body.consultantId

    const timesheet = await prisma.timesheet.update({
      where: { id },
      data,
      include: { consultant: true, project: { include: { client: true } } },
    })
    return NextResponse.json(timesheet)
  } catch (error) {
    console.error('[PATCH /api/timesheets/[id]]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la mise à jour de la saisie', detail }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params 

    // 3. On utilise l'id extrait
    await prisma.timesheet.delete({ where: { id: id } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/timesheets/[id]]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la suppression de la saisie', detail }, { status: 500 })
  }
}