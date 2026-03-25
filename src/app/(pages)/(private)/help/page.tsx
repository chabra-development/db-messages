import { getSessionOrRedirect } from "@/functions/get-session"
import { Metadata } from "next"
import { HelpClient } from "./help-client"

export const metadata: Metadata = {
    title: "Ajuda | db-messages"
}

export default async function HelpPage() {
    const { user } = await getSessionOrRedirect()

    return <HelpClient isAdmin={user.role === "ADMIN"} />
}
