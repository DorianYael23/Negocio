"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { supabase } from "@/lib/supabase"
// 1. Agregamos TriangleAlert aquí
import { Loader2, PackagePlus, Search, Edit2, Trash2, X, Package, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { FilterButtons } from "@/components/filter-buttons"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
}

function InventarioContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [cargando, setCargando] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("Todos")

  const [listaCategorias, setListaCategorias] = useState<string[]>(["Ropa", "Calzado", "Accesorios"])

  const [isOpenForm, setIsOpenForm] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // 2. Nuevos estados para controlar el Drawer de eliminación
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [productoAEliminar, setProductoAEliminar] = useState<{ id: number; name: string } | null>(null)

  const [nombre, setNombre] = useState("")
  const [precio, setPrecio] = useState("")
  const [stock, setStock] = useState("")
  const [categoria, setCategoria] = useState("")
  const [nuevaCategoria, setNuevaCategoria] = useState("")
  const [mostrarInputNuevaCat, setMostrarInputNuevaCat] = useState(false)
  const [descripcion, setDescripcion] = useState("")

  const fetchProductos = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, precio, stock, categoria, descripcion")
      .order('nombre', { ascending: true })

    if (error) {
      console.error(error)
      toast.error("Error al cargar el inventario")
    } else if (data) {
      const mapeados = data.map((item: any) => ({
        id: item.id,
        name: item.nombre,
        price: item.precio,
        stock: item.stock || 0,
        category: item.categoria || "Otros",
        description: item.descripcion || ""
      }))
      setProducts(mapeados)

      const exclusivas = Array.from(new Set(mapeados.map((p: any) => p.category))) as string[]
      const base = ["Ropa", "Calzado", "Accesorios", ...exclusivas].filter(Boolean)
      setListaCategorias(Array.from(new Set(base)).sort())
    }
    setCargando(false)
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  const handleNuevoProductoClick = () => {
    setEditingProduct(null)
    setNombre("")
    setPrecio("")
    setStock("")
    setCategoria(listaCategorias[0] || "Ropa")
    setNuevaCategoria("")
    setMostrarInputNuevaCat(false)
    setDescripcion("")
    setIsOpenForm(true)
  }

  const handleEditarClick = (prod: Product) => {
    setEditingProduct(prod)
    setNombre(prod.name)
    setPrecio(prod.price.toString())
    setStock(prod.stock.toString())
    setCategoria(prod.category)
    setNuevaCategoria("")
    setMostrarInputNuevaCat(false)
    setDescripcion(prod.description)
    setIsOpenForm(true)
  }

  const handleGuardarProducto = async () => {
    if (!nombre.trim() || !precio.trim()) {
      toast.error("Nombre y Precio son requeridos")
      return
    }

    setIsPending(true)
    const categoriaFinal = mostrarInputNuevaCat && nuevaCategoria.trim()
      ? nuevaCategoria.trim()
      : categoria

    const payload: any = {
      nombre: nombre.trim(),
      precio: parseFloat(precio),
      stock: parseInt(stock) || 0,
      categoria: categoriaFinal || "Otros",
      descripcion: descripcion.trim() 
    }

    try {
      if (editingProduct) {
        const { error } = await supabase.from("productos").update(payload).eq("id", editingProduct.id)
        if (error) throw error
        toast.success(`"${payload.nombre}" actualizado`)
      } else {
        const { error } = await supabase.from("productos").insert([payload])
        if (error) throw error
        toast.success(`"${payload.nombre}" agregado`)
      }

      setIsOpenForm(false)
      fetchProductos()
    } catch (error: any) {
      console.error(error)
      if (error.code === "23505") {
        toast.error("Error de ID duplicado. Intenta ejecutar el fix en la consola SQL de Supabase.")
      } else {
        toast.error("Error al guardar en la base de datos")
      }
    } finally {
      setIsPending(false)
    }
  }

  // 3. Modificamos esta función para que solo abra el Drawer
  const handleClickEliminar = (id: number, name: string) => {
    setProductoAEliminar({ id, name })
    setIsDeleteOpen(true)
  }

  // Y creamos la función que realmente hace el borrado
  const handleConfirmarEliminar = async () => {
    if (!productoAEliminar) return
    setIsPending(true)
    try {
      const { error } = await supabase.from("productos").delete().eq("id", productoAEliminar.id)
      if (error) throw error
      toast.success("Producto eliminado")
      setProducts(prev => prev.filter(p => p.id !== productoAEliminar.id))
      setIsDeleteOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("No se pudo eliminar")
    } finally {
      setIsPending(false)
    }
  }

  const categoriasConTodos = useMemo(() => ["Todos", ...listaCategorias], [listaCategorias])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = activeCategory === "Todos" || p.category === activeCategory
      return matchSearch && matchCategory
    })
  }, [products, searchQuery, activeCategory])

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      <div className="bg-white p-4 rounded-2xl shadow-sm border space-y-4 mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="size-5 text-blue-600" /> Panel de Inventario
          </h1>
          <Button onClick={handleNuevoProductoClick} size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-sm gap-1.5">
            <PackagePlus className="size-4" /> Nuevo Ítem
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            placeholder="Buscar artículo o categoría..."
            className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 shadow-none focus-visible:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <FilterButtons
          categories={categoriasConTodos}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      <div className="space-y-2">
        {cargando ? (
          <div className="flex justify-center items-center py-20 text-muted-foreground gap-2">
            <Loader2 className="animate-spin text-blue-600 size-5" />
            <span className="font-medium">Cargando datos...</span>
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((prod) => (
            <div key={prod.id} className="flex justify-between items-center p-3 bg-white rounded-xl border shadow-sm gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-700 text-sm truncate capitalize">{prod.name}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-medium">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 text-[10px] uppercase font-bold">{prod.category}</span>
                  <span>Stock: <strong className={prod.stock > 0 ? "text-slate-600" : "text-red-500 font-black"}>{prod.stock}</strong></span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="font-black text-sm text-slate-900">${prod.price}</p>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="size-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => handleEditarClick(prod)}>
                    <Edit2 className="size-4" />
                  </Button>
                  {/* Aquí conectamos el botón con el nuevo Drawer */}
                  <Button variant="ghost" size="icon" className="size-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" onClick={() => handleClickEliminar(prod.id, prod.name)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-10 text-sm text-muted-foreground italic bg-white rounded-xl border border-dashed">
            No hay artículos registrados con ese criterio.
          </p>
        )}
      </div>

      <Drawer 
        open={isOpenForm} 
        onOpenChange={setIsOpenForm} 
        repositionInputs={false}
      >
        <DrawerContent className="h-[85dvh] flex flex-col rounded-t-2xl outline-none border">
          <div className="mx-auto w-full max-w-sm relative flex flex-col h-full overflow-hidden">
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-2 top-2 rounded-full size-8 z-10">
                <X className="size-4" />
              </Button>
            </DrawerClose>

            <DrawerHeader className="shrink-0">
              <DrawerTitle className="text-xl font-black">
                {editingProduct ? "Modificar Ítem" : "Agregar Producto"}
              </DrawerTitle>
              <DrawerDescription>Rellena los valores que se guardarán.</DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
              <div>
                <label className="text-[11px] uppercase font-black text-slate-400">Nombre del producto</label>
                <Input
                  placeholder="Ej. Camisa vaquera azul"
                  className="h-11 mt-1 rounded-xl focus-visible:ring-blue-500 bg-slate-50 border-slate-200"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-black text-slate-400">Precio unitario</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="h-11 mt-1 rounded-xl focus-visible:ring-blue-500 bg-slate-50 border-slate-200"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase font-black text-slate-400">Stock (Piezas)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="h-11 mt-1 rounded-xl focus-visible:ring-blue-500 bg-slate-50 border-slate-200"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] uppercase font-black text-slate-400">Categoría</label>
                  <button
                    type="button"
                    onClick={() => setMostrarInputNuevaCat(!mostrarInputNuevaCat)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    {mostrarInputNuevaCat ? "Elegir existente" : "+ Nueva categoría"}
                  </button>
                </div>
                {!mostrarInputNuevaCat ? (
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {listaCategorias.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="Escribe la nueva categoría..."
                    className="h-11 rounded-xl focus-visible:ring-blue-500 bg-slate-50 border-slate-200"
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] uppercase font-black text-slate-400">Notas de descripción (Opcional)</label>
                <Input
                  placeholder="Ej. Talla M, marca original"
                  className="h-11 mt-1 rounded-xl focus-visible:ring-blue-500 bg-slate-50 border-slate-200"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
            </div>

            <DrawerFooter className="pb-8 pt-2 shrink-0 bg-white border-t">
              <Button
                onClick={handleGuardarProducto}
                disabled={isPending}
                className="h-13 text-base bg-blue-600 hover:bg-blue-700 font-bold rounded-xl text-white w-full shadow-md"
              >
                {isPending ? "Guardando..." : editingProduct ? "Actualizar Datos" : "Dar de Alta"}
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* 4. Nuevo Drawer para confirmar eliminación */}
      <Drawer open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm relative">
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-red-600 flex items-center gap-2 text-xl">
                <TriangleAlert className="size-6" />
                ¿Eliminar producto?
              </DrawerTitle>
              <DrawerDescription className="text-base mt-2 text-slate-600 font-medium leading-snug">
                Estás a punto de borrar <span className="font-bold text-slate-900">{productoAEliminar?.name}</span> de forma permanente.
                <br/><br/>
                <span className="font-bold text-red-600">Esto no se puede deshacer.</span>
              </DrawerDescription>
            </DrawerHeader>
            
            <DrawerFooter className="pb-8 pt-4 grid grid-cols-2 gap-3">
              <DrawerClose asChild>
                <Button variant="outline" className="h-12 font-bold rounded-xl text-slate-600">
                  Cancelar
                </Button>
              </DrawerClose>
              <Button
                onClick={handleConfirmarEliminar}
                disabled={isPending}
                className="h-12 bg-red-600 hover:bg-red-700 font-bold rounded-xl text-white shadow-sm"
              >
                {isPending ? "Borrando..." : "Sí, Eliminar"}
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

    </div>
  )
}

export default function InventarioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    }>
      <InventarioContent />
    </Suspense>
  )
}