"use client"

import { useState, useEffect, useMemo } from "react"
import { ClientCard } from "@/components/client-card"
import { SearchBar } from "@/components/search-bar"
import { supabase } from "@/lib/supabase"
import { Loader2, UserPlus, X, Users } from "lucide-react"
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
import { useRouter } from "next/navigation"

export function ClientList() {
  const [clientes, setClientes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Estados para Nuevo Cliente
  const [isNuevoClienteOpen, setIsNuevoClienteOpen] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState("")
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  // Función para traer todos los clientes
  const fetchClientes = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("nombre", { ascending: true })

    if (error) {
      console.error("Error fetching clientes:", error)
      toast.error("Error al cargar la lista de clientes")
    } else if (data) {
      setClientes(data)
    }
    setCargando(false)
  }

  // Cargar clientes al iniciar la pantalla
  useEffect(() => {
    fetchClientes()
  }, [])

  // Función para guardar al nuevo cliente en Supabase
  const handleAgregarCliente = async () => {
    if (!nuevoNombre.trim()) {
      toast.error("Por favor, ingresa el nombre del cliente")
      return
    }
    
    setIsPending(true)
    try {
      const { error } = await supabase
        .from("clientes")
        .insert([{ 
          nombre: nuevoNombre.trim(), 
          saldo_pendiente: 0 // Inician sin deber nada
        }])

      if (error) throw error

      toast.success(`Cliente "${nuevoNombre}" agregado con éxito`)
      setNuevoNombre("") // Limpiamos el texto
      setIsNuevoClienteOpen(false) // Cerramos el cajón
      fetchClientes() // Recargamos la lista para que aparezca
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Error al guardar el nuevo cliente")
    } finally {
      setIsPending(false)
    }
  }

  // Buscador en tiempo real
  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => 
      (c.nombre || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [clientes, searchQuery])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cabecera Fija */}
      <div className="sticky top-0 z-10 bg-slate-50 pt-4 pb-2 px-4 space-y-4 shadow-sm border-b">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="size-6 text-primary" />
            Clientes
          </h1>
          
          {/* BOTÓN Y CAJÓN DE NUEVO CLIENTE */}
          <Drawer open={isNuevoClienteOpen} onOpenChange={setIsNuevoClienteOpen}>
            <DrawerTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold rounded-xl shadow-sm">
                <UserPlus className="size-4 mr-1.5" />
                Nuevo
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

                <div className="p-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nombre del Cliente</label>
                    <Input
                      autoFocus
                      placeholder="Ej. Doña Flor, Tía Luisa..."
                      className="h-14 text-lg rounded-xl bg-slate-50 border-slate-200"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                    />
                  </div>
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
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Lista de Tarjetas */}
      <div className="p-4 pb-24 space-y-4">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-8 animate-spin mb-4 text-primary" />
            <p className="font-medium">Cargando cartera de clientes...</p>
          </div>
        ) : clientesFiltrados.length > 0 ? (
          clientesFiltrados.map((cliente) => (
            <ClientCard 
              key={cliente.id} 
              id={cliente.id} 
              name={cliente.nombre} 
              balance={cliente.saldo_pendiente} 
            />
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <UserPlus className="size-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">
              No se encontraron clientes con ese nombre
            </p>
          </div>
        )}
      </div>
    </div>
  )
}