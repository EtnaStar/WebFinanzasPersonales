# Frontend — React + TypeScript + Tailwind CSS

## Setup
- **Bundler:** Vite
- **Estilos:** Tailwind CSS + shadcn/ui (componentes base)
- **Estado global:** Zustand
- **Server state / caché:** TanStack Query (React Query)
- **Formularios:** React Hook Form + Zod
- **Routing:** React Router v6
- **Iconos:** Lucide React
- **Gráficas:** Recharts

## Estructura de Carpetas

```
frontend/src/
├── components/
│   ├── ui/              # Componentes base (Button, Input, Modal, Card)
│   ├── layout/          # Header, Sidebar, PageLayout
│   └── features/        # Componentes por feature
│       ├── transactions/
│       ├── accounts/
│       ├── budgets/
│       ├── reports/
│       └── subscriptions/
├── pages/               # Una carpeta por ruta principal
│   ├── Dashboard/
│   ├── Transactions/
│   ├── Accounts/
│   ├── Budgets/
│   ├── Reports/
│   └── Settings/
├── hooks/               # Custom hooks globales
├── services/            # Clientes API (axios/fetch por módulo)
│   ├── api.client.ts    # Instancia base con interceptors
│   ├── auth.service.ts
│   ├── transactions.service.ts
│   └── ...
├── store/               # Zustand stores
│   ├── auth.store.ts
│   └── ui.store.ts
├── types/               # Tipos compartidos frontend
│   ├── api.types.ts     # Tipos de respuesta API
│   └── domain.types.ts  # Tipos de negocio
└── utils/
    ├── currency.ts      # Formatear centavos a display
    ├── date.ts          # Helpers de fechas
    └── cn.ts            # Utility para classnames (tailwind-merge)
```

## Componentes UI

### Principio de Composición
```typescript
// BIEN: componentes pequeños y componibles
<TransactionList>
  <TransactionList.Header title="Enero 2025" />
  <TransactionList.Item transaction={tx} />
  <TransactionList.Empty />
</TransactionList>

// MAL: componente monolítico con 50 props
<TransactionList showHeader title="..." emptyMessage="..." ... />
```

### Tailwind CSS — Convenciones
```typescript
// BIEN: usar cn() para combinar clases condicionalmente
import { cn } from '@/utils/cn';

function Badge({ variant, className }: BadgeProps) {
  return (
    <span className={cn(
      'rounded-full px-2 py-1 text-xs font-medium',
      variant === 'income' && 'bg-green-100 text-green-800',
      variant === 'expense' && 'bg-red-100 text-red-800',
      className
    )}>
      ...
    </span>
  );
}

// Paleta de colores del proyecto (definida en tailwind.config.ts)
// primary: azul corporativo
// success: verde para ingresos
// danger: rojo para gastos
// warning: amarillo para alertas de presupuesto
```

## Estado y Data Fetching

### TanStack Query para datos del servidor
```typescript
// hooks/useTransactions.ts
export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionService.getAll(filters),
    staleTime: 1000 * 60 * 2,  // 2 minutos
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transactionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

### Zustand para estado de UI global
```typescript
// store/ui.store.ts
interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
```

## Formularios
```typescript
// React Hook Form + Zod
const createTransactionSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  type: z.enum(['income', 'expense', 'transfer']),
  date: z.string(),
  description: z.string().optional(),
});

function CreateTransactionForm({ onSuccess }: Props) {
  const form = useForm<z.infer<typeof createTransactionSchema>>({
    resolver: zodResolver(createTransactionSchema),
  });
  const { mutate, isPending } = useCreateTransaction();

  function onSubmit(data: z.infer<typeof createTransactionSchema>) {
    // Convertir a centavos antes de enviar
    mutate({ ...data, amountCents: Math.round(data.amount * 100) });
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

## Servicios API
```typescript
// services/api.client.ts — instancia base
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Interceptor: agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: refresh token automático en 401
api.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401) {
    await authStore.getState().refreshToken();
    return api.request(error.config);
  }
  return Promise.reject(error);
});

// services/transactions.service.ts
export const transactionService = {
  getAll: (filters: TransactionFilters) =>
    api.get<ApiResponse<Transaction[]>>('/transactions', { params: filters }).then(r => r.data),
  create: (dto: CreateTransactionDto) =>
    api.post<ApiResponse<Transaction>>('/transactions', dto).then(r => r.data),
};
```

## Utilidades de Moneda
```typescript
// utils/currency.ts
export function formatCurrency(cents: number, currency = 'USD', locale = 'es-MX'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

// Uso:
formatCurrency(150000) // → "$1,500.00"
formatCurrency(150000, 'MXN') // → "$1,500.00 MXN"
```

## Variables de Entorno
```env
# frontend/.env.example
VITE_API_URL=http://localhost:3001/api/v1
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```
