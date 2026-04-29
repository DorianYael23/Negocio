"use client"

import { useState, useEffect } from "react"
import { TriangleAlert, Receipt, ShoppingCart, X, CheckCircle2, Search, Package, Plus, Minus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { toast } from "sonner" 

interface ClientCardProps {
  id: number
  name: string
  balance: number
}

interface ItemCarrito {
  producto: any;
  cantidad: number;
}

export function ClientCard({ id, name, balance }: ClientCardProps) {
  const [amount, setAmount] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [isAbonoOpen, setIsAbonoOpen] = useState(false) 
  
  const [isVentaOpen, setIsVentaOpen] = useState(false)
  const [productos, setProductos] = useState<any[]>([])
  const [busquedaProducto, setBusquedaProducto] = useState("")
  const [cargandoProductos, setCargandoProductos] = useState(false)

  const [customName, setCustomName] = useState("")
  const [customPrice, setCustomPrice] = useState("")

  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [currentBalance, setCurrentBalance] = useState(balance)
  const router = useRouter()

  useEffect(() => {
    setCurrentBalance(balance);
  }, [balance]);

  useEffect(() => {
    if (isVentaOpen && productos.length === 0) {
      const fetchProductos = async () => {
        setCargandoProductos(true)
        const { data } = await supabase.from("productos").select("id, nombre, precio").order("nombre", { ascending: true })
        if (data) setProductos(data)
        setCargandoProductos(false)
      }
      fetchProductos()
    }
  }, [isVentaOpen, productos.length])

  const handlePayment = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Por favor, ingresa un monto válido")
      return
    }
    setIsPending(true)
    try {
      const newBalance = currentBalance - numAmount
      const { error: updateError } = await supabase.from("clientes").update({ saldo_pendiente: newBalance }).eq("id", id)
      if (updateError) throw updateError

      const { error: moveError } = await supabase.from("movimientos").insert([{
        cliente_id: id,
        tipo_movimiento: "abono",
        monto: numAmount,
        descripcion: "Abono a cuenta",
      }])
      if (moveError) throw moveError

      setCurrentBalance(newBalance)
      setAmount("")
      setIsAbonoOpen(false) 
      toast.success(`Abono registrado: $${numAmount} para ${name}`)
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al registrar el abono")
    } finally {
      setIsPending(false)
    }
  }

  const agregarAlCarrito = (producto: any) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.producto.id === producto.id)
      if (existe) {
        return prev.map(item => item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item)
      } else {
        return [...prev, { producto, cantidad: 1 }]
      }
    })
  }

  const agregarManualAlCarrito = () => {
    if (!customName.trim()) {
      toast.error("Escribe qué estás vendiendo (Ej. Blusa, Pantalón)")
      return
    }
    const precioNum = parseFloat(customPrice)
    if (isNaN(precioNum) || precioNum <= 0) {
      toast.error("Ingresa un precio válido")
      return
    }

    const productoManual = {
      id: -Math.floor(Math.random() * 1000000), 
      nombre: customName.trim(),
      precio: precioNum,
      isManual: true 
    }

    setCarrito(prev => [...prev, { producto: productoManual, cantidad: 1 }])
    setCustomName("")
    setCustomPrice("")
  }

  const quitarDelCarrito = (productoId: number) => {
    setCarrito(prev => {
      return prev.map(item => {
        if (item.producto.id === productoId) {
          return { ...item, cantidad: item.cantidad - 1 }
        }
        return item
      }).filter(item => item.cantidad > 0)
    })
  }

  const totalCarrito = carrito.reduce((total, item) => total + (item.producto.precio * item.cantidad), 0)
  const cantidadTotalItems = carrito.reduce((total, item) => total + item.cantidad, 0)

  const handleConfirmarVenta = async () => {
    if (carrito.length === 0) return
    setIsPending(true)
    try {
      const newBalance = currentBalance + totalCarrito
      const { error: updateError } = await supabase.from("clientes").update({ saldo_pendiente: newBalance }).eq("id", id)
      if (updateError) throw updateError

      const movimientosAInsertar = carrito.map(item => ({
        cliente_id: id,
        tipo_movimiento: "nueva_compra",
        monto: item.producto.precio * item.cantidad,
        descripcion: `Venta: ${item.cantidad}x ${item.producto.nombre}`,
        producto_id: item.producto.isManual ? null : item.producto.id,
        cantidad: item.cantidad
      }))

      const { error: moveError } = await supabase.from("movimientos").insert(movimientosAInsertar)
      if (moveError) throw moveError

      setCurrentBalance(newBalance)
      setIsVentaOpen(false)
      setCarrito([]) 
      setBusquedaProducto("")
      toast.success(`Venta de $${totalCarrito} registrada con éxito`)
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al registrar la venta")
    } finally {
      setIsPending(false)
    }
  }

  const productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()))
  const isOverdue = currentBalance > 500
  const isCredit = currentBalance < 0

  return (
    <Card className={`overflow-hidden border-l-4 transition-colors ${isOverdue ? "border-l-red-500 bg-red-50" : isCredit ? "border-l-green-500 bg-green-50/50" : "border-l-primary"}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-foreground truncate">{name}</h3>
              {isOverdue && <TriangleAlert className="size-5 text-red-600 shrink-0" />}
              {isCredit && <CheckCircle2 className="size-5 text-green-600 shrink-0" />}
            </div>
            <p className={`text-sm uppercase tracking-wider text-[10px] font-bold ${isCredit ? "text-green-600" : "text-muted-foreground"}`}>
              {isCredit ? "Saldo a Favor" : "Saldo Pendiente"}
            </p>
          </div>
          <div className={`text-2xl font-black shrink-0 ${isOverdue ? "text-red-600" : isCredit ? "text-green-600" : "text-primary"}`}>
            {isCredit && "+ "}${Math.abs(currentBalance).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* CONTENEDOR DE LOS 3 BOTONES */}
        <div className="flex flex-col gap-3">
          {/* Fila de Abonar y Vender */}
          <div className="grid grid-cols-2 gap-3">
            <Drawer open={isAbonoOpen} onOpenChange={setIsAbonoOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="w-full bg-green-600 hover:bg-green-700 text-white border-0 h-11 text-sm font-bold shadow-sm">
                  <Receipt className="mr-2 size-4" /> Abonar
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-sm relative">
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="absolute right-2 top-2 rounded-full"><X className="size-5" /></Button>
                  </DrawerClose>
                  <DrawerHeader>
                    <DrawerTitle className="text-xl">Registrar Abono</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-6">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute left-8 text-4xl font-bold text-muted-foreground">$</span>
                      <Input type="number" placeholder="0.00" className="text-4xl h-20 text-center font-black rounded-2xl bg-muted/50 border-none" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                  </div>
                  <DrawerFooter className="pb-8">
                    <Button onClick={handlePayment} disabled={isPending} className="h-14 text-lg bg-green-600 hover:bg-green-700 font-bold rounded-xl">Confirmar Pago</Button>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>

            <Drawer 
              open={isVentaOpen} 
              onOpenChange={(open) => {
                setIsVentaOpen(open)
                if (!open) {
                  setCarrito([])
                  setCustomName("")
                  setCustomPrice("")
                }
              }}
              repositionInputs={false} 
            >
              <DrawerTrigger asChild>
                <Button variant="outline" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 h-11 text-sm font-bold shadow-sm">
                  <ShoppingCart className="mr-2 size-4" /> Vender
                </Button>
              </DrawerTrigger>
              
              <DrawerContent className="h-[85vh] flex flex-col overflow-hidden">
                <div className="mx-auto w-full max-w-md relative flex flex-col h-full overflow-hidden">
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" className="absolute right-2 top-2 rounded-full z-10"><X className="size-5 text-muted-foreground" /></Button>
                  </DrawerClose>

                  <DrawerHeader className="pb-2 shrink-0">
                    <DrawerTitle className="text-xl text-left">Nueva Venta a {name}</DrawerTitle>
                  </DrawerHeader>

                  <div className="px-4 pb-3 border-b shrink-0 bg-blue-50/50 flex gap-2 items-center">
                    <div className="flex-1 flex gap-2">
                      <Input placeholder="Ej. Ropa, Blusa..." className="h-10 bg-white border-slate-200" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                      <div className="relative w-24 shrink-0">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">$</span>
                        <Input type="number" placeholder="0.00" className="h-10 pl-5 bg-white border-slate-200" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} />
                      </div>
                    </div>
                    <Button size="icon" className="h-10 w-10 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={agregarManualAlCarrito}>
                      <Plus className="size-5 text-white" />
                    </Button>
                  </div>

                  <div className="px-4 py-2 border-b shrink-0 bg-white">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input placeholder="O busca en el inventario..." className="pl-10 h-10 rounded-xl bg-slate-50" value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
                    {cargandoProductos ? (
                      <p className="text-center text-muted-foreground mt-10">Cargando catálogo...</p>
                    ) : (
                      productosFiltrados.map((prod) => {
                        const enCarrito = carrito.find(item => item.producto.id === prod.id)?.cantidad || 0
                        return (
                          <div key={prod.id} className="grid grid-cols-[1fr_auto] items-center p-3 rounded-xl border bg-white shadow-sm gap-3 w-full">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="bg-slate-100 p-2 rounded-lg text-slate-600 shrink-0"><Package className="size-5" /></div>
                              <div className="flex flex-col overflow-hidden w-full">
                                <p className="font-bold text-sm text-slate-800 leading-tight truncate w-full">{prod.nombre}</p>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5">${prod.precio}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-end">
                              {enCarrito > 0 ? (
                                <div className="flex items-center gap-1 bg-blue-50 rounded-lg p-1 border border-blue-100">
                                  <Button variant="ghost" size="icon" className="size-8 rounded-md text-blue-700 hover:bg-blue-200" onClick={() => quitarDelCarrito(prod.id)}><Minus className="size-4" /></Button>
                                  <span className="font-bold w-5 text-center text-blue-700 text-sm">{enCarrito}</span>
                                  <Button variant="ghost" size="icon" className="size-8 rounded-md text-blue-700 hover:bg-blue-200" onClick={() => agregarAlCarrito(prod)}><Plus className="size-4" /></Button>
                                </div>
                              ) : (
                                <Button size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold px-4 h-8" onClick={() => agregarAlCarrito(prod)}>Agregar</Button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {carrito.length > 0 && (
                    <div className="shrink-0 bg-white border-t p-4 pb-8 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-20">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-semibold text-slate-600">{cantidadTotalItems} artículos seleccionados</p>
                        <p className="font-black text-lg text-blue-700">Total: ${totalCarrito}</p>
                      </div>
                      <Button onClick={handleConfirmarVenta} disabled={isPending} className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-md">
                        {isPending ? "Procesando..." : "Confirmar Venta"}
                      </Button>
                    </div>
                  )}
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* NUEVO BOTÓN ANCHO Y CLARO PARA EL HISTORIAL */}
          <Button 
            variant="secondary" 
            onClick={() => router.push(`/historial?cliente=${encodeURIComponent(name)}`)}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold h-11 rounded-xl"
          >
            <Clock className="mr-2 size-4" />
            Ver historial de la cuenta
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}