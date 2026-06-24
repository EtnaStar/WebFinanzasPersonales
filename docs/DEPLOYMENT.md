# Despliegue

## Ambientes

| Ambiente | URL | Rama |
|----------|-----|------|
| Development | localhost | cualquier rama local |
| Staging | staging.tudominio.com | `develop` |
| Production | tudominio.com | `main` |

## Opciones de Hosting (Recomendadas)

### Opción A — Railway (más simple para empezar)
- Backend Node.js + PostgreSQL + Redis en un solo proveedor
- Deploy automático desde GitHub
- ~$5-20/mes según uso

### Opción B — Vercel + Railway
- Frontend en Vercel (gratis, CDN global)
- Backend + DB en Railway
- Mejor separación y performance de frontend

### Opción C — AWS/GCP (escala enterprise)
- ECS/Cloud Run para backend
- RDS para PostgreSQL
- ElastiCache para Redis
- CloudFront/CDN para frontend

## Variables de Entorno por Ambiente

Cada ambiente tiene su propio set de variables. NUNCA compartir secrets entre ambientes.

```
.env.development   → desarrollo local (en .gitignore)
.env.staging       → staging (en CI/CD secrets)
.env.production    → producción (en CI/CD secrets)
```

## Checklist Pre-Deploy a Producción

### Código
- [ ] Tests pasando (`npm test`)
- [ ] TypeScript sin errores (`npm run typecheck`)
- [ ] Sin `console.log` de debug
- [ ] Variables de entorno de prod configuradas

### Base de Datos
- [ ] Migrations corridas (`npx prisma migrate deploy`)
- [ ] Backup antes de migrations destructivas
- [ ] Índices verificados en tablas grandes

### Seguridad
- [ ] `JWT_SECRET` es string aleatorio de 64+ chars
- [ ] `STRIPE_SECRET_KEY` es `sk_live_...` (no `sk_test_`)
- [ ] CORS configurado solo para dominio de producción
- [ ] Rate limiting activo
- [ ] HTTPS configurado

### Stripe
- [ ] Webhook endpoint registrado en Stripe Dashboard (producción)
- [ ] `STRIPE_WEBHOOK_SECRET` actualizado con el de producción

## CI/CD con GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - run: npm run typecheck

  deploy-backend:
    needs: test
    # deploy a Railway / tu proveedor
    ...

  deploy-frontend:
    needs: test
    # deploy a Vercel
    ...
```
