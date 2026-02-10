import { ChooseATheme } from "@/components/choose-theme"
import { FormUpdateUser } from "@/components/forms/form-update-user"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { UserProfileCard } from "@/components/user-profile-card"
import { auth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
	title: "Configurações | Stock App",
}

export default async function UploadPage() {

	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session) redirect("/sign-in")

	const id = session.user.id

	return (
		<main className="h-dvh w-full flex items-center justify-center px-8 py-4">

			<Card className={cn(
				"w-4/5 justify-between border-primary mx-auto",
				"lg:w-3/5"
			)}>
				<CardHeader>
					<CardTitle>
						Configurações
					</CardTitle>
					<CardDescription>
						Altere as configurações padrões do sistema
					</CardDescription>
				</CardHeader>
				<div className="w-full flex gap-2 px-6">
					<UserProfileCard id={id} />
					<FormUpdateUser className="w-1/2" />
				</div>
				<CardContent className="size-full flex gap-2">
					<Card className="w-full h-max">
						<CardHeader>
							<CardTitle className="text-lg truncate">
								Escolha o tema
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ChooseATheme />
						</CardContent>
					</Card>
				</CardContent>
			</Card>
		</main>
	)
}
