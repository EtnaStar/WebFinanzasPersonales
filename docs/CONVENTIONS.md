# Convenciones de Código

## Naming General

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos TS/JS | `kebab-case` | `transaction-service.ts` |
| Componentes React | `PascalCase.tsx` | `TransactionCard.tsx` |
| Variables | `camelCase` | `totalAmount` |
| Funciones | `camelCase` | `calculateBalance()` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS` |
| Interfaces | `PascalCase` con prefijo `I` opcional | `Transaction` o `ITransaction` |
| Types (uniones) | `PascalCase` | `TransactionType` |
| Enums | `PascalCase` | `AccountType` |
| Tablas DB | `snake_case` plural | `user_transactions` |
| Columnas DB | `snake_case` | `created_at` |
| Endpoints API | `kebab-case` plural | `/api/v1/user-accounts` |

## TypeScript

```typescript
// BIEN: Interface para objetos de dominio
interface Transaction {
  id: string;
  amount: number;       // siempre en centavos
  type: TransactionType;
  accountId: string;
  createdAt: Date;
}

// BIEN: Type para uniones
type TransactionType = 'income' | 'expense' | 'transfer';

// MAL: nunca usar any
const processData = (data: any) => { ... }  // ❌

// BIEN: tipar siempre
const processData = (data: Transaction) => { ... }  // ✅
```

## React Components

```typescript
// BIEN: Props con interface nombrada
interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (id: string) => void;
  className?: string;
}

// BIEN: Functional component con tipos explícitos
export function TransactionCard({ transaction, onEdit, className }: TransactionCardProps) {
  return (
    <div className={cn('rounded-lg p-4', className)}>
      ...
    </div>
  );
}

// MAL: default export (excepto páginas/rutas)
export default TransactionCard;  // ❌ en componentes
export { TransactionCard };      // ✅
```

## Custom Hooks

```typescript
// Prefijo "use", lógica encapsulada, retornar objeto nombrado
export function useTransactions(accountId: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ... lógica

  return { transactions, isLoading, error, refetch };
}
```

## Backend — Estructura por Capa

```typescript
// ROUTER: solo definir rutas y aplicar middleware
router.get('/:id', authenticate, authorize('read:transaction'), controller.getById);

// CONTROLLER: validar input, llamar service, responder
async getById(req: Request, res: Response) {
  const { id } = transactionIdSchema.parse(req.params);
  const transaction = await transactionService.getById(id, req.user.id);
  res.json({ data: transaction });
}

// SERVICE: lógica de negocio, nunca accede a DB directo
async getById(id: string, userId: string): Promise<Transaction> {
  const transaction = await transactionRepository.findById(id);
  if (transaction.userId !== userId) throw new ForbiddenError();
  return transaction;
}

// REPOSITORY: solo queries, sin lógica de negocio
async findById(id: string): Promise<Transaction | null> {
  return prisma.transaction.findUnique({ where: { id } });
}
```

## Manejo de Errores

```typescript
// Errores de dominio tipados
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('Access denied', 403);
  }
}

// En controllers: dejar que el middleware global los capture
// NO: try/catch en cada controller
// SÍ: middleware errorHandler en app.ts captura todo
```

## Validación con Zod

```typescript
// Schema en el archivo .schema.ts del módulo
export const createTransactionSchema = z.object({
  amount: z.number().int().positive(),   // centavos, entero positivo
  type: z.enum(['income', 'expense', 'transfer']),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  date: z.string().datetime(),
});

export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
```

## Datos Monetarios

```
REGLA: Todos los montos se almacenan en CENTAVOS (integer)

$10.50 USD → almacenar como 1050
$1,234.99 → almacenar como 123499

Para mostrar: amount / 100
Para guardar: Math.round(inputAmount * 100)

NUNCA usar float para dinero (errores de precisión)
```

## Variables de Entorno

```
# BIEN: acceder via objeto de configuración tipado
import { config } from '@/shared/config';
const port = config.server.port;

# MAL: process.env directo disperso por el código
const port = process.env.PORT;  // ❌
```

## Commits (Conventional Commits)

```
feat: agregar filtro por categoría en transacciones
fix: corregir cálculo de balance en transferencias
docs: actualizar ARCHITECTURE.md con módulo de reportes
refactor: extraer lógica de Stripe a subscription.service
test: agregar tests de integración para auth module
chore: actualizar dependencias de seguridad
```
