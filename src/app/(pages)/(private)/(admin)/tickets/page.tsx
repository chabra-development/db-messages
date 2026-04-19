import { ImportTicketMessagesButton } from "@/components/forms/form-import-all-tickets/import-ticket-messages-button";
import { ImportTicketsButton } from "@/components/forms/form-import-all-tickets/import-tickets-button";
import { LinkMessagesButton } from "@/components/forms/form-import-all-tickets/link-messages-button";
import { LinkStatsButton } from "@/components/forms/form-import-all-tickets/link-stats-button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ButtonGroup } from "@/components/ui/button-group";
import { getSessionOrRedirect } from "@/functions/get-session";
import { Metadata } from "next";
import { TicketsTableContainer } from "./ticket-query";

export const metadata: Metadata = {
  title: "Tickets | db-messages",
};

export default async function TicketsPage() {
  const { user } = await getSessionOrRedirect();

  const isAdmin = user.role === "ADMIN";

  return (
    <Card className="w-full border-none shadow-none rounded-none">
      <CardHeader>
        <CardTitle className="text-2xl">Tickets</CardTitle>
        <CardDescription>
          Gerencie e visualize todos os tickets importados. Filtre por status,
          fila ou contato.
        </CardDescription>
        {isAdmin && (
          <CardAction>
            <ButtonGroup>
              <ImportTicketsButton />
              <ImportTicketMessagesButton />
              <LinkMessagesButton />
              <LinkStatsButton />
            </ButtonGroup>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <TicketsTableContainer />
      </CardContent>
    </Card>
  );
}
