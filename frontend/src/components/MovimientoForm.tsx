import { useState, useEffect, FormEvent } from 'react';
import api from '../api/client';
import { Movimiento } from '../hooks/useMovimientos';

interface Props {
  onCreado: (m: Movimiento) => void;
}

type Tipo = 'ingreso' | 'gasto' | 'pago_deuda';

export default function MovimientoForm({ onCreado }: Props) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    tipo: 'gasto' as Tipo,
    categoria: '',
    monto: '',
    descripcion: '',
  });
  const [categorias, setCategorias] = useState<Record<Tipo, string[]>>({
    ingreso: [],
    gasto: [],
    pago_deuda: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/movimientos/categorias').then(({ data }) => setCategorias(data));
  }, []);

  useEffect(() => {
    setForm((f) => ({ ...f, categoria: '' }));
  }, [form.tipo]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.categoria) { setError('Selecciona una categoría'); return; }
    if (!form.monto || parseFloat(form.monto) <= 0) { setError('El monto debe ser mayor a 0'); return; }
    if (new Date(form.fecha) > new Date()) { setError('La fecha no puede ser futura'); return; }

    setLoading(true);
    try {
      const { data } = await api.post('/movimientos', { ...form, monto: parseFloat(form.monto) });
      onCreado(data.data);
      setForm({ fecha: new Date().toISOString().slice(0, 10), tipo: 'gasto', categoria: '', monto: '', descripcion: '' });
    } catch {
      setError('Error al guardar el movimiento');
    } finally {
      setLoading(false);
    }
  }

  const tipoLabels: Record<Tipo, string> = { ingreso: '💵 Ingreso', gasto: '💸 Gasto', pago_deuda: '🔴 Pago de deuda' };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Nuevo movimiento</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            name="fecha"
            value={form.fecha}
            onChange={handleChange}
            max={new Date().toISOString().slice(0, 10)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(Object.keys(tipoLabels) as Tipo[]).map((t) => (
              <option key={t} value={t}>{tipoLabels[t]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select
            name="categoria"
            value={form.categoria}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar...</option>
            {categorias[form.tipo]?.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
          <input
            type="number"
            name="monto"
            value={form.monto}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
        <input
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Ej: Supermercado, gasolina..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
      >
        {loading ? 'Guardando...' : '+ Agregar movimiento'}
      </button>
    </form>
  );
}
