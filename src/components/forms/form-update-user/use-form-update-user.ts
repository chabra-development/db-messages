import { toast } from "@/components/toast"
import { authClient } from "@/lib/auth-client"
import { 
    FormUpdateUserProps, formUpdateUserSchema 
} from "@/schemas/update-user-schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

export function useformUpdateUser() {

    const { replace } = useRouter()

    const session = authClient.useSession()

    const [visible, setVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<FormUpdateUserProps>({
        resolver: zodResolver(formUpdateUserSchema),
        defaultValues: {
            name: session.data?.user.name,
        },
    })

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = form

    async function onSubmit({
        name,
        currentPassword,
        newPassword,
    }: FormUpdateUserProps) {
        setIsLoading(true)

        const { data, error } = await authClient.updateUser({ name })

        if (data) {
            await authClient.changePassword({
                revokeOtherSessions: true,
                currentPassword,
                newPassword,
                fetchOptions: {
                    onSuccess: () => {
                        setIsLoading(false)

                        toast({
                            title: "Os dados foram atualizados com sucesso.",
                            onAutoClose: async () => {
                                await authClient.signOut({
                                    fetchOptions: {
                                        onSuccess: () => replace("/sign-in"),
                                    },
                                })
                            },
                        })
                    },
                    onError: ({ error }) => {
                        toast({
                            title: error.cause as string,
                            description: error.message,
                            onAutoClose: () => setIsLoading(false),
                            variant: "destructive",
                        })
                    },
                },
            })
        }

        if (error && error.code && error.message) {
            toast({
                title: error.message,
                description: error.statusText,
                onAutoClose: () => setIsLoading(false),
                variant: "destructive",
            })
        }
    }

    return {
        form,
        handleSubmit,
        onSubmit,
        session,
        register,
        errors,
        visible,
        isDirty,
        isLoading,
        setVisible
    }
}