# Base de Datos — PostgreSQL + Redis

## PostgreSQL

### Reglas Generales
- ORM: **Prisma** (type-safe, migrations automáticas)
- Todas las tablas con `id` UUID, `created_at`, `updated_at`
- Datos financieros **siempre en centavos** (Integer, no Decimal/Float)
- Soft delete con `deleted_at` en entidades financieras (nunca borrar transacciones)
- Índices en columnas de búsqueda frecuente (`user_id`, `account_id`, `date`)

### Schema Principal (Prisma)

```prisma
// Usuarios
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  subscription  Subscription?
}

// Cuentas financieras (banco, tarjeta, efectivo, etc.)
model Account {
  id          String      @id @default(uuid())
  userId      String
  name        String
  type        AccountType
  currency    String      @default("USD")
  balanceCents Int        @default(0)   // en centavos
  color       String?
  icon        String?
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  deletedAt   DateTime?   // soft delete

  user         User          @relation(fields: [userId], references: [id])
  transactions Transaction[]

  @@index([userId])
}

enum AccountType {
  CHECKING
  SAVINGS
  CREDIT_CARD
  CASH
  INVESTMENT
  BUSINESS
}

// Transacciones
model Transaction {
  id            String          @id @default(uuid())
  accountId     String
  categoryId    String?
  amountCents   Int             // en centavos, siempre positivo
  type          TransactionType
  description   String?
  date          DateTime
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  deletedAt     DateTime?       // soft delete

  account       Account         @relation(fields: [accountId], references: [id])
  category      Category?       @relation(fields: [categoryId], references: [id])

  @@index([accountId])
  @@index([date])
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
}

// Categorías
model Category {
  id          String    @id @default(uuid())
  userId      String?   // null = categorías del sistema
  name        String
  icon        String?
  color       String?
  parentId    String?   // subcategorías
  createdAt   DateTime  @default(now())

  transactions Transaction[]
  budgets      Budget[]
  parent       Category?  @relation("CategoryChildren", fields: [parentId], references: [id])
  children     Category[] @relation("CategoryChildren")
}

// Presupuestos
model Budget {
  id            String    @id @default(uuid())
  userId        String
  categoryId    String
  amountCents   Int       // límite en centavos
  period        Period    // MONTHLY, WEEKLY, YEARLY
  startDate     DateTime
  endDate       DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  category      Category  @relation(fields: [categoryId], references: [id])

  @@index([userId])
}

enum Period {
  WEEKLY
  MONTHLY
  YEARLY
}

// Suscripciones (Stripe)
model Subscription {
  id                String             @id @default(uuid())
  userId            String             @unique
  stripeCustomerId  String             @unique
  stripeSubId       String?            @unique
  plan              SubscriptionPlan
  status            SubscriptionStatus
  currentPeriodEnd  DateTime?
  cancelAtPeriodEnd Boolean            @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  user              User               @relation(fields: [userId], references: [id])
}

enum SubscriptionPlan {
  FREE
  PERSONAL
  BUSINESS
  ADVISOR
}

enum SubscriptionStatus {
  ACTIVE
  TRIALING
  PAST_DUE
  CANCELED
  INCOMPLETE
}
```

### Convenciones de Migrations

```bash
# Crear migration nueva
npx prisma migrate dev --name describe_what_changes

# Ejemplos de nombres descriptivos:
npx prisma migrate dev --name add_budget_table
npx prisma migrate dev --name add_index_transactions_date
npx prisma migrate dev --name soft_delete_accounts

# Nunca usar:
npx prisma migrate dev --name migration1   # ❌ no descriptivo
npx prisma migrate dev --name fix          # ❌ ambiguo
```

### Queries Comunes

```typescript
// Transacciones con soft delete
prisma.transaction.findMany({
  where: {
    accountId,
    deletedAt: null,   // siempre filtrar soft delete
    date: { gte: startDate, lte: endDate }
  },
  orderBy: { date: 'desc' }
});

// Balance calculado
prisma.transaction.aggregate({
  where: { accountId, deletedAt: null, type: 'INCOME' },
  _sum: { amountCents: true }
});
```

---

## Redis

### Uso por Caso

| Clave | Tipo | TTL | Descripción |
|-------|------|-----|-------------|
| `session:{userId}:{tokenId}` | String | 7d | Refresh token válido |
| `blacklist:{tokenId}` | String | 24h | JWTs revocados |
| `dashboard:{userId}` | String (JSON) | 5min | Cache resumen dashboard |
| `ratelimit:auth:{ip}` | Counter | 15min | Intentos de login por IP |
| `ratelimit:api:{userId}` | Counter | 1min | Requests por usuario |
| `exchange_rates:{date}` | String (JSON) | 1h | Tipos de cambio |

### Convenciones de Claves

```
{namespace}:{entity}:{identifier}

Ejemplos:
  session:user:abc123
  ratelimit:auth:192.168.1.1
  cache:dashboard:user-uuid-here
```

### Operaciones Típicas

```typescript
// Guardar sesión
await redis.setex(`session:${userId}:${tokenId}`, 604800, refreshToken);

// Invalidar sesión (logout)
await redis.del(`session:${userId}:${tokenId}`);

// Cache con JSON
await redis.setex(`cache:dashboard:${userId}`, 300, JSON.stringify(data));
const cached = await redis.get(`cache:dashboard:${userId}`);
if (cached) return JSON.parse(cached);

// Rate limiting
const count = await redis.incr(`ratelimit:auth:${ip}`);
if (count === 1) await redis.expire(`ratelimit:auth:${ip}`, 900);
if (count > 10) throw new TooManyRequestsError();
```
