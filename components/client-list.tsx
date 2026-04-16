"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ClientCard } from "@/components/client-card"
import { supabase } from "@/lib/supabase" // Tu puente de conexión

type SortOption = "debt" | "alphabetical"

// Le decimos a TypeScript cómo viene tu tabla de Supabase
interface Cliente {
  id: number;
  nombre: string;
  saldo_pendiente: number;
}

export function ClientList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("debt")

  // Nuevos estados para controlar la base de datos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargando, setCargando] = useState(true)

  // Efecto que jala los datos reales cuando abres la pantalla
  useEffect(() => {
    const cargarClientes = async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')

      if (!error && data) {
        setClientes(data)
      } else {
        console.error("Error al cargar la base de datos:", error)
      }
      setCargando(false)
    }

    cargarClientes()
  }, [])

  // El buscador y filtro conectados a tus datos vivos
  const filteredAndSortedClients = useMemo(() => {
    let clientsFiltrados = [...clientes]

    // Filtrar por texto (buscador)
    if (searchQuery) {
      clientsFiltrados = clientsFiltrados.filter((client) =>
        client.nombre.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Ordenamiento inteligente
    if (sortBy === "debt") {
      clientsFiltrados.sort((a, b) => b.saldo_pendiente - a.saldo_pendiente)
    } else {
      clientsFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre))
    }

    return clientsFiltrados
  }, [searchQuery, sortBy, clientes])

  return (
    <div className="min-h-screen bg-background">
      {/* Encabezado fijo */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-5">
          Gestión de Clientes
        </h1>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-muted border-0 rounded-xl text-base"
          />
        </div>

        {/* Filtro */}
        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
          <SelectTrigger className="w-full h-12 bg-muted border-0 rounded-xl text-base">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="debt">Mayor a menor deuda</SelectItem>
            <SelectItem value="alphabetical">Alfabético</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {/* Lista de Clientes */}
      <main className="px-5 pt-2 pb-28">
        <div className="flex flex-col gap-4">
          {cargando ? (
            <p className="text-center text-muted-foreground py-8 animate-pulse">
              Cargando tu cartera de clientes...
            </p>
          ) : (
            filteredAndSortedClients.map((client) => (
              <ClientCard
                key={client.id}
                id={client.id} // <--- Agrega esta línea
                name={client.nombre}
                balance={client.saldo_pendiente}
              />
            ))
          )}

          {!cargando && filteredAndSortedClients.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No se encontraron clientes
            </p>
          )}
        </div>
      </main>

      {/* Botón Flotante */}
      <Button
        size="icon"
        className="fixed bottom-8 right-6 size-16 rounded-full shadow-xl shadow-primary/30 z-50 hover:scale-105 active:scale-95 transition-all"
      >
        <Plus className="size-7" />
        <span className="sr-only">Agregar cliente</span>
      </Button>
    </div>
  )
}