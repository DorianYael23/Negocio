"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Receipt, Calendar } from "lucide-react";

interface Movimiento {
  id: number;
  monto: number;
  tipo_movimiento: string;
  created_at: string;
  descripcion: string | null;
  clientes: {
    nombre: string;
  } | null;
}

export default function HistorialPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchMovimientos = async () => {
      const { data, error } = await supabase
        .from("movimientos")
        .select(`
          id,
          monto,
          tipo_movimiento,
          created_at,
          descripcion,
          clientes (
            nombre
          )
        `)
        .eq("tipo_movimiento", "abono")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al obtener movimientos:", error);
      } else if (data) {
        const movimientosFormateados: Movimiento[] = data.map((mov: any) => ({
          ...mov,
          clientes: Array.isArray(mov.clientes)
            ? mov.clientes[0] || null
            : mov.clientes,
        }));

        console.log(movimientosFormateados);
        setMovimientos(movimientosFormateados);
      }

      setCargando(false);
    };

    fetchMovimientos();
  }, []);

  return (
    <div className="min-h-screen bg-background p-5 pb-20">
      <h1 className="text-2xl font-bold mb-6">Registro de Abonos</h1>

      <div className="space-y-4">
        {cargando ? (
          <p>Cargando historial...</p>
        ) : movimientos.length === 0 ? (
          <p>No hay abonos registrados.</p>
        ) : (
          movimientos.map((mov) => (
            <div
              key={mov.id}
              className="bg-card p-4 rounded-xl border shadow-sm flex justify-between items-center"
            >
              <div className="flex gap-3 items-center">
                <div className="bg-green-100 p-2 rounded-full">
                  <Receipt className="text-green-600 size-5" />
                </div>

                <div>
                  <p className="font-bold text-foreground capitalize">
                    {mov.clientes?.nombre || "Cliente desconocido"}
                  </p>

                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Calendar className="size-3" />
                    {format(
                      new Date(mov.created_at),
                      "d 'de' MMMM, h:mm a",
                      { locale: es }
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="font-black text-green-600">
                  +$ {mov.monto}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase">
                  {mov.descripcion || "Sin descripción"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}