"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { type DateRange } from "react-day-picker"
import { ptBR } from "date-fns/locale"

type CaledarRangeProps = {
    value?: DateRange
    onChange?: (range: DateRange | undefined) => void
}

export const CaledarRange = ({ value, onChange }: CaledarRangeProps) => {

    return (
        <Card className="border-none py-2">
            <CardContent className="px-2">
                <Calendar
                    mode="range"
                    selected={value}
                    onSelect={onChange}
                    locale={ptBR}
                    disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                    }
                    className="border-none size-full"
                />
            </CardContent>
        </Card>
    )
}
