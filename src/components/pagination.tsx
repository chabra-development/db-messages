import { Field, FieldLabel } from "@/components/ui/field"
import {
    Pagination as PagionatioPrimitive,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

type PaginationProps = {
    paginationData: {
        take: string | null
        totalPages: number
        page: number
        count: number
    }

}

export const Pagination = ({
    paginationData: {
        take,
        page,
        totalPages,
        count
    }
}: PaginationProps) => {

    const { push } = useRouter()

    const values: string[] = ["10", "25", "50", "100"]

    const prevPage = page > 1 ? page - 1 : 1
    const prevSkip = (prevPage - 1) * Number(take)

    const nextPage = page < totalPages ? page + 1 : totalPages
    const nextSkip = (nextPage - 1) * Number(take)

    return (
        <div className="flex items-center justify-between gap-4">
            <Field orientation="horizontal" className="w-fit">
                <FieldLabel className="text-muted-foreground">
                    {`(Total de atendetes: ${count})`}
                </FieldLabel>
                <FieldLabel htmlFor="select-rows-per-page">
                    Itens por página
                </FieldLabel>
                <Select
                    defaultValue={take ?? undefined}
                    onValueChange={(value) => push(`/attendants?skip=0&take=${value}`)}
                >
                    <SelectTrigger className="w-20" id="select-rows-per-page">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                        <SelectGroup>
                            {
                                values.map(value => (
                                    <SelectItem
                                        key={value}
                                        value={value}
                                    >
                                        {value}
                                    </SelectItem>
                                ))
                            }
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>
            <PagionatioPrimitive className="mx-0 w-auto">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href={`/attendants?skip=${prevSkip}&take=${take}`}
                            aria-disabled={page === 1}
                            className={cn(page === 1 && "opacity-60")}
                        />
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationNext
                            href={`/attendants?skip=${nextSkip}&take=${take}`}
                            aria-disabled={page === totalPages}
                            className={cn(page === totalPages && "opacity-60")}
                        />
                    </PaginationItem>
                </PaginationContent>
            </PagionatioPrimitive>
        </div>
    )
}
