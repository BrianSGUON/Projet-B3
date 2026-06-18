import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      totalConsultants,
      totalClients,
      activeProjects,
      totalInvoices,
      monthlyTimesheets,
      lastMonthTimesheets,
      recentInvoices,
      projectsByStatus,
      consultants,
    ] = await Promise.all([
      prisma.consultant.count(),
      prisma.client.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.invoice.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      prisma.timesheet.aggregate({
        _sum: { hours: true },
        where: { date: { gte: startOfMonth } },
      }),
      prisma.timesheet.aggregate({
        _sum: { hours: true },
        where: { date: { gte: startOfLastMonth, lt: startOfMonth } },
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { issuedDate: 'desc' },
        include: { client: true },
      }),
      prisma.project.groupBy({ by: ['status'], _count: true }),
      prisma.consultant.findMany({
        include: {
          timesheets: {
            where: { date: { gte: startOfMonth } },
          },
        },
      }),
    ])

    // Hours by consultant this month
    const consultantHours = consultants.map((c: { name: string; role: string; timesheets: { hours: number }[] }) => ({
      name: c.name.split(' ')[0],
      hours: c.timesheets.reduce((sum: number, t: { hours: number }) => sum + t.hours, 0),
      role: c.role,
    }))

    // Revenue last 6 months
    const revenueByMonth = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const inv = await prisma.invoice.aggregate({
        _sum: { amount: true },
        where: {
          issuedDate: { gte: d, lt: endD },
          status: { in: ['PAID', 'SENT'] },
        },
      })
      revenueByMonth.push({
        month: d.toLocaleString('fr-FR', { month: 'short' }),
        revenue: inv._sum.amount || 0,
      })
    }

    return NextResponse.json({
      stats: {
        totalConsultants,
        totalClients,
        activeProjects,
        totalRevenue: totalInvoices._sum.amount || 0,
        monthlyHours: monthlyTimesheets._sum.hours || 0,
        lastMonthHours: lastMonthTimesheets._sum.hours || 0,
      },
      recentInvoices,
      projectsByStatus,
      consultantHours,
      revenueByMonth,
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: 'Échec de la récupération des données du tableau de bord' }, { status: 500 })
  }
}
