import { useEffect, useState } from 'react';
import api from '../api/client';

interface Resumen {
  mes: string;
  totalIngresos: number;
  totalGastos: number;
  totalDeudas: number;
  saldoNeto: number;
}

interface Props {
  mes: string;
  refreshKey: number;
}

function formatMXN(n: number) {
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function Dashboard({ mes, refreshKey }: Props) {
  const [resumen, setResumen] = useState<Resumen | null>(null);

  useEffect(() => {
    api.get('/dashboard/resumen', { params: { mes } }).then(({ data }) => setResumen(data));
  }, [mes, refreshKey]);

  if (!resumen) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />)}
  </div>;

  const saldoPositivo = resumen.saldoNeto >= 0;
  const saldoColor = resumen.saldoNeto > 0 ? 'text-green-600' : resumen.saldoNeto === 0 ? 'text-yellow-500' : 'text-red-600';
  const saldoBg = resumen.saldoNeto > 0 ? 'bg-green-50' : resumen.saldoNeto === 0 ? 'bg-yellow-50' : 'bg-red-50';

  const cards = [
    { label: 'Ingresos', value: resumen.totalIngresos, icon: '💵', color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Gastos', value: resumen.totalGastos, icon: '💸', color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pago deudas', value: resumen.totalDeudas, icon: '🔴', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Saldo neto', value: resumen.saldoNeto, icon: saldoPositivo ? '✅' : '⚠️', color: saldoColor, bg: saldoBg },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`${c.bg} rounded-xl p-4`}>
          <div className="text-2xl mb-1">{c.icon}</div>
          <p className="text-xs text-gray-500 font-medium">{c.label}</p>
          <p className={`text-lg font-bold mt-1 ${c.color}`}>{formatMXN(c.value)}</p>
        </div>
      ))}
    </div>
  );
}
