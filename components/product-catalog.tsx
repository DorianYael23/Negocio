"use client"

import { useState, useMemo } from "react"
import { SearchBar } from "@/components/search-bar"
import { FilterButtons } from "@/components/filter-buttons"
import { ProductCard } from "@/components/product-card"

const products = [
  {
    id: 1,
    name: "Auriculares Bluetooth Premium",
    price: 89990,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "Tecnología",
  },
  {
    id: 2,
    name: "Zapatillas Running Deportivas",
    price: 129990,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    category: "Deportes",
  },
  {
    id: 3,
    name: "Reloj Inteligente Fitness",
    price: 149990,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    category: "Tecnología",
  },
  {
    id: 4,
    name: "Mochila Urbana Impermeable",
    price: 59990,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    category: "Accesorios",
  },
  {
    id: 5,
    name: "Cámara Instantánea Retro",
    price: 179990,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop",
    category: "Tecnología",
  },
  {
    id: 6,
    name: "Botella Térmica 750ml",
    price: 34990,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
    category: "Hogar",
  },
  {
    id: 7,
    name: "Gafas de Sol Polarizadas",
    price: 79990,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
    category: "Accesorios",
  },
  {
    id: 8,
    name: "Parlante Portátil Bluetooth",
    price: 119990,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
    category: "Tecnología",
  },
  {
    id: 9,
    name: "Mat de Yoga Premium",
    price: 44990,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop",
    category: "Deportes",
  },
  {
    id: 10,
    name: "Lámpara LED de Escritorio",
    price: 54990,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop",
    category: "Hogar",
  },
]

const categories = ["Todos", "Tecnología", "Deportes", "Accesorios", "Hogar"]

export function ProductCatalog() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("Todos")

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesCategory =
        activeCategory === "Todos" || product.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, activeCategory])

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background pt-4 pb-2 px-4 space-y-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <FilterButtons
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      <div className="px-4 pb-8">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No se encontraron productos
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
