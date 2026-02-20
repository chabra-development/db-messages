import { importContacts } from "@/actions/contacts/import-contacts"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useMutation } from "@tanstack/react-query"
import { Download } from "lucide-react"
import { toast } from "../toast"

export const ImportAllContactsButton = () => {

    const { mutate, isPending } = useMutation({
        mutationKey: ["import-contacts"],
        mutationFn: importContacts,
        onSuccess: () => {
            toast({
                title: "Contatos importados com sucesso",
                variant: "success"
            })
        },
        onError: (error) => {

            console.error(error)

            toast({
                title: "Erro ao importar contatos",
                description: error.message,
                variant: "destructive"
            })
        }
    })

    return (
        <Button
            variant={"secondary"}
            className="w-full "
            disabled={isPending}
            onClick={() => mutate()}
        >
            {
                isPending ? (
                    <>
                        <Spinner />
                        Importando contatos...
                    </>
                ) : (
                    <>
                        <Download />
                        Importar contatos
                    </>
                )
            }
        </Button>
    )
}
