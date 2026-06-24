import { useState, useCallback } from 'react';
import api from '../api/client';

export interface Movimiento {
  id: string;
  fecha: string;
  tipo: 'ingreso' | 'gasto' | 'pago_deuda';
  categoria: string;
  monto: string;
  descripcion?: string;
}

interface Meta { total: number; page: number; totalPages: number; }

export function useMovimientos() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async (mes: string, tipo?: string, page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { mes, page };
      if (tipo && tipo !== 'todos') params.tipo = tipo;
      const { data } = await api.get('/movimientos', { params });
      setMovimientos(data.data);
      setMeta(data.meta);
    } finally {
      setLoading(false);
    }
  }, []);

  const crear = useCallback(async (form: Omit<Movimiento, 'id'>) => {
    const { data } = await api.post('/movimientos', form);
    return data.data as Movimiento;
  }, []);

  const eliminar = useCallback(async (id: string) => {
    await api.delete(`/movimientos/${id}`);
    setMovimientos((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { movimientos, meta, loading, cargar, crear, eliminar };
}
