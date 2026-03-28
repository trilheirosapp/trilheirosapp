import { useSearchParams, Link } from 'react-router'
import { CheckCircle, XCircle, Clock, MessageCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrganization } from '@/contexts/OrganizationContext'
import { whatsappLink } from '@/lib/format'

type PaymentStatus = 'approved' | 'failure' | 'pending'

const STATUS_CONFIG: Record<PaymentStatus, {
  icon: typeof CheckCircle
  title: string
  description: string
  color: string
  bg: string
}> = {
  approved: {
    icon: CheckCircle,
    title: 'Pagamento confirmado!',
    description: 'Seu pagamento foi processado com sucesso. Em breve você receberá os ingressos por e-mail.',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950',
  },
  pending: {
    icon: Clock,
    title: 'Pagamento em processamento',
    description: 'Seu pagamento está sendo processado. Assim que for confirmado, você receberá os ingressos.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950',
  },
  failure: {
    icon: XCircle,
    title: 'Pagamento não realizado',
    description: 'Houve um problema com seu pagamento. Você pode tentar novamente ou escolher outra forma de pagamento.',
    color: 'text-destructive',
    bg: 'bg-destructive/5',
  },
}

export default function PagamentoResultado() {
  const [searchParams] = useSearchParams()
  const { organization } = useOrganization()

  const status = (searchParams.get('status') ?? 'pending') as PaymentStatus
  const reservaNumero = searchParams.get('reserva')

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Icon */}
        <div className={`w-20 h-20 rounded-full ${config.bg} flex items-center justify-center mx-auto`}>
          <Icon className={`w-10 h-10 ${config.color}`} />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{config.description}</p>
        </div>

        {/* Reserva number */}
        {reservaNumero && (
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-xs text-muted-foreground">Número da reserva</p>
            <p className="text-xl font-mono font-bold text-primary mt-0.5">{reservaNumero}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {reservaNumero && (
            <Link to={`/reserva/${reservaNumero}`}>
              <Button className="w-full gap-2">
                Ver status da reserva <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}

          {status === 'failure' && organization?.whatsapp && (
            <a
              href={whatsappLink(
                organization.whatsapp,
                `Olá! Tive um problema no pagamento da reserva ${reservaNumero ?? ''}. Podem me ajudar?`
              )}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" className="w-full gap-2">
                <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
              </Button>
            </a>
          )}

          <Link to="/">
            <Button variant="ghost" className="w-full">
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
