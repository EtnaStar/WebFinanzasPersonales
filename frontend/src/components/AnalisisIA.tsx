import { useState } from 'react';
import api from '../api/client';

interface Props {
  mes: string;
}

export default function AnalisisIA({ mes }: Props) {
  const [analisis, setAnalisis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mostrar, setMostrar] = useState(false);

  async function analizar() {
    setError('');
    setLoading(true);
    setMostrar(true);
    try {
      const { data } = await api.post('/analisis/mes', { mes });
      setAnalisis(data.analisis);
    } catch {
      setError('El servicio de análisis no está disponible en este momento. Verifica que tu ANTHROPIC_API_KEY esté configurada.');
      setMostrar(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={analizar}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⚙️</span> Analizando con IA...
          </>
        ) : (
          <>✨ Analizar mi mes con IA</>
        )}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      {mostrar && !loading && analisis && (
        <div className="mt-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-purple-600 font-semibold text-sm">✨ Análisis de Claude</span>
          </div>
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{analisis}</div>
        </div>
      )}
    </div>
  );
}
