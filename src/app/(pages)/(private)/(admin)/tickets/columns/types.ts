import { TicketStatus } from "@prisma/client";

export type TicketRow = {
  id: string;
  blipId: string;
  sequentialId: number;
  status: TicketStatus;
  team: string;
  customerIdentity: string;
  agentIdentity: string | null;
  openDate: Date | null;
  closeDate: Date | null;
  messageCount: number;
  closed: boolean;
  closedBy: string | null;
};
