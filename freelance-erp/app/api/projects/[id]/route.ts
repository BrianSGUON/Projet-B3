import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params;
    
    const body = await req.json()
    const project = await prisma.project.update({
      where: { id: id },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        type: body.type,
        budget: body.budget ? parseFloat(body.budget) : null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        clientId: body.clientId,
      },
      include: { client: true },
    })
    return NextResponse.json(project)
  } catch (error) {
    console.error('[PUT /api/projects/[id]]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la mise à jour du projet', detail }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params 
    await prisma.project.delete({ where: { id: id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/projects/[id]]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la suppression du projet', detail }, { status: 500 })
  }
}



