import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { LimeMediaContent } from "@/types/lime-thread-messages-response.types"
import { ImageIcon, SquarePlay } from "lucide-react"
import dynamic from "next/dynamic"
import Image from "next/image"

const Plyr = dynamic(
  () => import("plyr-react").then(mod => mod.Plyr), { ssr: true }
)

type Message = {
  id: string
  content: LimeMediaContent
  sentAt: Date
}

export const AccordeonSheetContact = ({ messages }: { messages: Message[] }) => {

  const imageMessages = messages.filter((message) => {

    const content = message.content as LimeMediaContent

    return content?.uri && content?.type && content.type.includes("image")
  }).slice(0, 4)

  const videoMessages = messages.filter((message) => {

    const content = message.content as LimeMediaContent

    return content?.uri && content?.type && content.type.includes("video")
  }).slice(0, 4)

  return (
    <Accordion type="multiple">
      <AccordionItem value="images">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <ImageIcon className="size-4" />
            Imagens
          </span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-wrap gap-2">
          {
            imageMessages.map(({ id, content }) => (
              <div
                key={id}
                className="size-25"
              >
                <Image
                  src={content.uri}
                  width={100}
                  height={100}
                  alt={`${id}_image`}
                  className="size-full"
                />
              </div>
            ))
          }
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="videos">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <SquarePlay className="size-4" />
            Videos
          </span>
        </AccordionTrigger>
        <AccordionContent className="flex flex-wrap gap-2">
          {
            videoMessages.map(({ id, content }) => (
              <div
                key={id}
                className="w-1/4 pointer-events-none"
              >
                <Plyr
                  source={{
                    type: "video",
                    sources: [
                      {
                        src: content.uri,
                        type: "video/mp4",
                        size: 160,
                      },
                    ],
                  }}
                  options={{
                    autoplay: false,
                    muted: true,
                    controls: [],
                    clickToPlay: false,
                  }}
                />
              </div>
            ))
          }
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}