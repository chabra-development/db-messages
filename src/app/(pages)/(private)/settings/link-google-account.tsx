"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { useMutation } from "@tanstack/react-query"
import type { SocialProvider } from "better-auth"
import { CheckCircle2, Link as LinkIcon, Loader2 } from "lucide-react"

export function LinkGoogleAccount() {

    const { data: session } = authClient.useSession()

    const { mutate, isPending: isLoading } = useMutation({
        mutationKey: ["link-accounts"],
        mutationFn: async () => {
            return await authClient.linkSocial({
                provider: "google",
                callbackURL: "/settings"
            })
        },
        onError: (error) => console.log(error)
    })

    if (!session) return null

    console.log(session)

    let hasGoogleLinked = false

    if ("accounts" in session.user) {

        const accounts = session.user.accounts as { provider: SocialProvider }[]

        hasGoogleLinked = accounts.some(
            account => account.provider === "google"
        )
    }

    return (
        <Card className="w-full py-4 border-none pt-0">
            <CardHeader className="px-4">
                <CardTitle>Conta Google</CardTitle>
                <CardDescription>
                    Vincule sua conta Google para login rápido
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4">
                {hasGoogleLinked ? (
                    <div className="flex items-center gap-3 p-4 border rounded-lg bg-green-50">
                        <CheckCircle2 className="size-5 text-green-600" />
                        <div>
                            <p className="font-medium text-green-900">Conta Google vinculada</p>
                            <p className="text-sm text-green-700">
                                Você pode fazer login com Google ou email/senha
                            </p>
                        </div>
                    </div>
                ) : (
                    <Button
                        onClick={() => mutate()}
                        disabled={isLoading}
                        variant="outline"
                        size="lg"
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="size-5 animate-spin" />
                                <span>Conectando...</span>
                            </>
                        ) : (
                            <>
                                <LinkIcon className="size-5" />
                                <span>Vincular conta Google</span>
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}