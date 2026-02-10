import { Metadata } from "next"
import { AttendantsQuery } from "./attendants-query"

export const metadata: Metadata = {
    title: "Atendentes | db-messages"
}

export default function Attendents() {
    return <AttendantsQuery />
}