import { findMessagesByIdentifyContact } from "@/actions/blip/find-messages-by-identify-contact"
import { Metadata } from "next"
import { NextResponse } from "next/server"

export const metadata: Metadata = {
    title: "find many messages"
}

export async function GET() {

    const messages = await findMessagesByIdentifyContact("5521998394721@wa.gw.msging.net")

    return NextResponse.json(messages)
}