# Arquitectura del Sistema

## Visión General

Monolito modular que separa claramente Frontend, Backend y Base de Datos. Cada módulo del backend es independiente y puede extraerse a microservicio sin reescritura.

```
┌─────────────────────────────────────────┐
│              CLIENTE                    │
│   React + TypeScript + Tailwind CSS     │
│   (Vite, Zustand, React Query)          │
└──────────────┬──────────────────────────┘
               │ HTTPS / REST API
               ▼
┌─────────────────────────────────────────┐
│              BACKEND                    │
│        Node.js + Express                │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │   auth   │  │ accounts │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │  trans-  │  │ budgets  │            │
│  │ actions  │  │          │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │  subs-   │  │ reports  │            │
│  │criptions │  │          │            │
│  └──────────┘  └──────────┘            │
│                                         │
│         Shared: middleware,             │
│         utils, DB client, Redis         │
└──────┬─────────────────┬───────────────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │
│  (datos      │  │  (sesiones,  │
│  financieros)│  │   caché)     │
└──────────────┘  └──────────────┘
```

## Módulos del Backend

| Módulo | Responsabilidad |
|--------|-----------------|
| `auth` | Registro, login, JWT, refresh tokens |
| `accounts` | Cuentas bancarias, tarjetas, efectivo |
| `transactions` | Ingresos, gastos, transferencias |
| `budgets` | Presupuestos y metas financieras |
| `subscriptions` | Planes, pagos con Stripe, webhooks |
| `reports` | Reportes, gráficas, exportación |

## Estructura Interna de un Módulo

```
modules/transactions/
├── transactions.router.ts      # Definición de rutas Express
├── transactions.controller.ts  # Recibe request, llama service, responde
├── transactions.service.ts     # Lógica de negocio
├── transactions.repository.ts  # Acceso a DB (Prisma)
├── transactions.schema.ts      # Validación Zod
└── transactions.types.ts       # Interfaces TypeScript del módulo
```

## Flujo de una Request

```
Request HTTP
    │
    ▼
Middleware global (auth, rate-limit, logging)
    │
    ▼
Router (transactions.router.ts)
    │
    ▼
Controller — valida con Zod, extrae datos
    │
    ▼
Service — lógica de negocio, reglas, cálculos
    │
    ▼
Repository — queries Prisma a PostgreSQL
    │
    ▼
Response JSON
```

## Modelo de Suscripción

```
Usuario
  │
  ├── Plan FREE     → funciones básicas de finanzas personales
  ├── Plan PERSONAL → finanzas personales completas + reportes
  ├── Plan BUSINESS → finanzas de negocio + múltiples cuentas
  └── Plan ADVISOR  → acceso a asesorías con experto
```

Stripe maneja:
- Creación y cobro de suscripciones
- Webhooks para activar/desactivar features por plan
- Portal del cliente para gestionar pagos

## Estrategia de Caché con Redis

| Dato | TTL | Razón |
|------|-----|-------|
| Sesión JWT refresh | 7 días | Revocación de tokens |
| Dashboard summary | 5 min | Query costosa |
| Tipos de cambio | 1 hora | API externa |
| Rate limit counters | 15 min | Protección auth |

## Consideraciones de Escalabilidad

El monolito modular permite:
1. Escalar horizontalmente todo junto inicialmente
2. Extraer módulos de alta carga (ej: `reports`) a microservicios sin tocar los demás
3. Agregar una API Gateway (Kong, AWS API Gateway) sin cambiar el código de módulos
