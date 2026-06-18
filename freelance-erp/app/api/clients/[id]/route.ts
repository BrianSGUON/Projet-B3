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

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        company: body.company,
        phone: body.phone,
      },
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('[PUT /api/clients/[id]]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la mise à jour du client', detail }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/clients/[id]]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la suppression du client', detail }, { status: 500 })
  }
}
