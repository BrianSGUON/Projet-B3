import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Compte de démonstration
  const demoPasswordHash = await bcrypt.hash('demo1234', 10)
  await prisma.user.upsert({
    where: { email: 'demo@freelanceos.fr' },
    update: {},
    create: {
      name: 'Alex Démo',
      email: 'demo@freelanceos.fr',
      passwordHash: demoPasswordHash,
      company: 'Studio Démo',
      plan: 'PRO',
    },
  })

  // Consultants
  const alice = await prisma.consultant.upsert({
    where: { email: 'alice@agency.com' },
    update: {},
    create: {
      name: 'Alice Martin',
      email: 'alice@agency.com',
      role: 'Dev',
      skills: JSON.stringify(['React', 'TypeScript', 'Node.js', 'PostgreSQL']),
      dailyRate: 650,
    },
  })

  const bob = await prisma.consultant.upsert({
    where: { email: 'bob@agency.com' },
    update: {},
    create: {
      name: 'Bob Leclerc',
      email: 'bob@agency.com',
      role: 'Design',
      skills: JSON.stringify(['Figma', 'UI/UX', 'Branding', 'Motion']),
      dailyRate: 550,
    },
  })

  const carol = await prisma.consultant.upsert({
    where: { email: 'carol@agency.com' },
    update: {},
    create: {
      name: 'Carol Dupont',
      email: 'carol@agency.com',
      role: 'Marketing',
      skills: JSON.stringify(['SEO', 'Content', 'Google Ads', 'Analytics']),
      dailyRate: 450,
    },
  })

  // Clients
  const clientA = await prisma.client.upsert({
    where: { email: 'contact@techcorp.fr' },
    update: {},
    create: {
      name: 'Jean Moreau',
      email: 'contact@techcorp.fr',
      company: 'TechCorp SAS',
      phone: '+33 1 23 45 67 89',
    },
  })

  const clientB = await prisma.client.upsert({
    where: { email: 'hello@startupxyz.io' },
    update: {},
    create: {
      name: 'Sophie Bernard',
      email: 'hello@startupxyz.io',
      company: 'StartupXYZ',
      phone: '+33 6 78 90 12 34',
    },
  })

  // Projects
  const project1 = await prisma.project.upsert({
    where: { id: 'proj-1' },
    update: {},
    create: {
      id: 'proj-1',
      name: 'Refonte Site Web TechCorp',
      description: 'Refonte complète du site vitrine avec Next.js',
      status: 'ACTIVE',
      type: 'FIXED',
      budget: 15000,
      startDate: new Date('2024-01-15'),
      clientId: clientA.id,
    },
  })

  const project2 = await prisma.project.upsert({
    where: { id: 'proj-2' },
    update: {},
    create: {
      id: 'proj-2',
      name: 'Campagne Marketing Q1',
      description: 'Stratégie de contenu et campagnes Google Ads',
      status: 'ACTIVE',
      type: 'HOURLY',
      startDate: new Date('2024-02-01'),
      clientId: clientB.id,
    },
  })

  const project3 = await prisma.project.upsert({
    where: { id: 'proj-3' },
    update: {},
    create: {
      id: 'proj-3',
      name: 'App Mobile StartupXYZ',
      description: 'Développement app React Native',
      status: 'PAUSED',
      type: 'HOURLY',
      startDate: new Date('2024-01-01'),
      clientId: clientB.id,
    },
  })

  // Project assignments
  await prisma.projectConsultant.upsert({
    where: { projectId_consultantId: { projectId: project1.id, consultantId: alice.id } },
    update: {},
    create: { projectId: project1.id, consultantId: alice.id },
  })
  await prisma.projectConsultant.upsert({
    where: { projectId_consultantId: { projectId: project1.id, consultantId: bob.id } },
    update: {},
    create: { projectId: project1.id, consultantId: bob.id },
  })
  await prisma.projectConsultant.upsert({
    where: { projectId_consultantId: { projectId: project2.id, consultantId: carol.id } },
    update: {},
    create: { projectId: project2.id, consultantId: carol.id },
  })
  await prisma.projectConsultant.upsert({
    where: { projectId_consultantId: { projectId: project3.id, consultantId: alice.id } },
    update: {},
    create: { projectId: project3.id, consultantId: alice.id },
  })

  // Timesheets
  const timesheetEntries = [
    { date: new Date('2024-03-01'), hours: 7, description: 'Intégration homepage', projectId: project1.id, consultantId: alice.id },
    { date: new Date('2024-03-02'), hours: 6, description: 'Composants UI', projectId: project1.id, consultantId: alice.id },
    { date: new Date('2024-03-04'), hours: 8, description: 'Design maquettes', projectId: project1.id, consultantId: bob.id },
    { date: new Date('2024-03-05'), hours: 4, description: 'Révisions client', projectId: project1.id, consultantId: bob.id },
    { date: new Date('2024-03-01'), hours: 5, description: 'Audit SEO', projectId: project2.id, consultantId: carol.id },
    { date: new Date('2024-03-03'), hours: 6, description: 'Rédaction contenus', projectId: project2.id, consultantId: carol.id },
    { date: new Date('2024-03-06'), hours: 7, description: 'Setup campagnes', projectId: project2.id, consultantId: carol.id },
    { date: new Date('2024-03-07'), hours: 8, description: 'Architecture app', projectId: project3.id, consultantId: alice.id },
  ]

  for (const entry of timesheetEntries) {
    await prisma.timesheet.create({ data: entry })
  }

  // Invoices
  const inv1 = await prisma.invoice.upsert({
    where: { number: 'INV-2024-001' },
    update: {},
    create: {
      number: 'INV-2024-001',
      status: 'PAID',
      amount: 7500,
      tax: 20,
      dueDate: new Date('2024-02-28'),
      issuedDate: new Date('2024-02-01'),
      clientId: clientA.id,
      projectId: project1.id,
      notes: 'Acompte 50% - Refonte TechCorp',
    },
  })

  await prisma.invoiceItem.createMany({
    data: [
      { description: 'Développement frontend - 10j', quantity: 10, unitPrice: 650, invoiceId: inv1.id },
      { description: 'Design UI/UX - 4j', quantity: 4, unitPrice: 550, invoiceId: inv1.id },
    ],
  })

  const inv2 = await prisma.invoice.upsert({
    where: { number: 'INV-2024-002' },
    update: {},
    create: {
      number: 'INV-2024-002',
      status: 'SENT',
      amount: 2700,
      tax: 20,
      dueDate: new Date('2024-04-15'),
      issuedDate: new Date('2024-03-15'),
      clientId: clientB.id,
      projectId: project2.id,
      notes: 'Facturation mars - Campagne Marketing',
    },
  })

  await prisma.invoiceItem.createMany({
    data: [
      { description: 'Conseil Marketing - 6h', quantity: 6, unitPrice: 450, invoiceId: inv2.id },
    ],
  })

  console.log('✅ Seed terminé')
  console.log('👤 Compte démo: demo@freelanceos.fr / demo1234')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
