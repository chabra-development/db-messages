export type { TicketRow } from "./types"

import type { ColumnDef } from "@tanstack/react-table"
import type { TicketRow } from "./types"

import { actionsColumn } from "./actions"
import { agentIdentityColumn } from "./agent-identity"
import { closeDateColumn } from "./close-date"
import { customerIdentityColumn } from "./customer-identity"
import { messageCountColumn } from "./message-count"
import { openDateColumn } from "./open-date"
import { sequentialIdColumn } from "./sequential-id"
import { statusColumn } from "./status"
import { teamColumn } from "./team"

export const columns: ColumnDef<TicketRow>[] = [
    actionsColumn,
    sequentialIdColumn,
    statusColumn,
    teamColumn,
    customerIdentityColumn,
    agentIdentityColumn,
    openDateColumn,
    closeDateColumn,
    messageCountColumn,
]
