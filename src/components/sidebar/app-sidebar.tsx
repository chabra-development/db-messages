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

export const AppSidebar = async ({ user }: { user: AuthenticatedUser }) => {
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
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href={"/contacts"}>
										<BookUser />
										<span>
											Contatos
										</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href={"/tickets"}>
										<Tag />
										<span>Tickets</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href={"/attendants?skip=0&take=10"}>
										<UsersRound />
										<span>Atendentes</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<Link href={"/settings"}>
										<Settings />
										<span>Opções</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
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
