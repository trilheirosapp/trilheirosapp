import type { SupabaseClient } from '@supabase/supabase-js'

// Generates one ticket per participant for a confirmed reserva.
// Idempotent: if tickets already exist for this reserva, does nothing.
export async function generateTickets(
  reservaId: string,
  db: SupabaseClient,
): Promise<void> {
  // Fetch participants not yet with a ticket
  const { data: participants, error } = await db
    .from('reservation_participants')
    .select('id, reserva_id')
    .eq('reserva_id', reservaId)

  if (error || !participants?.length) return

  // Check if tickets already exist
  const { data: existing } = await db
    .from('tickets')
    .select('id')
    .eq('reserva_id', reservaId)

  if (existing && existing.length > 0) return

  // Fetch current ticket count to generate sequential ticket_number
  const { count } = await db
    .from('tickets')
    .select('id', { count: 'exact', head: true })

  const base = (count ?? 0) + 1

  const tickets = participants.map((p, i) => ({
    reserva_id: reservaId,
    reservation_participant_id: p.id,
    ticket_number: `TK-${String(base + i).padStart(6, '0')}`,
    qr_token: crypto.randomUUID(),
    status: 'valid',
  }))

  await db.from('tickets').insert(tickets)

  // Mark tickets as generated on the reserva
  await db
    .from('reservas')
    .update({ tickets_generated: true })
    .eq('id', reservaId)
}
