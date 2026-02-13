import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "altera cargo atendente | db-messages"
}

export default function ChangeRole() {
    return (
        <Card className="size-full rounded-none border-none">
            <CardHeader>
                <CardTitle>
                    Alterar cardo de atendete
                </CardTitle>
            </CardHeader>
        </Card>
    )
}