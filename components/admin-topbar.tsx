"use client"

import { useRouter, usePathname } from "next/navigation"
import { ChevronLeft, Menu, Users, Package, Clock, Store, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import Link from "next/link"
import { toast } from "sonner"

export function AdminTopbar() {
  const router = useRouter()
  const pathname = usePathname()

  // 1. Bloqueo: Si estamos en el login o en la tienda, no mostramos nada
  if (pathname === "/login" || pathname.startsWith('/tienda')) return null;

  // 2. Títulos dinámicos
  let titulo = "Administración"
  if (pathname.includes("/clientes") || pathname === "/") titulo = "Mis Clientes"
  if (pathname.includes("/historial")) titulo = "Historial de Ventas"

  const esPantallaPrincipal = pathname.includes("/clientes") || pathname === "/";

  // 3. Función de Salida
  const handleLogout = () => {
    // Borramos la cookie de sesión
    document.cookie = "auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
    toast.info("Sesión cerrada")
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-16 bg-white border-b shadow-sm">
      
      {/* BOTÓN DE REGRESAR */}
      <div className="w-12">
        {!esPantallaPrincipal && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="text-slate-600 hover:bg-slate-100 rounded-full"
          >
            <ChevronLeft className="size-7" />
          </Button>
        )}
      </div>

      {/* TÍTULO CENTRAL */}
      <h1 className="font-bold text-lg text-slate-800 flex-1 text-center">
        {titulo}
      </h1>

      {/* MENÚ DE HAMBURGUESA */}
      <div className="w-12 flex justify-end">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100 rounded-full">
              <Menu className="size-7" />
            </Button>
          </SheetTrigger>
          
          {/* Usamos flex-col y h-full para empujar el botón al fondo */}
          <SheetContent side="right" className="bg-slate-50 p-0 w-[80%] max-w-sm border-l shadow-2xl flex flex-col h-full">
            
            <div className="flex-1 overflow-y-auto">
              <SheetHeader className="p-6 bg-white border-b text-left">
                <SheetTitle className="text-2xl font-black text-blue-600">Mi Negocio</SheetTitle>
                <p className="text-sm text-muted-foreground">Panel de Marisol</p>
              </SheetHeader>

              <div className="flex flex-col p-4 space-y-3 mt-2">
                <SheetClose asChild>
                  <Link href="/clientes" className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-sm border border-slate-100 hover:border-blue-300 transition-all text-slate-700 font-bold">
                    <Users className="size-6 text-blue-600" />
                    Cartera de Clientes
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link href="/historial" className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-sm border border-slate-100 hover:border-blue-300 transition-all text-slate-700 font-bold">
                    <Clock className="size-6 text-green-600" />
                    Historial y Reportes
                  </Link>
                </SheetClose>

                <div className="h-px bg-slate-200 my-4 mx-2"></div>

                {/* BOTONES PRÓXIMAMENTE */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 border border-slate-200 opacity-60 grayscale">
                  <div className="flex items-center gap-4 text-slate-500 font-bold text-sm">
                    <Package className="size-5 text-slate-400" />
                    Inventario
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 border border-slate-200 opacity-60 grayscale">
                  <div className="flex items-center gap-4 text-slate-500 font-bold text-sm">
                    <Store className="size-5 text-slate-400" />
                    Tienda Online
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÓN DE CERRAR SESIÓN (Fijado abajo) */}
            <div className="p-4 bg-white border-t mt-auto">
              <Button 
                onClick={handleLogout}
                variant="ghost" 
                className="w-full justify-start gap-4 p-6 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 font-bold transition-all"
              >
                <LogOut className="size-6" />
                Cerrar Sesión
              </Button>
            </div>

          </SheetContent>
        </Sheet>
      </div>

    </header>
  )
}