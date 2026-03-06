import { toggleFavoriteContact } from "@/actions/user-preference/toggle-favorite-contact"
import { toast } from "@/components/toast"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { queryClient } from "@/providers/theme-provider"
import { useMutation } from "@tanstack/react-query"
import { Heart, HeartMinus } from "lucide-react"
import { ContactHeaderDropMenuProps } from "."

export const FavoriteContactButton = ({
    contactId, preferences
}: ContactHeaderDropMenuProps) => {

    const { mutate } = useMutation({
        mutationKey: ["toggle-favorite-contact"],
        mutationFn: toggleFavoriteContact,
        onSuccess: ({ favorite }) => {
            toast({
                title: `Contato ${favorite
                    ? "retirado dos"
                    : "adicionado aos"} 
                    favoritos`
            })

            queryClient.invalidateQueries({
                queryKey: ["find-contact-by-id", contactId]
            })
        }
    })

    const myPreferencesExist = (preferences && preferences.favorite) ?? false

    const IconHeart = myPreferencesExist ? HeartMinus : Heart

    function handleToggleFavoriteContact() {
        mutate(contactId)
    }

    return (
        <DropdownMenuItem onClick={handleToggleFavoriteContact}>
            <IconHeart className={cn(
                "text-red-500",
                !myPreferencesExist && "fill-red-500"
            )} />
            {
                myPreferencesExist
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"
            }
        </DropdownMenuItem>
    )
}