# WebFinanzasPersonales

Aplicación web de finanzas personales y de negocio con modelo de suscripción para asesorías financieras.

## Stack
- **Frontend:** React 18 + TypeScript + Tailwind CSS (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Base de Datos:** PostgreSQL + Redis
- **Pagos:** Stripe
- **ORM:** Prisma

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Visión general del sistema, módulos y flujos |
| [CONVENTIONS.md](docs/CONVENTIONS.md) | Convenciones de código (naming, TypeScript, Git) |
| [DATABASE.md](docs/DATABASE.md) | Schema PostgreSQL, Redis, migraciones |
| [FRONTEND.md](docs/FRONTEND.md) | React, Tailwind, estado, servicios API |
| [BACKEND.md](docs/BACKEND.md) | Express, módulos, autenticación, errores |
| [API.md](docs/API.md) | Endpoints REST, formatos de respuesta |
| [STRIPE.md](docs/STRIPE.md) | Planes, suscripciones, webhooks |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Ambientes, CI/CD, checklist de deploy |

## Planes de Suscripción
| Plan | Precio | Incluye |
|------|--------|---------|
| FREE | $0/mes | 2 cuentas, 50 transacciones/mes |
| PERSONAL | $9.99/mes | Ilimitado + reportes + exportación |
| BUSINESS | $24.99/mes | Multi-empresa + reportes avanzados |
| ADVISOR | $49.99/mes | Todo + asesorías financieras humanas |
