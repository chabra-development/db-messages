"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteTagDialog } from "./delete-tag-dialog";
import { RenameTagDialog } from "./rename-tag-dialog";

type TagsCardOptionsProps = {
  id: string;
  name: string;
};

export const TagsCardOptions = ({ id, name }: TagsCardOptionsProps) => {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Opções</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <Pencil className="size-4" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameTagDialog
        id={id}
        name={name}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <DeleteTagDialog
        id={id}
        name={name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
};
