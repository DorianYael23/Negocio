"use client"

import { useState, useMemo } from "react"
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

const MOCK_CLIENTS = [
  { id: 1, name: "Doña Lupe", balance: 730.00 },
  { id: 2, name: "Chabe Hernández", balance: 50.00 },
  { id: 3, name: "Kenia", balance: 793.00 },
  { id: 4, name: "Pipo", balance: 430.00 },
]

type SortOption = "debt" | "alphabetical"

export function ClientList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("debt")

  const filteredAndSortedClients = useMemo(() => {
    let clients = [...MOCK_CLIENTS]

    // Filter by search query
    if (searchQuery) {
      clients = clients.filter((client) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    if (sortBy === "debt") {
      clients.sort((a, b) => b.balance - a.balance)
    } else {
      clients.sort((a, b) => a.name.localeCompare(b.name))
    }

    return clients
  }, [searchQuery, sortBy])

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-5">
          Gestión de Clientes
        </h1>
        
        {/* Search Bar */}
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

        {/* Sort Dropdown */}
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

      {/* Client List */}
      <main className="px-5 pt-2 pb-28">
        <div className="flex flex-col gap-4">
          {filteredAndSortedClients.map((client) => (
            <ClientCard
              key={client.id}
              name={client.name}
              balance={client.balance}
            />
          ))}
          {filteredAndSortedClients.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No se encontraron clientes
            </p>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <Button
        size="icon"
        className="fixed bottom-8 right-6 size-16 rounded-full shadow-xl shadow-primary/30"
      >
        <Plus className="size-7" />
        <span className="sr-only">Agregar cliente</span>
      </Button>
    </div>
  )
}
