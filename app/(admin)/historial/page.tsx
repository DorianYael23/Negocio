"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState, useMemo, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { Receipt, Search, User, ShoppingCart, Trash2, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

function HistorialContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteQuery = searchParams.get("cliente") || "";

  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState(clienteQuery);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [movimientoAEliminar, setMovimientoAEliminar] = useState<any | null>(null);

  useEffect(() => {
    if (clienteQuery) setBusqueda(clienteQuery);
  }, [clienteQuery]);

  const fetchMovimientos = async () => {
    const { data, error } = await supabase
      .from("movimientos")
      .select(`
        id, cliente_id, monto, tipo_movimiento, created_at, descripcion,
        clientes ( nombre ), productos ( nombre )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const movimientosFormateados = data.map((mov: any) => ({
        ...mov,
        clientes: Array.isArray(mov.clientes) ? mov.clientes[0] || null : mov.clientes,
        productos: Array.isArray(mov.productos) ? mov.productos[0] || null : mov.productos,
      }));
      setMovimientos(movimientosFormateados);
    }
    setCargando(false);
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const handleConfirmarEliminacion = async () => {
    if (!movimientoAEliminar) return;
    setProcesandoId(movimientoAEliminar.id);
    try {
      const { data: cliente, error } = await supabase.from("clientes").select("saldo_pendiente").eq("id", movimientoAEliminar.cliente_id).single();
      if (error || !cliente) throw new Error("No se encontró el cliente");

      let nuevoSaldo = cliente.saldo_pendiente;
      if (movimientoAEliminar.tipo_movimiento === "abono") nuevoSaldo += movimientoAEliminar.monto;
      else nuevoSaldo -= movimientoAEliminar.monto;
      
      await supabase.from("clientes").update({ saldo_pendiente: nuevoSaldo }).eq("id", movimientoAEliminar.cliente_id);
      await supabase.from("movimientos").delete().eq("id", movimientoAEliminar.id);
      
      toast.success("Movimiento eliminado y saldo actualizado");
      setMovimientoAEliminar(null);
      fetchMovimientos();
    } catch (error) {
      toast.error("Error al eliminar");
    } finally {
      setProcesandoId(null);
    }
  };

  const clientesAgrupados = useMemo(() => {
    const filtrados = movimientos.filter((mov) =>
      (mov.clientes?.nombre || "Desconocido").toLowerCase().includes(busqueda.toLowerCase())
    );
    const grupos = filtrados.reduce((acc, mov) => {
      const nombre = mov.clientes?.nombre || "Cliente desconocido";
      if (!acc[nombre]) acc[nombre] = { totalAbonos: 0, totalCompras: 0, lista: [] };
      acc[nombre].lista.push(mov);
      if (mov.tipo_movimiento === "abono") acc[nombre].totalAbonos += mov.monto;
      else acc[nombre].totalCompras += mov.monto;
      return acc;
    }, {} as any);
    return Object.entries(grupos).sort((a: any, b: any) => a[0].localeCompare(b[0]));
  }, [movimientos, busqueda]);

  return (
    <div className="min-h-screen bg-slate-50 p-5 pb-24">
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-10 h-12 rounded-xl bg-white border-slate-200 shadow-sm" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>

        {/* EL BOTÓN AHORA ES MÁS INTELIGENTE */}
        {busqueda && (
          <Button 
            variant="outline" 
            onClick={() => router.push(`/clientes?cliente=${encodeURIComponent(busqueda)}`)}
            className="w-full h-11 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold rounded-xl"
          >
            <ArrowLeft className="mr-2 size-4" /> 
            Volver a la cuenta de {busqueda}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {cargando ? (
          <div className="text-center py-10 text-muted-foreground animate-pulse">Cargando...</div>
        ) : (
          <Accordion type="multiple" className="space-y-3" defaultValue={clienteQuery ? ["item-0"] : []}>
            {clientesAgrupados.map(([nombreCliente, datos]: any, index: number) => (
              <AccordionItem value={`item-${index}`} key={nombreCliente} className="bg-white border border-slate-200 rounded-xl px-4 shadow-sm">
                <AccordionTrigger className="hover:no-underline py-4">
                   <div className="flex justify-between items-center w-full pr-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="bg-blue-50 p-2 rounded-full border border-blue-100 shrink-0"><User className="text-blue-600 size-5" /></div>
                      <span className="font-bold text-slate-700 capitalize leading-tight">{nombreCliente}</span>
                    </div>
                    <div className="text-right flex gap-3 shrink-0">
                      <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">Compras</span><span className="font-bold text-blue-600">${datos.totalCompras}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">Abonos</span><span className="font-bold text-green-600">${datos.totalAbonos}</span></div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 space-y-2 border-t border-slate-100 mt-2">
                  {datos.lista.map((mov: any) => (
                    <div key={mov.id} className={`flex justify-between items-center p-2 pl-3 rounded-lg border ${mov.tipo_movimiento === "abono" ? "bg-green-50/50 border-green-100" : "bg-blue-50/50 border-blue-100"}`}>
                      <div className="flex gap-3 items-center overflow-hidden flex-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-500 font-medium">{format(new Date(mov.created_at), "d MMM, h:mm a", { locale: es })}</p>
                          <p className="text-[10px] uppercase font-bold truncate">{mov.tipo_movimiento === "abono" ? "Abono a cuenta" : `Compra: ${mov.productos?.nombre || mov.descripcion?.replace('Venta: ', '') || 'Producto'}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className={`font-black ${mov.tipo_movimiento === "abono" ? "text-green-600" : "text-blue-600"}`}>{mov.tipo_movimiento === "abono" ? "+" : ""}${mov.monto}</p>
                        <Button variant="ghost" size="icon" className="size-8 text-red-400 hover:text-red-600" onClick={() => setMovimientoAEliminar(mov)} disabled={procesandoId === mov.id}>
                          {procesandoId === mov.id ? <Loader2 className="animate-spin size-4" /> : <Trash2 className="size-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <Drawer open={!!movimientoAEliminar} onOpenChange={(open) => !open && setMovimientoAEliminar(null)}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm p-6 text-center">
            <div className="mx-auto bg-red-100 w-16 h-16 flex items-center justify-center rounded-full mb-4"><AlertTriangle className="size-8 text-red-600" /></div>
            <DrawerTitle className="text-2xl font-black">¿Anular Movimiento?</DrawerTitle>
            <DrawerDescription className="text-base mt-2">
              Se borrará el registro de <span className="font-bold text-slate-800">${movimientoAEliminar?.monto}</span> y se recalculará la deuda de <span className="font-bold text-slate-800">{movimientoAEliminar?.clientes?.nombre}</span>.
            </DrawerDescription>
            <div className="mt-6 space-y-3">
              <Button onClick={handleConfirmarEliminacion} className="w-full h-14 text-lg bg-red-600 hover:bg-red-700 font-bold rounded-xl text-white">Sí, Anular</Button>
              <DrawerClose asChild><Button variant="outline" className="w-full h-14 text-lg font-bold rounded-xl text-slate-600">Cancelar</Button></DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default function HistorialPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
      <HistorialContent />
    </Suspense>
  );
}