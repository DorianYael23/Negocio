"use client"

import { useState, useMemo, useEffect } from "react"
import { SearchBar } from "@/components/search-bar"
import { FilterButtons } from "@/components/filter-buttons"
import { ProductCard } from "@/components/product-card"
import { supabase } from "@/lib/supabase"
import { Loader2, PackageSearch } from "lucide-react"

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  category: string; 
}

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(["Todos"]) // Hacemos las categorías dinámicas de nuevo
  const [cargando, setCargando] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("Todos")

  useEffect(() => {
    const fetchProductos = async () => {
      // 1. AQUI ESTÁ LA MAGIA ARREGLADA: Agregamos 'categoria' al select
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre, precio, imagen_url, descripcion, stock, categoria")
        .order('nombre', { ascending: true })

      if (error) {
        console.error("Error al cargar productos:", error)
      } else if (data) {
        // 2. Mapeamos los datos
        const productosMapeados: Product[] = data.map((item: any) => ({
          id: item.id,
          name: item.nombre,
          price: item.precio,
          stock: item.stock || 0,
          description: item.descripcion || "Sin descripción disponible",
          image: item.imagen_url || "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&h=400&fit=crop",
          category: item.categoria || "Otros" // Ya toma la categoría real de tu BD
        }))

        setProducts(productosMapeados)

        // 3. Generamos los botones arriba automáticamente basándonos en lo que hay en la BD
        const categoriasUnicas = Array.from(new Set(productosMapeados.map(p => p.category)))
        // Ordenamos las categorías alfabéticamente para que se vean mejor
        setCategories(["Todos", ...categoriasUnicas.sort()])
      }
      setCargando(false)
    }

    fetchProductos()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesCategory =
        activeCategory === "Todos" || product.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, activeCategory])

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background pt-4 pb-2 px-4 space-y-4 shadow-sm">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        {/* Aquí pasamos las categorías ya generadas */}
        <FilterButtons
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      <div className="px-4 pb-24 mt-4">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-8 animate-spin mb-4 text-primary" />
            <p className="font-medium">Cargando catálogo...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <PackageSearch className="size-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">
              No encontramos productos
            </p>
          </div>
        )}
      </div>
    </div>
  )
}