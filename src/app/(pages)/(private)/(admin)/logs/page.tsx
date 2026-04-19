import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import { SystemLogsTableContainer } from "./logs-query";

export const metadata: Metadata = {
  title: "Logs | db-messages",
};

export default async function LogsPage() {
  return (
    <Card className="w-full border-none shadow-none rounded-none">
      <CardHeader>
        <CardTitle className="text-2xl">Logs do sistema</CardTitle>
        <CardDescription>
          Acompanhe importações, jobs e alterações importantes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SystemLogsTableContainer />
      </CardContent>
    </Card>
  );
}
