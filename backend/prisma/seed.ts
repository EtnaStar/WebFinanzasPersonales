import 'dotenv/config';
import { PrismaClient, TipoMovimiento } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando datos existentes...');
  await prisma.movimiento.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creando usuario de demo: Valentina...');
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const valentina = await prisma.user.create({
    data: {
      email: 'valentina@demo.com',
      passwordHash,
      nombre: 'Valentina García',
      meta: 'Ahorrar para un viaje a Europa en diciembre 2026',
    },
  });

  const hoy = new Date();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();

  const movimientos: Array<{
    userId: string;
    fecha: Date;
    tipo: TipoMovimiento;
    categoria: string;
    monto: Decimal;
    descripcion: string;
  }> = [
    // Ingresos
    { userId: valentina.id, fecha: new Date(anio, mes, 1), tipo: 'ingreso', categoria: 'Salario', monto: new Decimal('18000.00'), descripcion: 'Salario mensual empresa' },
    { userId: valentina.id, fecha: new Date(anio, mes, 5), tipo: 'ingreso', categoria: 'Freelance', monto: new Decimal('3500.00'), descripcion: 'Proyecto diseño web cliente' },
    { userId: valentina.id, fecha: new Date(anio, mes, 15), tipo: 'ingreso', categoria: 'Freelance', monto: new Decimal('2000.00'), descripcion: 'Consultoría marketing digital' },

    // Gastos
    { userId: valentina.id, fecha: new Date(anio, mes, 2), tipo: 'gasto', categoria: 'Vivienda', monto: new Decimal('5500.00'), descripcion: 'Renta departamento' },
    { userId: valentina.id, fecha: new Date(anio, mes, 3), tipo: 'gasto', categoria: 'Alimentación', monto: new Decimal('2200.00'), descripcion: 'Supermercado quincena' },
    { userId: valentina.id, fecha: new Date(anio, mes, 7), tipo: 'gasto', categoria: 'Transporte', monto: new Decimal('800.00'), descripcion: 'Gasolina y Uber' },
    { userId: valentina.id, fecha: new Date(anio, mes, 9), tipo: 'gasto', categoria: 'Entretenimiento', monto: new Decimal('1200.00'), descripcion: 'Cenas y salidas del fin de semana' },
    { userId: valentina.id, fecha: new Date(anio, mes, 10), tipo: 'gasto', categoria: 'Servicios', monto: new Decimal('650.00'), descripcion: 'Internet, luz y agua' },
    { userId: valentina.id, fecha: new Date(anio, mes, 12), tipo: 'gasto', categoria: 'Salud', monto: new Decimal('450.00'), descripcion: 'Consulta médica y medicamentos' },
    { userId: valentina.id, fecha: new Date(anio, mes, 14), tipo: 'gasto', categoria: 'Alimentación', monto: new Decimal('1800.00'), descripcion: 'Supermercado segunda quincena' },
    { userId: valentina.id, fecha: new Date(anio, mes, 18), tipo: 'gasto', categoria: 'Ropa', monto: new Decimal('900.00'), descripcion: 'Ropa de trabajo' },
    { userId: valentina.id, fecha: new Date(anio, mes, 20), tipo: 'gasto', categoria: 'Educación', monto: new Decimal('500.00'), descripcion: 'Curso online de inglés' },

    // Pagos de deuda
    { userId: valentina.id, fecha: new Date(anio, mes, 4), tipo: 'pago_deuda', categoria: 'Tarjeta de crédito', monto: new Decimal('2000.00'), descripcion: 'Pago mínimo Visa' },
    { userId: valentina.id, fecha: new Date(anio, mes, 16), tipo: 'pago_deuda', categoria: 'Préstamo personal', monto: new Decimal('1500.00'), descripcion: 'Abono préstamo banco' },
  ];

  await prisma.movimiento.createMany({ data: movimientos });

  console.log('✓ Seed completado');
  console.log('Usuario demo creado:');
  console.log('  Email:    valentina@demo.com');
  console.log('  Password: demo1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
