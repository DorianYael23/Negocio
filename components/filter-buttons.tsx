"use client"

import { cn } from "@/lib/utils"

interface FilterButtonsProps {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function FilterButtons({
  categories,
  activeCategory,
  onCategoryChange,
}: FilterButtonsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
            activeCategory === category
              ? "bg-foreground text-background"
              : "bg-card text-foreground border border-border hover:bg-muted"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
