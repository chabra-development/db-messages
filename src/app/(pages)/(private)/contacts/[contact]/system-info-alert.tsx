import { formatDate } from "date-fns"
import { Loader } from "lucide-react"
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
            <div className="w-fit flex items-center gap-2">
                <AlertTitle>
                    Transferindo para atendente...
                </AlertTitle>
                <Loader />
            </div>
            <AlertDescription>
                fila {team}
            </AlertDescription>
            <AlertDescription className="ml-auto">
                {formatDate(storageDate, "HH:mm")}
            </AlertDescription>
        </Alert>
    )
}
