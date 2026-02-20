"use client"

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
	BookUser,
	ChevronUp,
	Cog,
	LucideIcon,
	Settings,
	Tag,
	UserCircle2,
	UsersRound
} from "lucide-react"
import Link from "next/link"
import { SidebarModeToggle } from "./sidebar-mode-toogle"
import { SidebarTrigger } from "./sidebar-trigger"
import { SignOutButton } from "./sign-out-button"
import { AuthenticatedUser } from "@/types/auth.types"
import { usePathname } from "next/navigation"
import { Route } from "next"
import { cn } from "@/lib/utils"

type SidebarItem = {
	label: string
	href: Route
	icon: LucideIcon
}

export const AppSidebar = ({ user }: { user: AuthenticatedUser }) => {

	const pathname = usePathname()


	const sidebarMenuItems: SidebarItem[] = [
		{
			label: "Contatos",
			href: "/contacts",
			icon: BookUser
		},
		{
			label: "Tickets",
			href: "/tickets",
			icon: Tag
		},
		{
			label: "Atendentes",
			href: "/attendants?skip=0&take=10",
			icon: UsersRound
		},
		{
			label: "Opções",
			href: "/settings",
			icon: Settings
		},
	] as const

	return (
		<Sidebar
			variant="floating"
			collapsible="icon"
			className="bg-transparent"
		>
			<SidebarContent className="bg-transparent">
				<SidebarGroup>
					<SidebarGroupLabel className="text-primary text-xl mb-4">
						Messages
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarTrigger />
							{
								sidebarMenuItems.map(({
									href, icon: Icon, label
								}) => (
									<SidebarMenuItem key={href}>
										<SidebarMenuButton asChild>
											<Link
												href={href}
												className={cn(pathname.includes(href) && "border border-primary")
												}
											>
												<Icon />
												<span>
													{label}
												</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))
							}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton>
									<UserCircle2 className="size-10" />
									<span>{user.name}</span>
									<ChevronUp className="ml-auto" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top">
								<DropdownMenuItem asChild>
									<Link href={"/settings"}>
										<Cog />
										<span>Opções</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<SidebarModeToggle />
								</DropdownMenuItem>
								<SignOutButton />
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}
