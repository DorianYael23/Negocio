"use client"

import Image from "next/image"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Product {
  id: number
  name: string
  price: number
  image: string
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      `Hola! Me interesa el producto: ${product.name} - $${product.price.toLocaleString()}`
    )
    window.open(`https://wa.me/?text=${message}`, "_blank")
  }

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-square relative bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-foreground line-clamp-2 min-h-[2.5rem] text-sm leading-tight">
          {product.name}
        </h3>
        <p className="text-xl font-bold text-foreground mt-2">
          ${product.price.toLocaleString()}
        </p>
        <Button
          onClick={handleWhatsAppClick}
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Pedir por WhatsApp
        </Button>
      </CardContent>
    </Card>
  )
}
