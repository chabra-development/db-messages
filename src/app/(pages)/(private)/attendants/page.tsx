import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Metadata } from "next"
import { AttendantsTableContainer } from "./attendants-query"

export const metadata: Metadata = {
    title: "Atendentes | db-messages"
}

export default function Attendents() {
    return (
        <Card className="w-full border-none shadow-none rounded-none">
            <CardHeader>
                <CardTitle className="text-2xl">
                    Atendentes
                </CardTitle>
                <CardDescription>
                    Liste todos os atendentes cadastrados.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AttendantsTableContainer />
            </CardContent>
        </Card>
    )
}