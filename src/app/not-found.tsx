import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Home, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="h-dvh w-full flex items-center justify-center p-8 max-sm:px-4">
      <Card className="w-full xl:w-2/5 border-primary justify-between">
        <CardHeader>
          <div className="mx-auto mb-2 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <SearchX className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-center text-2xl">
            Página não encontrada
          </CardTitle>
          <CardDescription className="text-center">
            O recurso que você está procurando não existe ou foi movido.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <span className="text-6xl font-bold text-muted-foreground/30 tabular-nums select-none">
            404
          </span>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/contacts">
              <Home />
              Voltar ao início
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
