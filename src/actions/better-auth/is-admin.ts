import { getUserRole } from "./get-role"

export async function isAdmin() {
	
    const role = await getUserRole()

	return role === "ADMIN"
}