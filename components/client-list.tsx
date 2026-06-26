"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { ClientCard } from "@/components/client-card"
import { useOfflineClientes } from "@/hooks/useOfflineClientes"
import { Loader2, UserPlus, X, Users, Search, ChevronDown, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useSearchParams, useRouter } from "next/navigation"

function ClientListContent() {
  const searchParams = useSearchParams()
  const clienteQuery = searchParams.get("cliente") || ""

  const [searchQuery, setSearchQuery] = useState(clienteQuery)
  const [isNuevoClienteOpen, setIsNuevoClienteOpen] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [mostrarResumen, setMostrarResumen] = useState(false)
  const router = useRouter()

  const {
    clientes,
    cargando,
    isOnline,
    agregarCliente,
    registrarAbono,
    registrarVenta,
    eliminarCliente,
  } = useOfflineClientes()

  useEffect(() => {
    if (clienteQuery) setSearchQuery(clienteQuery)
  }, [clienteQuery])

  const handleAgregarCliente = async () => {
    if (!nuevoNombre.trim()) {
      toast.error("Por favor, ingresa el nombre del cliente")
      return
    }
    setIsPending(true)
    const nombreFinal = nuevoNombre.trim()
    const ok = await agregarCliente(nombreFinal)
    if (ok) {
      toast.success(`Cliente "${nombreFinal}" agregado${!isOnline ? " (se subirá al recuperar señal)" : ""}`)
      setSearchQuery(nombreFinal)
      setNuevoNombre("")
      setIsNuevoClienteOpen(false)
    } else {
      toast.error("Error al guardar el nuevo cliente")
    }
    setIsPending(false)
  }

  // Total general de deuda
  const totalDeudaGeneral = useMemo(() => {
    return clientes.reduce((acc, c) => (c.saldo_pendiente > 0 ? acc + c.saldo_pendiente : acc), 0)
  }, [clientes])

  // Filtrado y ordenamiento
  const clientesFiltrados = useMemo(() => {
    const filtrados = clientes.filter((c) =>
      (c.nombre || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    return filtrados.sort((a, b) => {
      const getPrioridad = (saldo: number) => {
        if (saldo > 0) return 3
        if (saldo < 0) return 2
        return 1
      }
      const pa = getPrioridad(a.saldo_pendiente)
      const pb = getPrioridad(b.saldo_pendiente)
      if (pa !== pb) return pb - pa
      if (pa === 3 && pb === 3 && b.saldo_pendiente !== a.saldo_pendiente)
        return b.saldo_pendiente - a.saldo_pendiente
      return (a.nombre || "").localeCompare(b.nombre || "")
    })
  }, [clientes, searchQuery])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-slate-50 pt-4 pb-2 px-4 space-y-4 shadow-sm border-b">

        {/* Banner offline */}
        {!isOnline && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-3 py-2 rounded-xl">
            <WifiOff className="size-4 shrink-0" />
            <span>Sin conexión — los cambios se guardan localmente y se subirán al recuperar señal</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="size-6 text-primary" /> Clientes
          </h1>

          <Drawer open={isNuevoClienteOpen} onOpenChange={setIsNuevoClienteOpen}>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-sm"
              onClick={() => setIsNuevoClienteOpen(true)}
            >
              <UserPlus className="size-4 mr-1.5" /> Nuevo
            </Button>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm relative">
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="absolute right-2 top-2 rounded-full">
                    <X className="size-5 text-muted-foreground" />
                  </Button>
                </DrawerClose>
                <DrawerHeader>
                  <DrawerTitle className="text-xl">Agregar Nuevo Cliente</DrawerTitle>
                  <DrawerDescription>Ingresa el nombre completo o apodo.</DrawerDescription>
                </DrawerHeader>
                <div className="p-6 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nombre del Cliente</label>
                  <Input
                    autoFocus
                    placeholder="Ej. Doña Flor..."
                    className="h-14 text-lg rounded-xl bg-slate-50 border-slate-200"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                  />
                </div>
                <DrawerFooter className="gap-3 pb-8">
                  <Button
                    onClick={handleAgregarCliente}
                    disabled={isPending}
                    className="h-14 text-lg bg-primary hover:bg-primary/90 font-bold rounded-xl"
                  >
                    {isPending ? "Guardando..." : "Guardar Cliente"}
                  </Button>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            className="pl-10 h-12 rounded-xl bg-white border-slate-200 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="p-4 pb-24 space-y-4">

        {/* Tarjeta total general */}
        {!cargando && clientes.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-2 overflow-hidden">
            <button
              onClick={() => setMostrarResumen(!mostrarResumen)}
              className="w-full flex justify-between items-center px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-600">Total por cobrar</p>
                {mostrarResumen && (
                  <p className="text-xl font-semibold text-slate-800">
                    ${totalDeudaGeneral.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <ChevronDown
                className={`size-4 text-slate-400 transition-transform duration-200 ${mostrarResumen ? "rotate-180" : ""}`}
              />
            </button>

            {mostrarResumen && (
              <div className="px-3 pb-3">
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${Math.round(
                        (clientes.filter((c) => c.saldo_pendiente > 0).length / clientes.length) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {Math.round(
                    (clientes.filter((c) => c.saldo_pendiente > 0).length / clientes.length) * 100
                  )}
                  % de clientes con saldo pendiente ·{" "}
                  {clientes.filter((c) => c.saldo_pendiente > 0).length} deudores
                </p>
              </div>
            )}
          </div>
        )}

        {/* Lista de clientes */}
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-8 animate-spin mb-4 text-primary" />
            <p className="font-medium">Cargando cartera...</p>
          </div>
        ) : clientesFiltrados.length > 0 ? (
          clientesFiltrados.map((cliente) => (
            <ClientCard
              key={cliente.id}
              id={cliente.id}
              name={cliente.nombre}
              balance={cliente.saldo_pendiente}
              isOnline={isOnline}
              onAbono={registrarAbono}
              onVenta={registrarVenta}
              onEliminar={eliminarCliente}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <UserPlus className="size-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No se encontraron clientes</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function ClientList() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-primary size-8" />
        </div>
      }
    >
      <ClientListContent />
    </Suspense>
  )
}