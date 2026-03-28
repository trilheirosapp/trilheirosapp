import { type RouteConfig, index, route, layout } from '@react-router/dev/routes'

export default [
  // ── Home (portal ou agência, dependendo do hostname) ──────────────────
  index('routes/home.tsx'),

  // ── Portal (trilheiros.app) ───────────────────────────────────────────
  route('entrar',              'routes/entrar.tsx'),
  route('cadastro',            'routes/cadastro.tsx'),
  route('buscar',              'routes/buscar.tsx'),
  route('super',               'routes/super.tsx'),
  route('destinos/:slug',      'routes/destino.tsx'),
  route('trilhas/:slug',       'routes/trilha.tsx'),
  route('agencias/:slug',      'routes/agencia.tsx'),

  // ── Admin — páginas standalone (sem sidebar) ──────────────────────────
  route('admin/entrar',        'routes/admin.entrar.tsx'),
  route('admin/setup',         'routes/admin.setup.tsx'),
  route('admin/mp-callback',   'routes/admin.mp-callback.tsx'),

  // ── Admin — seção com sidebar (nested layout) ─────────────────────────
  layout('routes/admin.layout.tsx', [
    route('admin',                    'routes/admin._index.tsx'),
    route('admin/passeios',           'routes/admin.passeios.tsx'),
    route('admin/passeios/novo',      'routes/admin.passeios.novo.tsx'),
    route('admin/passeios/:id',       'routes/admin.passeios.$id.tsx'),
    route('admin/reservas',           'routes/admin.reservas.tsx'),
    route('admin/reservas/:id',       'routes/admin.reservas.$id.tsx'),
    route('admin/clientes',           'routes/admin.clientes.tsx'),
    route('admin/configuracoes',      'routes/admin.configuracoes.tsx'),
    route('admin/checkin/:tourId',    'routes/admin.checkin.$tourId.tsx'),
  ]),

  // ── Agência — rotas públicas ──────────────────────────────────────────
  route('passeios/:slug',  'routes/passeio.tsx'),
  route('reserva/:slug',   'routes/reserva-status.tsx'),
  route('ticket/:token',   'routes/ticket.tsx'),

  // ── Cliente auth ──────────────────────────────────────────────────────
  route('cliente/entrar',          'routes/cliente.entrar.tsx'),
  route('cliente/cadastro',        'routes/cliente.cadastro.tsx'),
  route('cliente/minhas-reservas', 'routes/cliente.reservas.tsx'),

  // ── Mercado Pago ──────────────────────────────────────────────────────
  route('webhooks/mercadopago',    'routes/webhooks.mercadopago.tsx'),
  route('api/criar-preferencia',   'routes/api.criar-preferencia.tsx'),
  route('pagamento/resultado',     'routes/pagamento.resultado.tsx'),
] satisfies RouteConfig
