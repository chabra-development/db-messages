"use client"

import { getFileSize } from "@/actions/supabase/get-file-size"
import { getPublicUrl } from "@/actions/supabase/get-public-url"
import { FileTypeIcon } from "@/components/file-type-icon"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { formatBytes } from "@/functions/format-bytes"
import { getMimeLabel } from "@/functions/mime-label"
import { useDownloadFile } from "@/hooks/use-download-file"
import { cn } from "@/lib/utils"
import { MessageDirection } from "@prisma/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { formatDate } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Download, Eye, Loader2 } from "lucide-react"

const OFFICE_MIME_TYPES = new Set([
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
])

function getViewerUrl(publicUrl: string, mimeType: string): string {

    const encoded = encodeURIComponent(publicUrl)

    if (OFFICE_MIME_TYPES.has(mimeType)) {
        return `https://view.officeapps.live.com/op/view.aspx?src=${encoded}`
    }

    return `https://docs.google.com/viewer?url=${encoded}`
}

type ContactMediaFileProps = {
    uri: string
    mimeType: string
    direction: MessageDirection
    date: Date
}

export function ContactMediaFile({ uri, mimeType, direction, date }: ContactMediaFileProps) {

    const isSent = direction === MessageDirection.SENT

    const { download, isDownloading } = useDownloadFile()

    const { data: fileSize } = useQuery({
        queryKey: ["file-size", uri],
        queryFn: () => getFileSize(uri),
        staleTime: Infinity,
    })

    const { mutate: preview, isPending: isPreviewing } = useMutation({
        mutationFn: () => getPublicUrl(uri),
        onSuccess: (url) => window.open(getViewerUrl(url, mimeType), "_blank"),
    })

    return (
        <Card className={cn(
            "max-w-1/2 w-full text-sm",
            isSent
                ? "ml-auto bg-message rounded-tr-none"
                : "mr-auto bg-muted rounded-tl-none"
        )}>
            <CardHeader className="grid-cols-[auto_1fr]">
                <CardAction>
                    <FileTypeIcon
                        mimeType={mimeType}
                        className="size-12"
                    />
                </CardAction>
                <CardTitle>
                    {formatDate(date, "PPP 'às' HH:mm", { locale: ptBR })}
                </CardTitle>
                <CardDescription>
                    {getMimeLabel(mimeType)}
                    {fileSize != null && ` · ${formatBytes(fileSize)}`}
                </CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
                <Button
                    variant="outline"
                    className="flex-1"
                    disabled={isPreviewing}
                    onClick={() => preview()}
                >
                    {isPreviewing
                        ? <Loader2 className="animate-spin" />
                        : <Eye />
                    }
                    Visualizar
                </Button>
                <Button
                    className="flex-1"
                    disabled={isDownloading}
                    onClick={() => download(uri)}
                >
                    {isDownloading
                        ? <Loader2 className="animate-spin" />
                        : <Download />
                    }
                    Baixar
                </Button>
            </CardFooter>
        </Card>
    )
}
