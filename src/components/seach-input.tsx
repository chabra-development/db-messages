// src/components/search-input.tsx
'use client'

import { Input } from "@/components/ui/input"
import { Search, X, Loader2 } from "lucide-react"
import { InputHTMLAttributes, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void
    isLoading?: boolean
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    ({ value, onChange, onClear, isLoading, className, ...props }, ref) => {
        const hasValue = value && String(value).length > 0

        const handleClear = () => {
            if (onChange) {
                onChange({ target: { value: "" } } as any)
            }
            if (onClear) {
                onClear()
            }
        }

        return (
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                
                <Input
                    ref={ref}
                    type="search"
                    value={value}
                    onChange={onChange}
                    className={cn("pl-9 pr-9", className)}
                    {...props}
                />
                
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isLoading && (
                        <Loader2 className="size-4 text-muted-foreground animate-spin" />
                    )}
                    
                    {hasValue && !isLoading && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleClear}
                            className="size-7 hover:bg-transparent"
                        >
                            <X className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
                        </Button>
                    )}
                </div>
            </div>
        )
    }
)

SearchInput.displayName = "SearchInput"