import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import { ImportHistoryTableContainer } from "./imports-query";

export const metadata: Metadata = {
  title: "Importações | db-messages",
};

export default async function ImportsPage() {
  return (
    <Card className="w-full border-none shadow-none rounded-none">
      <CardHeader>
        <CardTitle className="text-2xl">Histórico de importações</CardTitle>
        <CardDescription>
          Acompanhe o resultado de cada execução do cron de importação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ImportHistoryTableContainer />
      </CardContent>
    </Card>
  );
}
