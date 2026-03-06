import { togglePinnedContact } from "@/actions/user-preference/toggle-pinned-contact"
import { toast } from "@/components/toast"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { queryClient } from "@/providers/theme-provider"
import { useMutation } from "@tanstack/react-query"
import { Pin, PinOff } from "lucide-react"
import { ContactHeaderDropMenuProps } from "."

export const PinnedButton = ({
    contactId, preferences
}: ContactHeaderDropMenuProps) => {

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
