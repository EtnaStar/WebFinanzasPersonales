# Backend — Node.js + Express + TypeScript

## Setup
- **Runtime:** Node.js 20 LTS
- **Framework:** Express 5
- **Lenguaje:** TypeScript (strict mode)
- **ORM:** Prisma
- **Validación:** Zod
- **Auth:** JWT (access token 15min) + Refresh token en Redis (7 días)
- **Logs:** Pino (JSON estructurado)
- **Tests:** Vitest + Supertest

## Estructura del Proyecto

```
backend/src/
├── modules/
│   ├── auth/
│   │   ├── auth.router.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.schema.ts
│   │   └── auth.types.ts
│   ├── accounts/
│   ├── transactions/
│   ├── budgets/
│   ├── subscriptions/
│   └── reports/
├── shared/
│   ├── config/
│   │   └── index.ts          # Config tipada desde env vars
│   ├── database/
│   │   └── prisma.client.ts  # Singleton de Prisma
│   ├── redis/
│   │   └── redis.client.ts   # Singleton de Redis
│   ├── middleware/
│   │   ├── authenticate.ts   # Verificar JWT
│   │   ├── authorize.ts      # Permisos por plan
│   │   ├── error-handler.ts  # Manejo global de errores
│   │   ├── rate-limit.ts     # Rate limiting con Redis
│   │   └── validate.ts       # Middleware de validación Zod
│   ├── errors/
│   │   └── app-errors.ts     # Errores de dominio tipados
│   └── utils/
│       └── logger.ts
├── app.ts                    # Express app (sin listen)
└── server.ts                 # Punto de entrada (listen)
```

## app.ts — Configuración Express

```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { authRouter } from './modules/auth/auth.router';
import { transactionRouter } from './modules/transactions/transactions.router';
import { errorHandler } from './shared/middleware/error-handler';

const app = express();

// Seguridad
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Rutas
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/accounts', authenticate, accountRouter);
app.use('/api/v1/transactions', authenticate, transactionRouter);
app.use('/api/v1/subscriptions', authenticate, subscriptionRouter);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Error handler siempre al final
app.use(errorHandler);

export { app };
```

## Errores de Dominio

```typescript
// shared/errors/app-errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('Unauthorized', 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class TooManyRequestsError extends AppError {
  constructor() {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }
}
```

## Middleware de Autenticación

```typescript
// shared/middleware/authenticate.ts
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new UnauthorizedError();

  const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
  req.user = { id: payload.sub, plan: payload.plan };
  next();
}

// shared/middleware/authorize.ts — guardia por plan de suscripción
export function requirePlan(...plans: SubscriptionPlan[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!plans.includes(req.user.plan)) {
      throw new ForbiddenError('Upgrade your plan to access this feature');
    }
    next();
  };
}

// Uso en router:
router.get('/reports/advanced', requirePlan('BUSINESS', 'ADVISOR'), controller.advancedReport);
```

## Respuestas API Consistentes

```typescript
// Formato estándar de respuesta exitosa
{
  "data": { ... },        // resultado
  "meta": {               // solo en listas
    "total": 150,
    "page": 1,
    "limit": 20
  }
}

// Formato estándar de error
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Transaction not found"
  }
}
```

## Validación con Zod Middleware

```typescript
// shared/middleware/validate.ts
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message);
    }
    req.body = result.data;
    next();
  };
}

// Uso en router:
router.post('/', validate(createTransactionSchema), controller.create);
```

## Variables de Entorno

```env
# backend/.env.example
NODE_ENV=development
PORT=3001

# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/finanzas_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=cambiar-en-produccion-minimo-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (para notificaciones)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

## Tests

```typescript
// Estructura de tests por módulo
modules/transactions/
└── __tests__/
    ├── transactions.service.test.ts    # Tests unitarios de lógica
    └── transactions.router.test.ts     # Tests de integración (supertest)

// Ejemplo test de integración
describe('POST /api/v1/transactions', () => {
  it('creates a transaction for authenticated user', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ amountCents: 5000, type: 'EXPENSE', accountId: testAccountId, date: new Date() });

    expect(res.status).toBe(201);
    expect(res.body.data.amountCents).toBe(5000);
  });
});
```
