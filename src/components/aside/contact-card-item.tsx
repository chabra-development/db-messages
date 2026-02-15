'use client'

import {
    normalizeWhatsAppIdentify
} from "@/functions/normalize-whatsapp-identify"
import { cn } from "@/lib/utils"
import { LimeContact } from "@/types/lime-collection-response.types"
import { Phone } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card"
import Link from "next/link"
interface ContactCardItemProps {
    limeContact: LimeContact
    searchQuery?: string
    onClick?: () => void
    isActive?: boolean
}

export function ContactCardItem({
    limeContact,
    searchQuery,
    onClick,
    isActive = false
}: ContactCardItemProps) {

    const identity = normalizeWhatsAppIdentify(limeContact.identity)
    const name = limeContact.name || "Sem nome"

    // Função para destacar o texto da busca
    const highlightText = (text: string) => {

        if (!searchQuery || !searchQuery.trim()) {
            return <span>{text}</span>
        }

        const query = searchQuery.toLowerCase().trim()
        const lowerText = text.toLowerCase()
        const index = lowerText.indexOf(query)

        if (index === -1) {
            return <span>{text}</span>
        }

        const before = text.slice(0, index)
        const match = text.slice(index, index + query.length)
        const after = text.slice(index + query.length)

        return (
            <span>
                {before}
                <mark className="bg-yellow-200 dark:bg-yellow-900/50 text-foreground font-medium rounded px-0.5">
                    {match}
                </mark>
                {after}
            </span>
        )
    }

    return (
        <Link
            onNavigate={onClick}
            href={`/contacts/${identity}`}
            prefetch
        >
            <Card className={cn(
                "w-full",
                "hover:bg-muted/70 active:bg-muted",
                "transition-all duration-200",
                "text-left group",
                isActive && "bg-muted border-border"
            )} >
                <CardHeader className="flex-1 min-w-0">
                    <CardTitle className={cn(
                        "font-medium text-base truncate transition-colors",
                        "group-hover:text-primary",
                        isActive && "text-primary"
                    )}>
                        {highlightText(name)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                        <Phone className="size-3" />
                        <span className="truncate">
                            {limeContact.phoneNumber}
                        </span>
                    </CardDescription>
                </CardHeader>
            </Card>
        </Link>
    )
}