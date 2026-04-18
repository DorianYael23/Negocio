"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Receipt, Calendar, Search, User, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Movimiento {
  id: number;
  monto: number;
  tipo_movimiento: string;
  created_at: string;
  descripcion: string | null;
  clientes: {
    nombre: string;
  } | null;
  productos: {
    nombre: string;
  } | null;
}

export default function HistorialPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const fetchMovimientos = async () => {
      // MAGIA 1: Le quitamos el filtro de "abono" y le pedimos que también traiga el nombre del producto
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
          ),
          productos (
            nombre
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al obtener movimientos:", error);
      } else if (data) {
        const movimientosFormateados: Movimiento[] = data.map((mov: any) => ({
          ...mov,
          clientes: Array.isArray(mov.clientes) ? mov.clientes[0] || null : mov.clientes,
          productos: Array.isArray(mov.productos) ? mov.productos[0] || null : mov.productos,
        }));
        setMovimientos(movimientosFormateados);
      }
      setCargando(false);
    };

    fetchMovimientos();
  }, []);

  const clientesAgrupados = useMemo(() => {
    const filtrados = movimientos.filter((mov) =>
      (mov.clientes?.nombre || "Desconocido")
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );

    const grupos = filtrados.reduce((acc, mov) => {
      const nombre = mov.clientes?.nombre || "Cliente desconocido";
      
      if (!acc[nombre]) {
        acc[nombre] = { totalAbonos: 0, totalCompras: 0, lista: [] };
      }
      
      acc[nombre].lista.push(mov);
      
      // MAGIA 2: Separamos la suma de lo que abona y lo que compra
      if (mov.tipo_movimiento === "abono") {
        acc[nombre].totalAbonos += mov.monto;
      } else {
        acc[nombre].totalCompras += mov.monto;
      }
      return acc;
    }, {} as Record<string, { totalAbonos: number; totalCompras: number; lista: Movimiento[] }>);

    return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0]));
  }, [movimientos, busqueda]);

  return (
    <div className="min-h-screen bg-slate-50 p-5 pb-24">
      <h1 className="text-2xl font-bold mb-4 text-slate-800">Historial de Movimientos</h1>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          className="pl-10 h-12 rounded-xl bg-white border-slate-200 shadow-sm text-base"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {cargando ? (
          <div className="text-center py-10 animate-pulse text-muted-foreground">
            Cargando historial...
          </div>
        ) : clientesAgrupados.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-muted-foreground">No hay movimientos registrados.</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {clientesAgrupados.map(([nombreCliente, datos], index) => (
              <AccordionItem
                value={`item-${index}`}
                key={nombreCliente}
                className="bg-white border border-slate-200 rounded-xl px-4 shadow-sm"
              >
                {/* Cabecera del Acordeón */}
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex justify-between items-center w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-full border border-blue-100">
                        <User className="text-blue-600 size-5" />
                      </div>
                      <span className="font-bold text-slate-700 capitalize text-left">
                        {nombreCliente}
                      </span>
                    </div>
                    {/* Resumen de totales */}
                    <div className="text-right flex gap-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold">Comprado</span>
                        <span className="font-bold text-blue-600">
                          ${datos.totalCompras.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold">Abonado</span>
                        <span className="font-bold text-green-600">
                          ${datos.totalAbonos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                {/* Contenido del Acordeón (La lista de sus pagos y compras) */}
                <AccordionContent className="pt-2 pb-4 space-y-2 border-t border-slate-100 mt-2">
                  {datos.lista.map((mov) => {
                    const esAbono = mov.tipo_movimiento === "abono";
                    
                    return (
                      <div
                        key={mov.id}
                        className={`flex justify-between items-center p-3 rounded-lg border ${
                          esAbono ? "bg-green-50/50 border-green-100" : "bg-blue-50/50 border-blue-100"
                        }`}
                      >
                        <div className="flex gap-3 items-center">
                          {esAbono ? (
                            <Receipt className="text-green-500 size-4" />
                          ) : (
                            <ShoppingCart className="text-blue-500 size-4" />
                          )}
                          
                          <div>
                            <p className="text-xs text-slate-600 capitalize font-medium">
                              {format(new Date(mov.created_at), "d 'de' MMMM, h:mm a", { locale: es })}
                            </p>
                            <p className={`text-[10px] uppercase mt-0.5 font-bold ${
                              esAbono ? "text-green-600/70" : "text-blue-600/80"
                            }`}>
                              {esAbono 
                                ? "Abono a cuenta" 
                                : `Compra: ${mov.productos?.nombre || mov.descripcion?.replace('Venta: ', '') || 'Producto'}`
                              }
                            </p>
                          </div>
                        </div>
                        <p className={`font-black ${esAbono ? "text-green-600" : "text-blue-600"}`}>
                          {esAbono ? "+" : ""}${mov.monto}
                        </p>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}