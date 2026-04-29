"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { ClientCard } from "@/components/client-card"
import { supabase } from "@/lib/supabase"
import { Loader2, UserPlus, X, Users, Search } from "lucide-react" // Agregamos Search aquí
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
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useSearchParams, useRouter } from "next/navigation"

function ClientListContent() {
  const searchParams = useSearchParams()
  const clienteQuery = searchParams.get("cliente") || ""

  const [clientes, setClientes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [searchQuery, setSearchQuery] = useState(clienteQuery)

  useEffect(() => {
    if (clienteQuery) {
      setSearchQuery(clienteQuery)
    }
  }, [clienteQuery])

  const [isNuevoClienteOpen, setIsNuevoClienteOpen] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState("")
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const fetchClientes = async () => {
    setCargando(true)
    const { data, error } = await supabase.from("clientes").select("*")

    if (error) {
      console.error("Error fetching clientes:", error)
      toast.error("Error al cargar la lista de clientes")
    } else if (data) {
      setClientes(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  const handleAgregarCliente = async () => {
    if (!nuevoNombre.trim()) {
      toast.error("Por favor, ingresa el nombre del cliente")
      return
    }
    
    setIsPending(true)
    try {
      // 1. Limpiamos y guardamos el nombre de una vez por todas
      const nombreFinal = nuevoNombre.trim()
      
      // 2. Usamos "nombreFinal" para guardarlo en Supabase
      const { error } = await supabase.from("clientes").insert([{ nombre: nombreFinal, saldo_pendiente: 0 }])
      if (error) throw error

      // 3. Usamos "nombreFinal" para la notificación
      toast.success(`Cliente "${nombreFinal}" agregado con éxito`)
      
      // 4. Inyectamos "nombreFinal" en el buscador
      setSearchQuery(nombreFinal)

      setNuevoNombre("") 
      setIsNuevoClienteOpen(false) 
      fetchClientes() 
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Error al guardar el nuevo cliente")
    } finally {
      setIsPending(false)
    }
  }

 const clientesFiltrados = useMemo(() => {
    const filtrados = clientes.filter(c => 
      (c.nombre || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    return filtrados.sort((a, b) => {
      const getPrioridad = (saldo: number) => {
        if (saldo > 0) return 3; // Deudores (Rojo)
        if (saldo < 0) return 2; // Saldo a favor (Verde)
        return 1;                // En ceros (Gris)
      }
      
      const prioridadA = getPrioridad(a.saldo_pendiente);
      const prioridadB = getPrioridad(b.saldo_pendiente);

      // REGLA 1: Separar por grupos (Deudores hasta arriba)
      if (prioridadA !== prioridadB) {
        return prioridadB - prioridadA; 
      }

      // REGLA 2: Si ambos son deudores, el que DEBE MÁS va primero (de mayor a menor)
      if (prioridadA === 3 && prioridadB === 3) {
        if (b.saldo_pendiente !== a.saldo_pendiente) {
          return b.saldo_pendiente - a.saldo_pendiente; 
        }
      }

      // REGLA 3: Si están en ceros, tienen saldo a favor, o deben exactamente lo mismo, por abecedario
      return (a.nombre || "").localeCompare(b.nombre || "");
    })
  }, [clientes, searchQuery])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 bg-slate-50 pt-4 pb-2 px-4 space-y-4 shadow-sm border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="size-6 text-primary" /> Clientes
          </h1>
          
          <Drawer open={isNuevoClienteOpen} onOpenChange={setIsNuevoClienteOpen}>
            <DrawerTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-sm">
                <UserPlus className="size-4 mr-1.5" /> Nuevo
              </Button>
            </DrawerTrigger>
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
                  <Input autoFocus placeholder="Ej. Doña Flor..." className="h-14 text-lg rounded-xl bg-slate-50 border-slate-200" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
                </div>
                <DrawerFooter className="gap-3 pb-8">
                  <Button onClick={handleAgregarCliente} disabled={isPending} className="h-14 text-lg bg-primary hover:bg-primary/90 font-bold rounded-xl">
                    {isPending ? "Guardando..." : "Guardar Cliente"}
                  </Button>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* BUSCADOR CORREGIDO */}
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

      <div className="p-4 pb-24 space-y-4">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-8 animate-spin mb-4 text-primary" />
            <p className="font-medium">Cargando cartera...</p>
          </div>
        ) : clientesFiltrados.length > 0 ? (
          clientesFiltrados.map((cliente) => (
            <ClientCard key={cliente.id} id={cliente.id} name={cliente.nombre} balance={cliente.saldo_pendiente} />
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
    <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary size-8" /></div>}>
      <ClientListContent />
    </Suspense>
  )
}