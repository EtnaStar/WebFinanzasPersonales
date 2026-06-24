import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { Decimal } from '@prisma/client/runtime/library';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const analisisRouter = Router();

analisisRouter.post('/mes', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const mes = (req.body.mes as string) ?? new Date().toISOString().slice(0, 7);
  const [year, month] = mes.split('-').map(Number);

  const inicio = new Date(year, month - 1, 1);
  const fin = new Date(year, month, 1);

  const [movimientos, user] = await Promise.all([
    prisma.movimiento.findMany({
      where: { userId: req.userId, fecha: { gte: inicio, lt: fin } },
      orderBy: { fecha: 'desc' },
    }),
    prisma.user.findUnique({ where: { id: req.userId } }),
  ]);

  if (movimientos.length === 0) {
    res.json({ analisis: 'No hay movimientos registrados en este mes para analizar.' });
    return;
  }

  let totalIngresos = new Decimal(0);
  let totalGastos = new Decimal(0);
  let totalDeudas = new Decimal(0);
  const porCategoria: Record<string, number> = {};

  for (const m of movimientos) {
    if (m.tipo === 'ingreso') totalIngresos = totalIngresos.add(m.monto);
    else if (m.tipo === 'gasto') {
      totalGastos = totalGastos.add(m.monto);
      porCategoria[m.categoria] = (porCategoria[m.categoria] ?? 0) + m.monto.toNumber();
    } else if (m.tipo === 'pago_deuda') totalDeudas = totalDeudas.add(m.monto);
  }

  const saldoNeto = totalIngresos.sub(totalGastos).sub(totalDeudas);
  const topCategorias = Object.entries(porCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, monto]) => `${cat}: $${monto.toFixed(2)}`)
    .join(', ');

  const prompt = `Eres un asesor financiero personal amigable y directo. Analiza la situación financiera de ${user?.nombre ?? 'el usuario'} para el mes ${mes}.

DATOS DEL MES:
- Total ingresos: $${totalIngresos.toFixed(2)}
- Total gastos: $${totalGastos.toFixed(2)}
- Pagos de deuda: $${totalDeudas.toFixed(2)}
- Saldo neto: $${saldoNeto.toFixed(2)}
- Categorías con más gasto: ${topCategorias || 'ninguna'}
- Total movimientos registrados: ${movimientos.length}
${user?.meta ? `- Meta financiera del usuario: ${user.meta}` : ''}

Proporciona:
1. Un diagnóstico breve y honesto de la situación (2-3 oraciones)
2. El punto más importante a mejorar
3. Una acción concreta que puede tomar esta semana

Sé directo, empático y usa lenguaje simple. No uses jerga financiera compleja.`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const texto = message.content[0].type === 'text' ? message.content[0].text : '';
    res.json({ analisis: texto });
  } catch (error) {
    console.error('Error llamando a Anthropic:', error);
    res.status(503).json({
      error: 'El servicio de análisis no está disponible en este momento. Por favor intenta más tarde.',
    });
  }
});
