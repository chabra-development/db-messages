import { getSessionOrRedirect } from "@/functions/get-session"
import { LayoutProps } from "@/types/index.types"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }: LayoutProps) {

    const { user } = await getSessionOrRedirect()

    if (user.role !== "ADMIN") redirect("/contacts")

    return <>{children}</>
}
