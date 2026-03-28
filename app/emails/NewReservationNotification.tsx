import {
  Html, Head, Body, Container, Section, Text, Heading,
  Hr, Link, Preview, Row, Column,
} from '@react-email/components'

interface Participant {
  nome: string
  cpf: string | null
  whatsapp: string | null
}

interface Props {
  reservaNumero: string
  tourName: string
  tourDate: string
  clienteNome: string
  clienteWhatsapp: string | null
  participants: Participant[]
  valorTotal: number
  paymentStatus: string
  adminUrl: string
}

const money = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatCPF = (cpf: string) =>
  cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')

export default function NewReservationNotification({
  reservaNumero,
  tourName,
  tourDate,
  clienteNome,
  clienteWhatsapp,
  participants,
  valorTotal,
  paymentStatus,
  adminUrl,
}: Props) {
  const statusLabel =
    paymentStatus === 'pago' ? 'Pago' :
    paymentStatus === 'pendente' ? 'Aguardando pagamento' :
    paymentStatus

  const statusColor =
    paymentStatus === 'pago' ? '#16a34a' : '#d97706'

  const whatsappHref = clienteWhatsapp
    ? `https://wa.me/55${clienteWhatsapp.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(clienteNome)}!%20Vi%20sua%20reserva%20${reservaNumero}.`
    : null

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Nova reserva {reservaNumero} — {clienteNome} · {tourName}</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={logo}>trilheiros.app</Text>
            <Text style={headerSub}>Painel da agência</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Heading style={h1}>Nova reserva recebida!</Heading>
            <Text style={subtitle}>
              <strong>{clienteNome}</strong> fez uma reserva para{' '}
              <strong>{tourName}</strong>.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Summary */}
          <Section style={section}>
            <Row style={detailRow}>
              <Column style={detailLabel}>Reserva</Column>
              <Column style={{ ...detailValue, fontFamily: 'monospace', color: '#6366f1', fontWeight: '700' }}>
                {reservaNumero}
              </Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Passeio</Column>
              <Column style={detailValue}>{tourName}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Data</Column>
              <Column style={detailValue}>{tourDate}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Cliente</Column>
              <Column style={detailValue}>{clienteNome}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Valor</Column>
              <Column style={{ ...detailValue, fontWeight: '600' }}>{money(valorTotal)}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Pagamento</Column>
              <Column style={{ ...detailValue, color: statusColor, fontWeight: '600' }}>{statusLabel}</Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Participants */}
          <Section style={section}>
            <Heading style={h2}>Participantes ({participants.length})</Heading>
            {participants.map((p, i) => (
              <Row key={i} style={{ marginBottom: '8px' }}>
                <Column style={detailLabel}>{i + 1}.</Column>
                <Column>
                  <Text style={{ ...detailValue, margin: 0 }}>{p.nome}</Text>
                  {p.cpf && (
                    <Text style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                      CPF: {formatCPF(p.cpf)}
                    </Text>
                  )}
                  {p.whatsapp && (
                    <Text style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                      WhatsApp: {p.whatsapp}
                    </Text>
                  )}
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={divider} />

          {/* Actions */}
          <Section style={{ ...section, textAlign: 'center' as const }}>
            <Link href={adminUrl} style={ctaBtn}>
              Ver reserva no painel
            </Link>
            {whatsappHref && (
              <Link href={whatsappHref} style={{ ...ctaBtn, backgroundColor: '#25d366', marginLeft: '12px' }}>
                Falar com cliente
              </Link>
            )}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Powered by{' '}
              <Link href="https://trilheiros.app" style={{ color: '#6366f1' }}>
                trilheiros.app
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const body = { backgroundColor: '#f5f5f5', fontFamily: 'sans-serif', margin: 0 }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' }
const header = { backgroundColor: '#111827', padding: '16px 32px' }
const logo = { color: '#ffffff', fontSize: '18px', fontWeight: '700', margin: '0 0 2px' }
const headerSub = { color: '#9ca3af', fontSize: '12px', margin: 0 }
const heroSection = { padding: '32px 32px 0' }
const h1 = { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }
const subtitle = { fontSize: '15px', color: '#6b7280', margin: 0 }
const section = { padding: '20px 32px' }
const h2 = { fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 12px' }
const detailRow = { marginBottom: '8px' }
const detailLabel = { fontSize: '13px', color: '#9ca3af', width: '100px' }
const detailValue = { fontSize: '14px', color: '#111827' }
const ctaBtn = { backgroundColor: '#6366f1', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }
const divider = { borderColor: '#e5e7eb', margin: '0 32px' }
const footer = { padding: '16px 32px 24px', textAlign: 'center' as const }
const footerText = { fontSize: '12px', color: '#9ca3af', margin: 0 }
