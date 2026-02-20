"use server"

import { auth } from "@/lib/auth"

export async function GoogleLogin() {
    return await auth.api.signInSocial({
        body: {
            provider: "google",
            callbackURL: "/contacts"
        }
    })
}