import { Router, Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const movimientosRouter = Router();

const CATEGORIAS = {
  ingreso: ['Salario', 'Freelance', 'Negocio', 'Inversiones', 'Regalo', 'Otro ingreso'],
  gasto: ['Alimentación', 'Transporte', 'Vivienda', 'Salud', 'Educación', 'Entretenimiento', 'Ropa', 'Servicios', 'Otro gasto'],
  pago_deuda: ['Tarjeta de crédito', 'Préstamo personal', 'Hipoteca', 'Préstamo auto', 'Otra deuda'],
};

movimientosRouter.get('/categorias', (_req, res) => {
  res.json(CATEGORIAS);
});

movimientosRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { mes, tipo, page = '1' } = req.query as Record<string, string>;
  const limit = 20;
  const offset = (parseInt(page) - 1) * limit;

  const where: Record<string, unknown> = { userId: req.userId };

  if (mes) {
    const [year, month] = mes.split('-').map(Number);
    where.fecha = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }

  if (tipo && ['ingreso', 'gasto', 'pago_deuda'].includes(tipo)) {
    where.tipo = tipo;
  }

  const [movimientos, total] = await Promise.all([
    prisma.movimiento.findMany({
      where,
      orderBy: { fecha: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.movimiento.count({ where }),
  ]);

  res.json({
    data: movimientos,
    meta: { total, page: parseInt(page), limit, totalPages: Math.ceil(total / limit) },
  });
});

movimientosRouter.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { fecha, tipo, categoria, monto, descripcion } = req.body;

  if (!fecha || !tipo || !categoria || !monto) {
    res.status(400).json({ error: 'Fecha, tipo, categoría y monto son requeridos' });
    return;
  }

  if (!['ingreso', 'gasto', 'pago_deuda'].includes(tipo)) {
    res.status(400).json({ error: 'Tipo inválido' });
    return;
  }

  if (new Decimal(monto).lte(0)) {
    res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    return;
  }

  const fechaDate = new Date(fecha);
  if (fechaDate > new Date()) {
    res.status(400).json({ error: 'La fecha no puede ser futura' });
    return;
  }

  const movimiento = await prisma.movimiento.create({
    data: {
      userId: req.userId!,
      fecha: fechaDate,
      tipo,
      categoria,
      monto: new Decimal(monto),
      descripcion,
    },
  });

  res.status(201).json({ data: movimiento });
});

movimientosRouter.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const movimiento = await prisma.movimiento.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });

  if (!movimiento) {
    res.status(404).json({ error: 'Movimiento no encontrado' });
    return;
  }

  await prisma.movimiento.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
