import { togglePinnedContact } from "@/actions/user-preference/toggle-pinned-contact"
import { toast } from "@/components/toast"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { queryClient } from "@/providers/theme-provider"
import { ContactUserPreference } from "@prisma/client"
import { useMutation } from "@tanstack/react-query"
import { Pin, PinOff } from "lucide-react"

type PinnedButtonProps = {
    contactId: string
    preferences: ContactUserPreference
}

export const PinnedButton = ({
    contactId, preferences
}: PinnedButtonProps) => {

    const { mutate } = useMutation({
        mutationKey: ["toggle-favorite-contact"],
        mutationFn: togglePinnedContact,
        onSuccess: ({ pinned }) => {
            toast({
                title: `Contato ${pinned
                    ? "retirado dos"
                    : "adicionado aos"} 
                    fixados`
            })

            queryClient.invalidateQueries({
                queryKey: ["find-contact-by-id", contactId]
            })
        }
    })

    const myPreferencesExist = (preferences && preferences.pinned) ?? false

    const IconPin = myPreferencesExist ? PinOff : Pin

    function handleTogglePinnedContact() {
        mutate(contactId)
    }

    return (
        <DropdownMenuItem onClick={handleTogglePinnedContact}>
            <IconPin className={cn(!myPreferencesExist && "fill-primary")} />
            {
                myPreferencesExist
                    ? "Retirar dos fixados"
                    : "Fixar contato"
            }
        </DropdownMenuItem>
    )
}
