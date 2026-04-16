"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientCardProps {
  name: string
  balance: number
  onAbonar?: () => void
  onVender?: () => void
}

export function ClientCard({ name, balance, onAbonar, onVender }: ClientCardProps) {
  const hasHighDebt = balance > 500
  
  return (
    <Card 
      className={cn(
        "flex flex-col gap-4 p-4 rounded-2xl shadow-sm border transition-colors",
        hasHighDebt 
          ? "bg-red-50 border-red-200" 
          : "bg-card border-border"
      )}
    >
      {/* Client Info Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {hasHighDebt && (
            <TriangleAlert className="size-5 text-red-500 shrink-0" />
          )}
          <span className="font-semibold text-foreground text-base">{name}</span>
        </div>
        <span 
          className={cn(
            "text-lg tabular-nums",
            hasHighDebt ? "font-bold text-red-600" : "font-medium text-muted-foreground"
          )}
        >
          ${balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button 
          onClick={onAbonar}
          className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base shadow-sm"
        >
          Abonar
        </Button>
        <Button 
          onClick={onVender}
          className="flex-1 h-11 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base shadow-sm"
        >
          Vender
        </Button>
      </div>
    </Card>
  )
}
