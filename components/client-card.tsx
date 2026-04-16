"use client"

import { useState } from "react"
import { TriangleAlert, Receipt, ShoppingCart, X } from "lucide-react"
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
import { toast } from "sonner" // Importamos Sonner para notificaciones pro

interface ClientCardProps {
  id: number
  name: string
  balance: number
}

export function ClientCard({ id, name, balance }: ClientCardProps) {
  const [amount, setAmount] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [isOpen, setIsOpen] = useState(false) // Estado para cerrar el drawer manualmente
  const [currentBalance, setCurrentBalance] = useState(balance)
  const router = useRouter()

  const handlePayment = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Por favor, ingresa un monto válido")
      return
    }

    setIsPending(true)

    try {
      const newBalance = currentBalance - numAmount

      // 1. Actualizar el saldo del cliente
      const { error: updateError } = await supabase
        .from("clientes")
        .update({ saldo_pendiente: newBalance })
        .eq("id", id)

      if (updateError) throw updateError

      // 2. Registrar el movimiento en el historial
      const { error: moveError } = await supabase
        .from("movimientos")
        .insert([
          {
            cliente_id: id,
            tipo_movimiento: "abono",
            monto: numAmount,
            descripcion: "Abono a cuenta",
          },
        ])

      if (moveError) throw moveError

      // 3. Éxito: Actualizar UI
      setCurrentBalance(newBalance)
      setAmount("")
      setIsOpen(false) // Cerramos el drawer
      toast.success(`Abono registrado: $${numAmount} para ${name}`)
      router.refresh()
      
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al conectar con la base de datos")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className={`overflow-hidden border-l-4 ${currentBalance > 500 ? "border-l-red-500 bg-red-50" : "border-l-primary"}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-foreground">{name}</h3>
              {currentBalance > 500 && <TriangleAlert className="size-5 text-red-600" />}
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider text-[10px]">Saldo Pendiente</p>
          </div>
          <div className={`text-2xl font-black ${currentBalance > 500 ? "text-red-600" : "text-primary"}`}>
            ${currentBalance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="w-full bg-green-600 hover:bg-green-700 text-white border-0 h-12 text-base font-bold shadow-sm">
                <Receipt className="mr-2 size-5" />
                Abonar
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm relative">
                {/* Botón X para cerrar arriba a la derecha */}
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="absolute right-2 top-2 rounded-full">
                    <X className="size-5 text-muted-foreground" />
                  </Button>
                </DrawerClose>

                <DrawerHeader>
                  <DrawerTitle className="text-xl">Registrar Abono</DrawerTitle>
                  <DrawerDescription>Ingresa el pago de {name}</DrawerDescription>
                </DrawerHeader>

                <div className="p-6">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute left-8 text-4xl font-bold text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="text-4xl h-20 text-center font-black rounded-2xl bg-muted/50 border-none focus-visible:ring-primary"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <DrawerFooter className="gap-3 pb-8">
                  <Button 
                    onClick={handlePayment} 
                    disabled={isPending}
                    className="h-14 text-lg bg-green-600 hover:bg-green-700 font-bold rounded-xl"
                  >
                    {isPending ? "Procesando..." : "Confirmar Pago"}
                  </Button>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>

          <Button variant="outline" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 h-12 text-base font-bold shadow-sm">
            <ShoppingCart className="mr-2 size-5" />
            Vender
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}