# WebFinanzasPersonales — Claude Code Configuration

## Visión del Proyecto
Aplicación web de finanzas personales y de negocio con modelo de suscripción para asesorías financieras. Arquitectura monolito modular lista para escalar a microservicios.

## Stack Tecnológico
- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js + Express + TypeScript
- **Base de Datos:** PostgreSQL (datos) + Redis (sesiones/caché)
- **Pagos:** Stripe (suscripciones)
- **ORM:** Prisma
- **Auth:** JWT + refresh tokens en Redis

## Estructura del Proyecto
```
WebFinanzasPersonales/
├── frontend/          # React + TypeScript + Tailwind
│   └── src/
│       ├── components/    # Componentes reutilizables
│       ├── pages/         # Una carpeta por ruta
│       ├── hooks/         # Custom hooks
│       ├── services/      # Llamadas a la API
│       ├── store/         # Estado global (Zustand)
│       ├── types/         # Interfaces y tipos TS
│       └── utils/         # Helpers puros
├── backend/           # Node.js + Express + TypeScript
│   └── src/
│       ├── modules/       # Un módulo por dominio de negocio
│       │   ├── auth/
│       │   ├── accounts/
│       │   ├── transactions/
│       │   ├── budgets/
│       │   ├── subscriptions/
│       │   └── reports/
│       ├── shared/        # Código compartido entre módulos
│       │   ├── database/
│       │   ├── middleware/
│       │   ├── redis/
│       │   └── utils/
│       └── app.ts
├── database/
│   ├── migrations/
│   └── seeds/
└── docs/              # Documentación técnica
```

## Convenciones de Código

### TypeScript
- Siempre tipar explícitamente: nunca usar `any`
- Interfaces para objetos de dominio, `type` para uniones/utilidades
- Exports nombrados, no default exports (excepto páginas React)

### React
- Functional components únicamente, nunca class components
- Un componente por archivo
- Props tipadas con interface nombrada `ComponentNameProps`
- Custom hooks para lógica reutilizable (prefijo `use`)

### Backend / Express
- Arquitectura por módulos: cada módulo tiene `router`, `controller`, `service`, `repository`
- Controllers solo orquestan, no contienen lógica de negocio
- Toda lógica de negocio en Services
- Acceso a DB solo en Repositories

### Naming
- Archivos: `kebab-case.ts`
- Componentes React: `PascalCase.tsx`
- Variables/funciones: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Tablas DB: `snake_case` en plural (`transactions`, `user_accounts`)
- Endpoints API: `/api/v1/resource` en plural y kebab-case

### Base de Datos
- Migrations siempre, nunca modificar schema directamente en prod
- Soft delete: columna `deleted_at` en lugar de borrar registros financieros
- Todas las tablas con `id` (UUID), `created_at`, `updated_at`
- Datos monetarios en centavos (integer), nunca float

### Seguridad
- Variables de entorno en `.env`, nunca hardcoded
- Validar todo input con Zod en backend
- Rate limiting en todas las rutas de auth
- Nunca exponer stack traces en producción

## Comandos Frecuentes
```bash
# Frontend
cd frontend && npm run dev        # Servidor de desarrollo
cd frontend && npm run build      # Build producción
cd frontend && npm run typecheck  # Verificar tipos

# Backend
cd backend && npm run dev         # Servidor con hot reload
cd backend && npm run build       # Compilar TypeScript
cd backend && npm test            # Ejecutar tests

# Base de datos
cd backend && npx prisma migrate dev    # Correr migraciones
cd backend && npx prisma studio         # UI visual de la DB
cd backend && npx prisma db seed        # Cargar datos de prueba
```

## Variables de Entorno Requeridas
Ver `backend/.env.example` y `frontend/.env.example` para la lista completa.

## Reglas para Claude
- Seguir siempre la arquitectura de módulos del backend
- No saltarse la capa Repository para acceder a la DB
- Datos monetarios siempre en centavos (integer)
- Validar con Zod antes de cualquier operación de escritura
- Soft delete en entidades financieras (transactions, accounts)
- Al crear un endpoint nuevo, crear también su tipo en `frontend/src/types/`
