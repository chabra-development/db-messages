import { ImportTicketMessagesButton } from "@/components/forms/form-import-all-tickets/import-ticket-messages-button";
import { ImportTicketsButton } from "@/components/forms/form-import-all-tickets/import-tickets-button";
import { LinkMessagesButton } from "@/components/forms/form-import-all-tickets/link-messages-button";
import { LinkStatsButton } from "@/components/forms/form-import-all-tickets/link-stats-button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import { ImportHistoryTableContainer } from "./imports-query";
import { RunningJobsQuery } from "./running-jobs-query";

export const metadata: Metadata = {
  title: "Importações | db-messages",
};

export default async function ImportsPage() {
  return (
    <Card className="w-full border-none shadow-none rounded-none">
      <CardHeader>
        <CardTitle className="text-2xl">Importações</CardTitle>
        <CardDescription>
          Dispare uma nova importação ou acompanhe o histórico de execuções.
        </CardDescription>
        <CardAction>
          <ButtonGroup>
            <ImportTicketsButton />
            <ImportTicketMessagesButton />
            <LinkMessagesButton />
            <LinkStatsButton />
          </ButtonGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Em andamento</h2>
          <RunningJobsQuery />
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Histórico</h2>
          <ImportHistoryTableContainer />
        </section>
      </CardContent>
    </Card>
  );
}
