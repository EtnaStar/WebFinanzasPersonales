import { useState, useEffect, useCallback } from 'react';
import Dashboard from '../components/Dashboard';
import MovimientoForm from '../components/MovimientoForm';
import MovimientoList from '../components/MovimientoList';
import AnalisisIA from '../components/AnalisisIA';
import { useMovimientos, Movimiento } from '../hooks/useMovimientos';

export default function Home() {
  const user = JSON.parse(localStorage.getItem('user') ?? '{}') as { nombre?: string; email?: string };
  const mesActual = new Date().toISOString().slice(0, 7);
  const [mes] = useState(mesActual);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const { movimientos, meta, loading, cargar, eliminar } = useMovimientos();

  const cargarMovimientos = useCallback(() => {
    cargar(mes, filtroTipo, pagina);
  }, [cargar, mes, filtroTipo, pagina]);

  useEffect(() => { cargarMovimientos(); }, [cargarMovimientos]);

  function handleCreado(m: Movimiento) {
    setRefreshKey((k) => k + 1);
    cargar(mes, filtroTipo, pagina);
    console.log('Movimiento creado:', m);
  }

  function handleFiltro(tipo: string) {
    setFiltroTipo(tipo);
    setPagina(1);
  }

  function handleEliminar(id: string) {
    eliminar(id).then(() => setRefreshKey((k) => k + 1));
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  const mesLabel = new Date(mes + '-01').toLocaleString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">💰 Copiloto Financiero</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Hola, <strong>{user.nombre ?? user.email}</strong>
            </span>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Título del mes */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 capitalize">{mesLabel}</h2>
          <p className="text-gray-500 text-sm">Resumen financiero del mes</p>
        </div>

        {/* Dashboard de 4 cards */}
        <Dashboard mes={mes} refreshKey={refreshKey} />

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: form + análisis */}
          <div className="space-y-4">
            <MovimientoForm onCreado={handleCreado} />
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Análisis con IA</h2>
              <AnalisisIA mes={mes} />
            </div>
          </div>

          {/* Columna derecha: lista */}
          <div className="lg:col-span-2">
            <MovimientoList
              movimientos={movimientos}
              meta={meta}
              filtroTipo={filtroTipo}
              onFiltro={handleFiltro}
              onPagina={setPagina}
              onEliminar={handleEliminar}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
