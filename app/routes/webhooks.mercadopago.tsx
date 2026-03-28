import type { ActionFunctionArgs } from 'react-router'
import { createElement } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getPayment } from '~/utils/mercadopago.server'
import { generateTickets } from '~/utils/tickets.server'
import { sendEmail } from '~/utils/email.server'
import ReservationConfirmation from '~/emails/ReservationConfirmation'
import NewReservationNotification from '~/emails/NewReservationNotification'

// Supabase admin client (service role, bypasses RLS)
function adminSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// POST /webhooks/mercadopago
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  // MP sends topic=payment and data.id with the payment ID
  const topic = body.type as string
  const paymentId = (body.data as { id?: string })?.id

  if (topic !== 'payment' || !paymentId) {
    return new Response('OK', { status: 200 })
  }

  const db = adminSupabase()

  // Find reserva by mp_preference_id (stored as external_reference)
  const { data: reserva } = await db
    .from('reservas')
    .select('id, status, payment_status, organization_id, tickets_generated')
    .eq('mp_payment_id', paymentId)
    .maybeSingle()

  // Try by external_reference if not found by payment_id
  let targetReserva = reserva

  if (!targetReserva) {
    // Get payment to find external_reference (reserva id)
    // We need an access token — fetch from any connected org for this payment
    // In practice we look up by external_reference after fetching
    try {
      // Fetch payment from MP API directly using platform token
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      })
      if (!mpResponse.ok) return new Response('OK', { status: 200 })

      const payment = await mpResponse.json() as {
        status: string
        external_reference: string
        collector: { id: number }
      }

      const reservaId = payment.external_reference

      const { data: r } = await db
        .from('reservas')
        .select('id, status, payment_status, organization_id, tickets_generated')
        .eq('id', reservaId)
        .maybeSingle()

      if (!r) return new Response('OK', { status: 200 })

      targetReserva = r

      // Save payment id for future webhooks
      await db
        .from('reservas')
        .update({ mp_payment_id: paymentId })
        .eq('id', reservaId)

      // Handle payment status
      await handlePaymentStatus(db, r.id, payment.status, r.tickets_generated)
    } catch (err) {
      console.error('MP webhook error:', err)
    }

    return new Response('OK', { status: 200 })
  }

  // If found by mp_payment_id, fetch current status
  try {
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })
    if (!mpResponse.ok) return new Response('OK', { status: 200 })

    const payment = await mpResponse.json() as { status: string }
    await handlePaymentStatus(db, targetReserva.id, payment.status, targetReserva.tickets_generated)
  } catch (err) {
    console.error('MP webhook error:', err)
  }

  return new Response('OK', { status: 200 })
}

async function handlePaymentStatus(
  db: ReturnType<typeof adminSupabase>,
  reservaId: string,
  mpStatus: string,
  ticketsAlreadyGenerated: boolean | null,
) {
  const paymentStatus =
    mpStatus === 'approved' ? 'pago' :
    mpStatus === 'pending' || mpStatus === 'in_process' ? 'pendente' :
    mpStatus === 'refunded' || mpStatus === 'cancelled' ? 'reembolsado' :
    'falhou'

  const update: Record<string, unknown> = { payment_status: paymentStatus }

  if (paymentStatus === 'pago') {
    update.status = 'confirmada'
    update.data_confirmacao = new Date().toISOString()
  }

  await db.from('reservas').update(update).eq('id', reservaId)

  // Auto-generate tickets on first confirmed payment
  if (paymentStatus === 'pago' && !ticketsAlreadyGenerated) {
    try {
      await generateTickets(reservaId, db)
    } catch (err) {
      console.error('Failed to generate tickets:', err)
    }

    // Send emails
    try {
      await sendConfirmationEmails(db, reservaId, paymentStatus)
    } catch (err) {
      console.error('Failed to send emails:', err)
    }
  }
}

async function sendConfirmationEmails(
  db: ReturnType<typeof adminSupabase>,
  reservaId: string,
  paymentStatus: string,
) {
  // Fetch full reserva data for emails
  const { data: reserva } = await db
    .from('reservas')
    .select(`
      id,
      reserva_numero,
      valor_total_com_opcionais,
      numero_participantes,
      clientes(nome_completo, email, whatsapp),
      tours(name, start_date, city),
      tour_boarding_points(name, departure_time),
      reservation_participants(nome_completo, cpf, whatsapp, ponto_embarque_id),
      tickets(ticket_number, reservation_participant_id),
      organizations(name, email, whatsapp, slug)
    `)
    .eq('id', reservaId)
    .single()

  if (!reserva) return

  const r = reserva as unknown as {
    reserva_numero: string
    valor_total_com_opcionais: number | null
    clientes: { nome_completo: string; email: string | null; whatsapp: string | null } | null
    tours: { name: string; start_date: string | null; city: string | null } | null
    reservation_participants: { nome_completo: string; cpf: string | null; whatsapp: string | null; ponto_embarque_id: string | null }[]
    tickets: { ticket_number: string; reservation_participant_id: string | null }[]
    organizations: { name: string; email: string | null; whatsapp: string | null; slug: string } | null
    tour_boarding_points: { name: string; departure_time: string | null }[]
  }

  const cliente = r.clientes
  const tour = r.tours
  const org = r.organizations
  const boarding = r.tour_boarding_points[0]

  if (!tour || !org) return

  const tourDate = tour.start_date
    ? new Date(tour.start_date).toLocaleDateString('pt-BR', { dateStyle: 'long' })
    : ''

  const baseUrl = `https://${org.slug}.trilheiros.app`

  // Participants with their ticket numbers
  const participantsWithTickets = r.reservation_participants.map((p, i) => ({
    nome: p.nome_completo,
    ticketNumber: r.tickets[i]?.ticket_number ?? '',
    cpf: p.cpf,
    whatsapp: p.whatsapp,
  }))

  // Email to client
  if (cliente?.email) {
    await sendEmail({
      to: cliente.email,
      subject: `Reserva ${r.reserva_numero} confirmada — ${tour.name}`,
      template: createElement(ReservationConfirmation, {
        clienteName: cliente.nome_completo,
        reservaNumero: r.reserva_numero,
        tourName: tour.name,
        tourDate,
        tourCity: tour.city ?? '',
        boardingPoint: boarding?.name ?? '',
        boardingTime: boarding?.departure_time ?? '',
        participants: participantsWithTickets,
        valorTotal: r.valor_total_com_opcionais ?? 0,
        agencyName: org.name,
        agencyWhatsapp: org.whatsapp ?? undefined,
        ticketBaseUrl: baseUrl,
      }),
    })
  }

  // Email to agency
  if (org.email) {
    await sendEmail({
      to: org.email,
      subject: `Nova reserva ${r.reserva_numero} — ${cliente?.nome_completo ?? 'Cliente'}`,
      template: createElement(NewReservationNotification, {
        reservaNumero: r.reserva_numero,
        tourName: tour.name,
        tourDate,
        clienteNome: cliente?.nome_completo ?? 'Cliente',
        clienteWhatsapp: cliente?.whatsapp ?? null,
        participants: participantsWithTickets,
        valorTotal: r.valor_total_com_opcionais ?? 0,
        paymentStatus,
        adminUrl: `https://trilheiros.app/admin/reservas/${reservaId}`,
      }),
    })
  }
}

export default function MercadoPagoWebhook() {
  return null
}
