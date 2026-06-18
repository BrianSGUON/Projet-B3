import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
    color: '#7c3aed',
  },
  brandSub: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 2,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: 'right',
  },
  docNumber: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 700,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  infoBlock: {
    width: '45%',
  },
  infoLabel: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
  },
  infoSub: {
    fontSize: 9,
    color: '#6b7280',
  },
  table: {
    marginTop: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  colDesc: { width: '46%' },
  colQty: { width: '14%', textAlign: 'right' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  th: {
    fontSize: 8,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  td: {
    fontSize: 10,
    color: '#1f2937',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 6,
  },
  totalsLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  totalsValue: {
    fontSize: 9,
    color: '#1f2937',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 700,
  },
  grandTotalValue: {
    fontSize: 13,
    fontWeight: 700,
    color: '#7c3aed',
  },
  notes: {
    marginTop: 30,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  notesText: {
    fontSize: 9,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
})

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT: { bg: '#f3f4f6', color: '#4b5563', label: 'BROUILLON' },
  SENT: { bg: '#dbeafe', color: '#1d4ed8', label: 'ENVOYÉE' },
  PAID: { bg: '#d1fae5', color: '#047857', label: 'PAYÉE' },
  OVERDUE: { bg: '#fee2e2', color: '#b91c1c', label: 'EN RETARD' },
}

export type InvoicePdfData = {
  number: string
  status: string
  issuedDate: string
  dueDate: string
  tax: number
  amount: number
  notes?: string | null
  client: { name: string; company?: string | null; email: string; phone?: string | null }
  project?: { name: string } | null
  items: { description: string; quantity: number; unitPrice: number }[]
  issuer?: { name: string; company?: string | null; email: string }
}

function formatEUR(value: number) {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function formatDate(value: string) {
  const d = new Date(value)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function InvoicePdf({ data }: { data: InvoicePdfData }) {
  const st = STATUS_STYLE[data.status] ?? STATUS_STYLE.DRAFT
  const taxAmount = data.amount * (data.tax / 100)
  const total = data.amount + taxAmount

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>{data.issuer?.company || data.issuer?.name || 'FreelanceOS'}</Text>
            <Text style={styles.brandSub}>{data.issuer?.email || ''}</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>FACTURE</Text>
            <Text style={styles.docNumber}>{data.number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
              <Text style={{ color: st.color }}>{st.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Facturé à</Text>
            <Text style={styles.infoValue}>{data.client.company || data.client.name}</Text>
            {data.client.company && <Text style={styles.infoSub}>{data.client.name}</Text>}
            <Text style={styles.infoSub}>{data.client.email}</Text>
            {data.client.phone && <Text style={styles.infoSub}>{data.client.phone}</Text>}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Détails</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={styles.infoSub}>Date d&apos;émission</Text>
              <Text style={styles.infoSub}>{formatDate(data.issuedDate)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={styles.infoSub}>Date d&apos;échéance</Text>
              <Text style={styles.infoSub}>{formatDate(data.dueDate)}</Text>
            </View>
            {data.project && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.infoSub}>Projet</Text>
                <Text style={styles.infoSub}>{data.project.name}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Quantité</Text>
            <Text style={[styles.th, styles.colPrice]}>Prix unitaire</Text>
            <Text style={[styles.th, styles.colTotal]}>Total HT</Text>
          </View>
          {data.items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colPrice]}>{formatEUR(item.unitPrice)}</Text>
              <Text style={[styles.td, styles.colTotal]}>{formatEUR(item.quantity * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Sous-total HT</Text>
            <Text style={styles.totalsValue}>{formatEUR(data.amount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>TVA ({data.tax}%)</Text>
            <Text style={styles.totalsValue}>{formatEUR(taxAmount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total TTC</Text>
            <Text style={styles.grandTotalValue}>{formatEUR(total)}</Text>
          </View>
        </View>

        {data.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Document généré via FreelanceOS · Merci de votre confiance
        </Text>
      </Page>
    </Document>
  )
}
