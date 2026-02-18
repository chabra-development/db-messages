import { findManyAttendants } from "@/actions/attendants/find-many-attendants"
import { authClient } from "@/lib/auth-client"
import { User } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

export function UseAttendantsQuery() {

    const searchParams = useSearchParams()

    const [search, setSearch] = useState("")
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())

    const take = searchParams.get("take")
    const skip = searchParams.get("skip")

    const { data } = authClient.useSession()

    const {
        data: dataAttendants,
        isLoading
    } = useQuery({
        queryKey: ["find-many-attendants", take, skip],
        queryFn: () => findManyAttendants({
            skip,
            take,
            orderBy: {
                name: "asc"
            }
        })
    })

    if (isLoading || !dataAttendants || !data) return

    const { data: attendants, page, totalPages, count } = dataAttendants

    const uniqueTeams = [
        ...new Set(attendants.flatMap((a) => a.teams ?? [])),
    ].sort()

    const term = search.trim().toLowerCase()
    const hasTeamFilter = selectedTeams.size > 0

    const filteredAttendants = attendants.filter(({ name, email, teams = [] }) => {
        const matchesSearch =
            !term ||
            name.toLowerCase().includes(term) ||
            email.toLowerCase().includes(term) ||
            teams.some((t) => t.toLowerCase().includes(term))

        const matchesTeams = !hasTeamFilter || teams.some((t) => selectedTeams.has(t))

        return matchesSearch && matchesTeams
    })

    const toggleTeam = (team: string) => {
        setSelectedTeams((prev) => {

            const next = new Set(prev)

            if (next.has(team)) next.delete(team)
            else next.add(team)

            return next
        })
    }

    const { role } = data.user as User

    return {
        isLoading,
        dataAttendants,
        data,
        search,
        setSearch,
        uniqueTeams,
        selectedTeams,
        toggleTeam,
        filteredAttendants,
        role,
        term,
        hasTeamFilter,
        page,
        take,
        totalPages,
        count
    }
}