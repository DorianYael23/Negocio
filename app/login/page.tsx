"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react" // Importamos los iconos del ojo
import { toast } from "sonner"

export default function LoginPage() {
  const [user, setUser] = useState<"DORIAN" | "MARISOL">("MARISOL")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false) // Estado para mostrar/ocultar
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    const passDorian = process.env.NEXT_PUBLIC_PASS_DORIAN || "1234"
    const passMama = process.env.NEXT_PUBLIC_PASS_MAMA || "1234"

    const correctPassword = user === "DORIAN" ? passDorian : passMama

    if (password === correctPassword) {
      const expires = new Date()
      expires.setDate(expires.getDate() + 30) 
      document.cookie = `auth-session=true; path=/; expires=${expires.toUTCString()}`
      
      toast.success(`¡Hola ${user === "DORIAN" ? "Dorian" : "Marisol"}!`)
      router.push("/clientes")
    } else {
      toast.error("Contraseña incorrecta")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="text-blue-600 size-8" />
        </div>
        
        <h1 className="text-2xl font-black text-slate-800 mb-6">Acceso Privado</h1>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
          <button 
            type="button"
            onClick={() => setUser("MARISOL")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${user === "MARISOL" ? "bg-white shadow-md text-blue-600" : "text-slate-500"}`}
          >
            Soy Marisol
          </button>
          <button 
            type="button"
            onClick={() => setUser("DORIAN")}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${user === "DORIAN" ? "bg-white shadow-md text-blue-600" : "text-slate-500"}`}
          >
            Soy Dorian
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input 
              // Cambiamos dinámicamente entre "password" y "text"
              type={showPassword ? "text" : "password"} 
              placeholder="Contraseña" 
              className="w-full h-14 text-center text-2xl tracking-widest rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Botón del ojito posicionado dentro del input */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          
          <button 
            type="submit" 
            className="w-full h-14 text-lg font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
          >
            Entrar <ArrowRight className="size-5" />
          </button>
        </form>
      </div>
    </div>
  )
}