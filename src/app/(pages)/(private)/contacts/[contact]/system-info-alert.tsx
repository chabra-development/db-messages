import { formatDate } from "date-fns"
import { CloudSync } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type SystemInfoAlertProps = {
    team: string
    storageDate: string
}

export const SystemInfoAlert = ({
    storageDate, team
}: SystemInfoAlertProps) => {
    return (
        <Alert className="w-full max-w-md mx-auto my-4 flex flex-col bg-secondary">
            <AlertTitle>
                Transferindo para atendente...
            </AlertTitle>
            <AlertDescription>
                fila {team}
            </AlertDescription>
            <AlertDescription className="ml-auto">
                {formatDate(storageDate, "HH:mm")}
            </AlertDescription>
        </Alert>
    )
}
