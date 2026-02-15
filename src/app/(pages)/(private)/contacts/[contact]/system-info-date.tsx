import { Badge } from "@/components/ui/badge"
import { formatChatDate } from "@/functions/format-chat-date"
import { LimeThreadMessage } from "@/types/lime-thread-messages-response.types"
import { isSameDay } from "date-fns"

type SystemInfoDateProps = {
    date: string
    index: number
    array: LimeThreadMessage[]
}

export const SystemInfoDate = ({
    date, index, array
}: SystemInfoDateProps) => {

    const currentDate = new Date(date)

    const previousDate = (
        index > 0 ? new Date(array[index - 1].date) : null
    )

    const showDateDivider = (
        !previousDate || !isSameDay(currentDate, previousDate)
    )

    if (showDateDivider) {
        return (
            <Badge
                variant="secondary"
                className="text-xs mx-auto py-2 px-4 mb-3"
            >
                {formatChatDate(currentDate)}
            </Badge>
        )
    }
}
