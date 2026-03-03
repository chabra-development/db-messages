"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient, Session } from "@/lib/auth-client"
import { useMutation } from "@tanstack/react-query"
import { Link as LinkIcon, Loader2 } from "lucide-react"

export function LinkGoogleAccount() {

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

    return (
        <Card className="w-full py-4 border-none pt-0">
            <CardHeader className="px-4">
                <CardTitle>Conta Google</CardTitle>
                <CardDescription>
                    Vincule sua conta Google para login rápido
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4">
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
            </CardContent>
        </Card>
    )
}