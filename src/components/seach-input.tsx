import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { SearchIcon } from "lucide-react"
import { ComponentProps } from "react"

type SearchInputProps = ComponentProps<typeof Input> & {
  classNameDiv?: string | undefined
}

export const SearchInput = ({
  classNameDiv,
  className,
  placeholder,
  ...props
}: SearchInputProps) => {
  return (
    <div className={cn("relative", classNameDiv)}>
      <Input
        type="search"
        className={cn("peer ps-9 pe-9 rounded-full", className)}
        placeholder={placeholder ?? "Pesquisar mensagens..."}
        {...props}
      />
      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
        <SearchIcon size={16} />
      </div>
    </div>
  )
}
