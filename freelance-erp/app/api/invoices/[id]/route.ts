import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; 

  const body = await req.json();
  try {
    const invoice = await prisma.invoice.update({
      where: { id: id }, 
      data: { status: body.status },
      include: { client: true, project: true, items: true },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('[PUT /api/invoices/[id]]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: "Échec de la mise à jour de la facture", detail }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params;
    await prisma.invoice.delete({ 
      where: { id: id } 
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/invoices/[id]]', error)
    const detail = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: 'Échec de la suppression de la facture', detail }, { status: 500 });
  }
}