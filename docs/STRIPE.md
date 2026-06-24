# Stripe — Pagos y Suscripciones

## Planes y Precios

| Plan | Precio | Incluye |
|------|--------|---------|
| FREE | $0/mes | 2 cuentas, 50 transacciones/mes |
| PERSONAL | $9.99/mes | Cuentas ilimitadas, reportes, exportación |
| BUSINESS | $24.99/mes | Multi-empresa, reportes avanzados, API |
| ADVISOR | $49.99/mes | Todo BUSINESS + acceso a asesorías humanas |

## Flujo de Suscripción

```
Usuario elige plan
    │
    ▼
POST /subscriptions/checkout
    │  → Crea/recupera Customer en Stripe
    │  → Crea Checkout Session
    │  → Retorna URL de Stripe
    ▼
Usuario completa pago en Stripe Hosted Page
    │
    ▼
Stripe dispara webhook: checkout.session.completed
    │
    ▼
POST /subscriptions/webhook (nuestro handler)
    │  → Verifica firma del webhook
    │  → Actualiza subscription en DB
    │  → Activa features del plan
    ▼
Usuario redirigido a /dashboard con plan activo
```

## Webhook Handler

```typescript
// modules/subscriptions/subscriptions.router.ts
// El webhook NO usa el middleware de auth JWT
// Stripe firma cada evento, verificar SIEMPRE
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),  // body sin parsear
  subscriptionController.handleWebhook
);

// modules/subscriptions/subscriptions.service.ts
async handleWebhook(signature: string, rawBody: Buffer) {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.stripe.webhookSecret   // desde env var
  );

  switch (event.type) {
    case 'checkout.session.completed':
      await this.activateSubscription(event.data.object);
      break;

    case 'customer.subscription.updated':
      await this.updateSubscription(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await this.cancelSubscription(event.data.object);
      break;

    case 'invoice.payment_failed':
      await this.handlePaymentFailed(event.data.object);
      break;
  }
}
```

## Verificación de Plan en Backend

```typescript
// El plan del usuario viene en el JWT payload
// Se actualiza en cada renovación de token
interface JwtPayload {
  sub: string;          // userId
  plan: SubscriptionPlan;
  exp: number;
}

// Middleware de autorización por plan
export function requirePlan(...plans: SubscriptionPlan[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!plans.includes(req.user.plan)) {
      throw new ForbiddenError('Upgrade your plan to access this feature');
    }
    next();
  };
}

// Uso:
router.get('/export', requirePlan('PERSONAL', 'BUSINESS', 'ADVISOR'), controller.export);
router.get('/trends', requirePlan('BUSINESS', 'ADVISOR'), controller.trends);
router.post('/advisory', requirePlan('ADVISOR'), controller.bookAdvisory);
```

## Portal de Cliente

```typescript
// Stripe Customer Portal — permite al usuario:
// - Ver facturas
// - Cambiar plan
// - Cancelar suscripción
// - Actualizar método de pago

async createPortalSession(userId: string): Promise<string> {
  const subscription = await subscriptionRepository.findByUserId(userId);
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${config.app.url}/settings/billing`,
  });
  return session.url;
}
```

## Testing de Stripe

```bash
# Escuchar webhooks en local con Stripe CLI
stripe listen --forward-to localhost:3001/api/v1/subscriptions/webhook

# Tarjetas de prueba
4242 4242 4242 4242  # Pago exitoso
4000 0000 0000 9995  # Pago fallido (fondos insuficientes)
4000 0025 0000 3155  # Requiere autenticación 3D Secure
```

## Variables de Entorno Stripe

```env
STRIPE_SECRET_KEY=sk_test_...         # sk_live_... en producción
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PERSONAL=price_...       # ID del precio en Stripe Dashboard
STRIPE_PRICE_BUSINESS=price_...
STRIPE_PRICE_ADVISOR=price_...
```

## Consideraciones de Seguridad
- NUNCA usar `STRIPE_SECRET_KEY` en el frontend
- SIEMPRE verificar la firma del webhook con `stripe.webhooks.constructEvent`
- SIEMPRE usar HTTPS en producción (Stripe lo requiere)
- Los IDs de Price de Stripe son públicos, pero la lógica de activación va solo en backend
