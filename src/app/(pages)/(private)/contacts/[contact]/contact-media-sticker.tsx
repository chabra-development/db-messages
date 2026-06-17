"use client";

import { Card, CardDescription, CardFooter } from "@/components/ui/card";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { cn } from "@/lib/utils";
import { MessageDirection } from "@prisma/client";
import { formatDate } from "date-fns";
import Image from "next/image";

export const ContactMediaSticker = ({
  direction,
  date,
  uri,
  type,
}: {
  direction: MessageDirection;
  date: Date;
  uri: string;
  type: string;
}) => {
  const isSent = direction === MessageDirection.SENT;

  // SEC-01: pre-signed URL no render (bucket não é mais anônimo).
  const { data: signedUrl } = useSignedUrl(uri);

  return (
    <Card className="bg-transparent border-none shadow-none gap-1">
      {signedUrl ? (
        <Image
          src={signedUrl}
          width={200}
          height={200}
          alt={`figurinha ${type}`}
          className="relative size-32"
        />
      ) : (
        <div className="relative size-32 rounded-md bg-muted animate-pulse" />
      )}
      <CardFooter
        className={cn(
          "w-fit ml-auto rounded-sm p-1",
          isSent ? "bg-message" : "dark:bg-muted bg-zinc-100",
        )}
      >
        <CardDescription>{formatDate(date, "HH:mm")}</CardDescription>
      </CardFooter>
    </Card>
  );
};
