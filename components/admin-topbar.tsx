"use client"

import { useRouter, usePathname } from "next/navigation"
import { ChevronLeft, Menu, Users, Package, Clock, Store } from "lucide-react"
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

export function AdminTopbar() {
  const router = useRouter()
  const pathname = usePathname()

  // 1. Títulos dinámicos
  let titulo = "Administración"
  if (pathname.includes("/clientes") || pathname === "/") titulo = "Mis Clientes"
  if (pathname.includes("/historial")) titulo = "Historial de Ventas"

  // 2. Seguridad: Si estamos en una página de clientes externos, no se muestra esto
  if (pathname.startsWith('/tienda')) return null;

  // 3. MAGIA: ¿Estamos en la página principal?
  const esPantallaPrincipal = pathname.includes("/clientes") || pathname === "/";

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-16 bg-white border-b shadow-sm">
      
      {/* BOTÓN DE REGRESAR (Alineado a la izquierda) */}
      <div className="w-12">
        {/* Solo se muestra si NO estamos en la pantalla principal */}
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

      {/* MENÚ DE HAMBURGUESA (Alineado a la derecha) */}
      <div className="w-12 flex justify-end">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100 rounded-full">
              <Menu className="size-7" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-slate-50 p-0 w-[80%] max-w-sm border-l shadow-2xl">
            <SheetHeader className="p-6 bg-white border-b text-left">
              <SheetTitle className="text-2xl font-black text-blue-600">Mi Negocio</SheetTitle>
              <p className="text-sm text-muted-foreground">Panel de Administración</p>
            </SheetHeader>

            <div className="flex flex-col p-4 space-y-3 mt-2">
              
              {/* === BOTONES ACTIVOS === */}
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

              <div className="h-px bg-slate-200 my-4 mx-2"></div> {/* Separador Visual */}

              {/* === BOTONES "PRÓXIMAMENTE" === */}
              {/* Usamos un div en lugar de Link para que no haga nada al tocarlo */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 border border-slate-200 opacity-70 cursor-not-allowed">
                <div className="flex items-center gap-4 text-slate-500 font-bold">
                  <Package className="size-6 text-slate-400" />
                  Inventario
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-300 text-slate-600 px-2.5 py-1 rounded-full">
                  Pronto
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 border border-slate-200 opacity-70 cursor-not-allowed">
                <div className="flex items-center gap-4 text-slate-500 font-bold">
                  <Store className="size-6 text-slate-400" />
                  Tienda Online
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-300 text-slate-600 px-2.5 py-1 rounded-full">
                  Pronto
                </span>
              </div>

            </div>
          </SheetContent>
        </Sheet>
      </div>

    </header>
  )
}