import { Router, Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const dashboardRouter = Router();

dashboardRouter.get('/resumen', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const mes = (req.query.mes as string) ?? new Date().toISOString().slice(0, 7);
  const [year, month] = mes.split('-').map(Number);

  const inicio = new Date(year, month - 1, 1);
  const fin = new Date(year, month, 1);

  const movimientos = await prisma.movimiento.findMany({
    where: { userId: req.userId, fecha: { gte: inicio, lt: fin } },
    select: { tipo: true, monto: true },
  });

  let totalIngresos = new Decimal(0);
  let totalGastos = new Decimal(0);
  let totalDeudas = new Decimal(0);

  for (const m of movimientos) {
    if (m.tipo === 'ingreso') totalIngresos = totalIngresos.add(m.monto);
    else if (m.tipo === 'gasto') totalGastos = totalGastos.add(m.monto);
    else if (m.tipo === 'pago_deuda') totalDeudas = totalDeudas.add(m.monto);
  }

  const saldoNeto = totalIngresos.sub(totalGastos).sub(totalDeudas);

  res.json({
    mes,
    totalIngresos: totalIngresos.toNumber(),
    totalGastos: totalGastos.toNumber(),
    totalDeudas: totalDeudas.toNumber(),
    saldoNeto: saldoNeto.toNumber(),
  });
});
