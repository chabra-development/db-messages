"use server"

import { auth } from "@/lib/auth"

type SignUpEmailInput = {
    email: string
    name: string
    password: string
    identity: string
    teams: string[]
}

export async function signUpEmail({
    email,
    name,
    password,
    identity,
    teams
}: SignUpEmailInput) {

    console.log(identity)

    const { user } = await auth.api.signUpEmail({
        body: {
            email,
            name,
            password,
            identity,
            teams
        },    
    })

    return { user }
}
