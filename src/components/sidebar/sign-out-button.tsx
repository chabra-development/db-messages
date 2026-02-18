"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export const SignOutButton = () => {

	const { push } = useRouter()

	async function SignOut() {
		await authClient.signOut({
			fetchOptions: {
				onRequest: () => push("/sign-in")
			},
		})
	}

	return (
		<DropdownMenuItem onClick={SignOut}>
			<LogOut />
			<span>Sair</span>
		</DropdownMenuItem>
	)
}
