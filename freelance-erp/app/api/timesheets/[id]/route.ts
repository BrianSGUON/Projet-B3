import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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