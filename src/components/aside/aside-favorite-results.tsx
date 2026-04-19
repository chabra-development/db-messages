"use client";

import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Contact } from "@prisma/client";
import { Heart } from "lucide-react";
import { ContactCardItem } from "./contact-card-item";

type Props = {
  favoriteContacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (contact: Contact) => void;
};

export function AsideFavoriteResults({
  favoriteContacts,
  activeContactId,
  onSelectContact,
}: Props) {
  return (
    <>
      <CardHeader className="pt-0">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Heart className="size-6" />
          Favoritos
          <Badge variant="secondary" className="h-fit">
            {favoriteContacts.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="px-2 pt-4 pb-6">
        {favoriteContacts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum contato favorito
          </p>
        ) : (
          <div className="space-y-2">
            {favoriteContacts.map((contact) => (
              <ContactCardItem
                key={contact.id}
                contact={contact}
                onClick={() => onSelectContact(contact)}
                isActive={activeContactId === contact.identity}
              />
            ))}
          </div>
        )}
      </CardContent>
    </>
  );
}
