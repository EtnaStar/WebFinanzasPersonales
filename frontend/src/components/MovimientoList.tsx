import { Movimiento } from '../hooks/useMovimientos';

interface Props {
  movimientos: Movimiento[];
  meta: { total: number; page: number; totalPages: number };
  filtroTipo: string;
  onFiltro: (tipo: string) => void;
  onPagina: (p: number) => void;
  onEliminar: (id: string) => void;
  loading: boolean;
}

const tipoConfig = {
  ingreso:    { color: 'text-green-600', bg: 'bg-green-50', label: 'Ingreso', signo: '+' },
  gasto:      { color: 'text-red-600',   bg: 'bg-red-50',   label: 'Gasto',   signo: '-' },
  pago_deuda: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Deuda',  signo: '-' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function formatMonto(m: string) {
  return parseFloat(m).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function MovimientoList({ movimientos, meta, filtroTipo, onFiltro, onPagina, onEliminar, loading }: Props) {
  const filtros = [
    { value: 'todos', label: 'Todos' },
    { value: 'ingreso', label: '💵 Ingresos' },
    { value: 'gasto', label: '💸 Gastos' },
    { value: 'pago_deuda', label: '🔴 Deudas' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Movimientos del mes</h2>
          <span className="text-sm text-gray-500">{meta.total} registros</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {filtros.map((f) => (
            <button
              key={f.value}
              onClick={() => onFiltro(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtroTipo === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Cargando...</div>
      ) : movimientos.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p>No hay movimientos registrados</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {movimientos.map((m) => {
            const cfg = tipoConfig[m.tipo];
            return (
              <li key={m.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 group">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {m.categoria}
                  </span>
                  <div>
                    <p className="text-sm text-gray-700">{m.descripcion || m.categoria}</p>
                    <p className="text-xs text-gray-400">{formatDate(m.fecha)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold text-sm ${cfg.color}`}>
                    {cfg.signo}{formatMonto(m.monto)}
                  </span>
                  <button
                    onClick={() => onEliminar(m.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-lg"
                    title="Eliminar"
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {meta.totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPagina(p)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                meta.page === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
