"use client"

import { SpanErrorMessage } from "@/components/span-error"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { ComponentProps } from "react"
import { FormProvider } from "react-hook-form"
import { useformUpdateUser } from "./use-form-update-user"

export const FormUpdateUser = (props: ComponentProps<"form">) => {

	const {
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
	} = useformUpdateUser()

	return (
		<FormProvider {...form}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				{...props}
			>
				<Card className="size-full">
					<CardHeader>
						<CardTitle className="text-lg">Editar informações</CardTitle>
						<CardDescription>Editar informações pessoais</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Input
								defaultValue={session.data?.user.name}
								placeholder="Nome do usuário"
								{...register("name")}
								className={cn(
									errors.name && [
										"focus-visible:ring-destructive",
										"not-focus-visible:border-destructive",
									]
								)}
							/>
							{errors.name && (
								<SpanErrorMessage message={errors.name.message} />
							)}
						</div>
						<div className="space-y-2">
							<Input
								type={visible ? "text" : "password"}
								placeholder="Senha atual"
								{...register("currentPassword")}
								className={cn(
									errors.currentPassword && [
										"focus-visible:ring-destructive",
										"not-focus-visible:border-destructive",
									]
								)}
							/>
							{errors.currentPassword && (
								<SpanErrorMessage message={errors.currentPassword.message} />
							)}
						</div>
						<div className="space-y-2">
							<Input
								type={visible ? "text" : "password"}
								placeholder="Nova senha"
								{...register("newPassword")}
								className={cn(
									errors.newPassword && [
										"focus-visible:ring-destructive",
										"not-focus-visible:border-destructive",
									]
								)}
							/>
							{errors.newPassword && (
								<SpanErrorMessage message={errors.newPassword.message} />
							)}
							<Button
								type="button"
								variant={"link"}
								className="p-0"
								onClick={() => setVisible(visible => !visible)}>
								{visible ? "esconder senha" : "mostrar senha"}
							</Button>
						</div>
					</CardContent>
					<CardFooter className="justify-end">
						<Button
							type="submit"
							className="w-full"
							disabled={!isDirty || isLoading}>
							{isLoading ? <Loader2 className="animate-spin" /> : "Confirmar"}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</FormProvider>
	)
}
