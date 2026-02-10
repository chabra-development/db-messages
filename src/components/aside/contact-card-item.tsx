import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { normalizeWhatsAppIdentify } from "@/functions/validate-identify"
import { phoneNumberBRSchema } from "@/functions/validate-phone-number"
import { cn } from "@/lib/utils"
import { LimeContact } from "@/types/lime-collection-response.types"
import { formatDate } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Ellipsis } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type ContactCardItemProps = { limeContact: LimeContact }

export const ContactCardItem = ({ limeContact }: ContactCardItemProps) => {

    const pathname = usePathname().slice(1)

    const {
        identity,
        name,
        ...rest
    } = limeContact

    const contact = normalizeWhatsAppIdentify(identity)

    const { data } = phoneNumberBRSchema.safeParse(rest.phoneNumber)

    const lastMessageDate = (
        rest.lastMessageDate
            ? formatDate(
                rest.lastMessageDate, "dd 'de' MMM 'de' yyyy 'às' HH:mm",
                { locale: ptBR }
            )
            : null
    )

    return (
        <Link
            href={`/contacts/${contact}`}
            className="group"
        >
            <Card className={cn(
                "size-full transition-all my-2",
                "group-hover:bg-card/60 group-hover:border-2 group-hover:scale-95",
                pathname.includes(contact) && "bg-secondary border-none"
            )}>

                <CardHeader>
                    <CardTitle className="truncate font-semibold capitalize">
                        {name}
                    </CardTitle>
                    {
                        data && (
                            <CardDescription>
                                {data}
                            </CardDescription>
                        )
                    }
                    <CardAction>
                        <Button variant={"ghost"}>
                            <Ellipsis />
                        </Button>
                    </CardAction>
                </CardHeader>
                {
                    lastMessageDate && (
                        <CardFooter>
                            <CardDescription className="font-extralight">
                                {lastMessageDate}
                            </CardDescription>
                        </CardFooter>
                    )
                }
            </Card>
        </Link>
    )
}
