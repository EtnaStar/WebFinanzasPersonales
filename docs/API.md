# Diseño de la API REST

## Base URL
```
Desarrollo:   http://localhost:3001/api/v1
Producción:   https://api.tudominio.com/api/v1
```

## Autenticación

Todos los endpoints (excepto `/auth/*`) requieren header:
```
Authorization: Bearer <access_token>
```

El access token expira en **15 minutos**. Usar el refresh token para renovar.

---

## Endpoints

### Auth
```
POST   /auth/register          Registrar usuario
POST   /auth/login             Login, retorna access + refresh token
POST   /auth/refresh           Renovar access token con refresh token
POST   /auth/logout            Revocar refresh token
POST   /auth/forgot-password   Solicitar reset de contraseña
POST   /auth/reset-password    Cambiar contraseña con token
```

### Cuentas
```
GET    /accounts               Listar cuentas del usuario
POST   /accounts               Crear cuenta
GET    /accounts/:id           Detalle de cuenta
PATCH  /accounts/:id           Actualizar cuenta
DELETE /accounts/:id           Desactivar cuenta (soft delete)
GET    /accounts/:id/balance   Balance actual calculado
```

### Transacciones
```
GET    /transactions           Listar (con filtros: date, type, accountId, categoryId)
POST   /transactions           Crear transacción
GET    /transactions/:id       Detalle
PATCH  /transactions/:id       Actualizar
DELETE /transactions/:id       Soft delete
GET    /transactions/export    Exportar CSV/PDF [BUSINESS+]
```

### Presupuestos
```
GET    /budgets                Listar presupuestos activos
POST   /budgets                Crear presupuesto
PATCH  /budgets/:id            Actualizar
DELETE /budgets/:id            Eliminar
GET    /budgets/status         Estado actual vs límite de cada presupuesto
```

### Categorías
```
GET    /categories             Listar (sistema + personalizadas del usuario)
POST   /categories             Crear categoría personalizada
PATCH  /categories/:id         Actualizar
DELETE /categories/:id         Eliminar (solo las propias)
```

### Reportes [PERSONAL+]
```
GET    /reports/summary        Resumen del período (ingresos, gastos, balance)
GET    /reports/by-category    Gastos agrupados por categoría
GET    /reports/cash-flow      Flujo de caja mensual
GET    /reports/net-worth      Patrimonio neto (suma de cuentas)
GET    /reports/trends         Tendencias por período [BUSINESS+]
```

### Suscripciones
```
GET    /subscriptions/plans    Listar planes disponibles y precios
GET    /subscriptions/me       Estado de suscripción del usuario
POST   /subscriptions/checkout Crear sesión de pago Stripe
POST   /subscriptions/portal   Portal Stripe para gestionar suscripción
POST   /subscriptions/webhook  Webhook de Stripe (público, sin auth JWT)
```

---

## Parámetros de Filtro (Transacciones)

```
GET /transactions?
  startDate=2025-01-01
  endDate=2025-01-31
  type=expense              (income | expense | transfer)
  accountId=uuid
  categoryId=uuid
  page=1
  limit=20
  orderBy=date              (date | amount)
  order=desc                (asc | desc)
  search=supermercado       (busca en description)
```

---

## Formatos de Respuesta

### Lista paginada
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### Recurso individual
```json
{
  "data": {
    "id": "uuid",
    "amountCents": 5000,
    "type": "EXPENSE",
    ...
  }
}
```

### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El monto debe ser positivo"
  }
}
```

---

## Códigos de Estado HTTP

| Código | Cuándo usarlo |
|--------|--------------|
| 200 | GET exitoso, PATCH exitoso |
| 201 | POST que crea un recurso |
| 204 | DELETE exitoso (sin body) |
| 400 | Request malformado |
| 401 | No autenticado (token inválido/expirado) |
| 403 | Autenticado pero sin permiso (plan insuficiente) |
| 404 | Recurso no encontrado |
| 422 | Validación fallida (datos inválidos) |
| 429 | Rate limit excedido |
| 500 | Error interno del servidor |

---

## Rate Limiting

| Endpoint | Límite |
|----------|--------|
| `POST /auth/login` | 10 intentos / 15 min por IP |
| `POST /auth/register` | 5 intentos / hora por IP |
| API en general | 100 requests / min por usuario |
