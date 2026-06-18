import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const HOURS_PER_DAY = 7

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: true,
        timesheets: { include: { consultant: true } },
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    type ProjectWithRelations = {
      id: string; name: string; status: string
      client: { company: string | null; name: string }
      timesheets: { hours: number; consultant: { dailyRate: number } }[]
      invoices: { amount: number }[]
    }

    const data = (projects as ProjectWithRelations[]).map((p) => {
      const totalHours = p.timesheets.reduce((s: number, t: { hours: number }) => s + t.hours, 0)
      const totalDays = Math.round((totalHours / HOURS_PER_DAY) * 10) / 10
      const invoiced = p.invoices.reduce((s: number, i: { amount: number }) => s + i.amount, 0)
      const cost = p.timesheets.reduce((s: number, t: { hours: number; consultant: { dailyRate: number } }) => s + (t.hours / HOURS_PER_DAY) * t.consultant.dailyRate, 0)
      const margin = invoiced - cost
      const realDailyRate = totalDays > 0 ? invoiced / totalDays : 0

      return {
        id: p.id,
        name: p.name,
        client: p.client.company ?? p.client.name,
        status: p.status,
        totalHours,
        totalDays,
        invoiced,
        cost: Math.round(cost),
        margin: Math.round(margin),
        realDailyRate: Math.round(realDailyRate),
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/profitability]', error)
    return NextResponse.json({ error: 'Échec du calcul de rentabilité' }, { status: 500 })
  }
}
