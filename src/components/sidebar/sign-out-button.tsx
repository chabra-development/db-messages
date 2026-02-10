"use client"

import { LogOut } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export const SignOutButton = () => {
	
	const { push } = useRouter()

	async function SignOut() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => push("/sign-in"),
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
