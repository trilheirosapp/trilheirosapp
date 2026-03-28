import type { ActionFunctionArgs } from 'react-router'
import { createSupabaseAuthClient } from '~/utils/supabase.server'
import { createPaymentPreference } from '~/utils/mercadopago.server'

// POST /api/criar-preferencia
// Body: { reservaId: string }
// Returns: { init_point: string } or { error: string }
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method Not Allowed' }, { status: 405 })
  }

  const { supabase } = createSupabaseAuthClient(request)

  let reservaId: string
  try {
    const body = await request.json() as { reservaId: string }
    reservaId = body.reservaId
    if (!reservaId) throw new Error()
  } catch {
    return Response.json({ error: 'reservaId é obrigatório' }, { status: 400 })
  }

  // Fetch reserva with org MP credentials
  const { data: reserva } = await supabase
    .from('reservas')
    .select(`
      id,
      reserva_numero,
      valor_total_com_opcionais,
      numero_participantes,
      organizations!inner(
        mp_access_token,
        mp_collector_id
      ),
      reservation_participants(
        nome_completo,
        email
      )
    `)
    .eq('id', reservaId)
    .single()

  if (!reserva) {
    return Response.json({ error: 'Reserva não encontrada' }, { status: 404 })
  }

  const org = (reserva as unknown as {
    organizations: { mp_access_token: string | null; mp_collector_id: string | null }
  }).organizations

  if (!org.mp_access_token || !org.mp_collector_id) {
    return Response.json({ error: 'Organização sem Mercado Pago configurado' }, { status: 422 })
  }

  // Fetch tour name via separate query to keep types clean
  const { data: tourData } = await supabase
    .from('reservas')
    .select('tours(name)')
    .eq('id', reservaId)
    .single()

  const tourName = (tourData as unknown as { tours: { name: string } | null })?.tours?.name ?? 'Passeio'

  const firstParticipant = (reserva as unknown as {
    reservation_participants: { nome_completo: string; email: string | null }[]
  }).reservation_participants[0]

  try {
    const unitPrice = (reserva.valor_total_com_opcionais ?? 0) / (reserva.numero_participantes ?? 1)

    const preference = await createPaymentPreference({
      agencyAccessToken: org.mp_access_token,
      agencyCollectorId: Number(org.mp_collector_id),
      reservaId: reserva.id,
      reservaNumero: reserva.reserva_numero ?? reserva.id,
      tourName,
      unitPrice: Math.round(unitPrice * 100) / 100,
      quantity: reserva.numero_participantes ?? 1,
      payerEmail: firstParticipant?.email ?? undefined,
      payerName: firstParticipant?.nome_completo ?? undefined,
    })

    // Save preference id on reserva
    await supabase
      .from('reservas')
      .update({ mp_preference_id: preference.id })
      .eq('id', reservaId)

    return Response.json({
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    })
  } catch (err) {
    console.error('MP preference error:', err)
    return Response.json({ error: 'Erro ao criar preferência de pagamento' }, { status: 500 })
  }
}

export default function ApiCriarPreferencia() {
  return null
}
