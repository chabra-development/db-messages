import { findMessagesMediaByContactId } from "@/actions/messages/find-messages-media-by-contact-id";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SheetFooter } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Images } from "lucide-react";
import { AccordeonSheetContact } from "./accordion-sheet-contact";
import { AllMediasDialog } from "./all-medias-dialog";

export const MediaTabs = ({ contactId }: { contactId: string }) => {
  const { data: messagesWithMedia, isLoading } = useQuery({
    queryKey: ["find-many-media-by-contact-id", contactId],
    queryFn: () => findMessagesMediaByContactId(contactId),
  });

  if (!messagesWithMedia || isLoading) {
    return (
      <>
        <Card className="mx-4">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Images />
                <Skeleton />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton />
          </CardContent>
        </Card>
        <SheetFooter>
          <Button disabled variant={"secondary"}>
            <Images />
            Mostrar todas as midias
          </Button>
        </SheetFooter>
      </>
    );
  }

  return (
    <>
      <Card className="mx-4">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Images />
              Medias, links e docs ({messagesWithMedia.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AccordeonSheetContact messages={messagesWithMedia as any} />
        </CardContent>
      </Card>
      <SheetFooter>
        <AllMediasDialog messages={messagesWithMedia as any} />
      </SheetFooter>
    </>
  );
};
