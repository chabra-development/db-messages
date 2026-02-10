"use client"

import {
    findContactIdByNumberPhone
} from "@/actions/blip/find-contact-id-by-number-phone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { BlipAccountResponse } from "@/types/blip-account-response.types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import z from "zod"

const Schema = z.object({
    numberPhone: z
        .string()
        .trim()
        .transform((value) => value.replace(/\D/g, ""))
        .superRefine((value, ctx) => {
            // Remove o 55 se existir
            const phone = value.startsWith("55") ? value.slice(2) : value;

            // 🔹 Validação de tamanho
            if (![10, 11].includes(phone.length)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        "O telefone deve conter DDD + número (10 dígitos para fixo ou 11 para celular).",
                });
                return;
            }

            const ddd = phone.slice(0, 2);
            const number = phone.slice(2);

            // 🔹 Validação do DDD
            if (ddd.startsWith("0")) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "DDD inválido. O DDD não pode começar com 0.",
                });
            }

            // 🔹 Validação do número
            if (number.length === 9) {
                // Celular
                if (!number.startsWith("9")) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Número de celular inválido. Deve começar com 9.",
                    });
                }
            } else if (number.length === 8) {
                // Fixo
                if (!/^[2-5]/.test(number)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            "Número fixo inválido. Deve começar com 2, 3, 4 ou 5.",
                    });
                }
            }
        })
})

type FormData = z.infer<typeof Schema>

export default function Home() {

    const [data, setData] = useState<BlipAccountResponse | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(Schema)
    })

    async function onSubmit({ numberPhone }: FormData) {

        const result = await findContactIdByNumberPhone(numberPhone)
        setData(result)
    }

    return (
        <Card className="flex-1">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="contents"
            >
                <CardContent>
                    <Input
                        type="tel"
                        {...register("numberPhone")}
                    />
                    {
                        errors.numberPhone && (
                            <span className="text-sm text-red-500">
                                {errors.numberPhone.message}
                            </span>
                        )
                    }
                </CardContent>
                <CardFooter>
                    <Button type="submit">
                        Enviar
                    </Button>
                </CardFooter>
            </form>
            <Separator />
            {
                data && (
                    <CardContent>
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                    </CardContent>
                )
            }
        </Card>
    )
}
