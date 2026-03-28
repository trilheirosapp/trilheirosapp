import {
  Html, Head, Body, Container, Section, Text, Heading,
  Hr, Link, Preview, Row, Column,
} from '@react-email/components'

interface Props {
  clienteName: string
  reservaNumero: string
  tourName: string
  tourDate: string
  tourCity: string
  boardingPoint: string
  boardingTime: string
  participants: { nome: string; ticketNumber: string }[]
  valorTotal: number
  agencyName: string
  agencyWhatsapp?: string
  ticketBaseUrl: string
}

const money = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ReservationConfirmation({
  clienteName,
  reservaNumero,
  tourName,
  tourDate,
  tourCity,
  boardingPoint,
  boardingTime,
  participants,
  valorTotal,
  agencyName,
  agencyWhatsapp,
  ticketBaseUrl,
}: Props) {
  const whatsappHref = agencyWhatsapp
    ? `https://wa.me/55${agencyWhatsapp.replace(/\D/g, '')}?text=Ol%C3%A1!%20Reserva%20${reservaNumero}`
    : null

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Reserva {reservaNumero} confirmada — {tourName}</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={logo}>trilheiros.app</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Heading style={h1}>Reserva confirmada! 🎉</Heading>
            <Text style={subtitle}>
              Olá, {clienteName}! Sua reserva para <strong>{tourName}</strong> foi confirmada.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Reserva number */}
          <Section style={section}>
            <Text style={label}>Número da reserva</Text>
            <Text style={reservaCode}>{reservaNumero}</Text>
          </Section>

          <Hr style={divider} />

          {/* Tour details */}
          <Section style={section}>
            <Heading style={h2}>Detalhes do passeio</Heading>
            <Row style={detailRow}>
              <Column style={detailLabel}>Passeio</Column>
              <Column style={detailValue}>{tourName}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Data</Column>
              <Column style={detailValue}>{tourDate}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Local</Column>
              <Column style={detailValue}>{tourCity}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Embarque</Column>
              <Column style={detailValue}>{boardingPoint}{boardingTime ? ` · ${boardingTime}` : ''}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Valor pago</Column>
              <Column style={{ ...detailValue, color: '#16a34a', fontWeight: '600' }}>
                {money(valorTotal)}
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Tickets */}
          <Section style={section}>
            <Heading style={h2}>Seus ingressos</Heading>
            <Text style={mutedText}>
              Apresente o QR code de cada ingresso na hora do embarque.
            </Text>
            {participants.map((p) => (
              <Section key={p.ticketNumber} style={ticketCard}>
                <Row>
                  <Column>
                    <Text style={ticketName}>{p.nome}</Text>
                    <Text style={ticketNumber}>Ingresso: {p.ticketNumber}</Text>
                  </Column>
                  <Column style={{ textAlign: 'right' as const }}>
                    <Link href={`${ticketBaseUrl}/ticket/${p.ticketNumber}`} style={ticketBtn}>
                      Ver QR Code
                    </Link>
                  </Column>
                </Row>
              </Section>
            ))}
          </Section>

          <Hr style={divider} />

          {/* Agency contact */}
          <Section style={section}>
            <Text style={mutedText}>
              Dúvidas? Entre em contato com <strong>{agencyName}</strong>.
            </Text>
            {whatsappHref && (
              <Link href={whatsappHref} style={ctaBtn}>
                Falar no WhatsApp
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
const header = { backgroundColor: '#6366f1', padding: '20px 32px' }
const logo = { color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: 0 }
const heroSection = { padding: '32px 32px 0' }
const h1 = { fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }
const subtitle = { fontSize: '15px', color: '#6b7280', margin: 0 }
const section = { padding: '20px 32px' }
const label = { fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 4px' }
const reservaCode = { fontSize: '28px', fontWeight: '700', color: '#6366f1', fontFamily: 'monospace', margin: 0 }
const h2 = { fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 12px' }
const detailRow = { marginBottom: '8px' }
const detailLabel = { fontSize: '14px', color: '#9ca3af', width: '120px' }
const detailValue = { fontSize: '14px', color: '#111827' }
const mutedText = { fontSize: '14px', color: '#6b7280', margin: '0 0 12px' }
const ticketCard = { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px' }
const ticketName = { fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 2px' }
const ticketNumber = { fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', margin: 0 }
const ticketBtn = { backgroundColor: '#6366f1', color: '#ffffff', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none', display: 'inline-block' }
const ctaBtn = { backgroundColor: '#25d366', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }
const divider = { borderColor: '#e5e7eb', margin: '0 32px' }
const footer = { padding: '16px 32px 24px', textAlign: 'center' as const }
const footerText = { fontSize: '12px', color: '#9ca3af', margin: 0 }
