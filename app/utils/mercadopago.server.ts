import { MercadoPagoConfig, Preference, Payment, OAuth } from 'mercadopago'

// ── Platform-level MP client (for OAuth flows) ──────────────────────────────

function platformClient() {
  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN ?? '',
  })
}

// ── Agency-level MP client (for creating preferences on their behalf) ────────

function agencyClient(accessToken: string) {
  return new MercadoPagoConfig({ accessToken })
}

// ── OAuth ─────────────────────────────────────────────────────────────────────

export interface MPOAuthResult {
  access_token: string
  collector_id: number
  public_key: string
}

export async function exchangeOAuthCode(code: string): Promise<MPOAuthResult> {
  const clientId = process.env.MP_CLIENT_ID ?? ''
  const clientSecret = process.env.MP_CLIENT_SECRET ?? ''
  const redirectUri = process.env.MP_REDIRECT_URI ?? ''

  const response = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_secret: clientSecret,
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`MP OAuth error: ${err}`)
  }

  const data = await response.json() as {
    access_token: string
    user_id: number
    public_key: string
  }

  return {
    access_token: data.access_token,
    collector_id: data.user_id,
    public_key: data.public_key,
  }
}

// ── Create payment preference ─────────────────────────────────────────────────

export interface CreatePreferenceParams {
  agencyAccessToken: string
  agencyCollectorId: number
  reservaId: string
  reservaNumero: string
  tourName: string
  unitPrice: number
  quantity: number
  payerEmail?: string
  payerName?: string
}

export async function createPaymentPreference(params: CreatePreferenceParams) {
  const {
    agencyAccessToken, reservaId, reservaNumero,
    tourName, unitPrice, quantity, payerEmail, payerName,
  } = params

  const client = agencyClient(agencyAccessToken)
  const preference = new Preference(client)

  const platformFee = Math.round(unitPrice * quantity * 0.05 * 100) / 100

  const baseUrl = process.env.PUBLIC_URL ?? 'https://trilheiros.app'

  const result = await preference.create({
    body: {
      items: [
        {
          id: reservaId,
          title: tourName,
          quantity,
          unit_price: unitPrice,
          currency_id: 'BRL',
        },
      ],
      payer: payerEmail
        ? { email: payerEmail, name: payerName }
        : undefined,
      back_urls: {
        success: `${baseUrl}/pagamento/resultado?reserva=${reservaNumero}&status=approved`,
        failure: `${baseUrl}/pagamento/resultado?reserva=${reservaNumero}&status=failure`,
        pending: `${baseUrl}/pagamento/resultado?reserva=${reservaNumero}&status=pending`,
      },
      auto_return: 'approved',
      external_reference: reservaId,
      marketplace_fee: platformFee,
      notification_url: `${process.env.WEBHOOK_BASE_URL ?? baseUrl}/webhooks/mercadopago`,
    },
  })

  return result
}

// ── Get payment ──────────────────────────────────────────────────────────────

export async function getPayment(paymentId: string, agencyAccessToken: string) {
  const client = agencyClient(agencyAccessToken)
  const payment = new Payment(client)
  return payment.get({ id: paymentId })
}

// ── Build OAuth authorization URL ─────────────────────────────────────────────

export function buildOAuthUrl(orgId: string): string {
  const clientId = process.env.MP_CLIENT_ID ?? ''
  const redirectUri = encodeURIComponent(process.env.MP_REDIRECT_URI ?? '')
  return (
    `https://auth.mercadopago.com/authorization` +
    `?client_id=${clientId}` +
    `&response_type=code` +
    `&platform_id=mp` +
    `&redirect_uri=${redirectUri}` +
    `&state=${orgId}`
  )
}
