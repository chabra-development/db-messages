"use client"

import { CarouselItem } from "@/components/ui/carousel"
import dynamic from "next/dynamic"

const Plyr = dynamic(
    () => import("plyr-react").then(mod => mod.Plyr), { ssr: false }
)

export const VideoItem = ({ id, uri, type }: { id: string; uri: string; type: string }) => {
    return (
        <CarouselItem className="h-[55vh] flex items-center justify-center">
            <div className="h-full max-w-full [&_.plyr]:h-full [&_.plyr]:w-auto [&_video]:h-full [&_video]:w-auto">
                <Plyr
                    source={{
                        type: "video",
                        sources: [
                            {
                                src: uri,
                                type,
                                size: 1080,
                            },
                        ],
                    }}
                    options={{
                        autoplay: false,
                        controls: [
                            "play",
                            "progress",
                            "volume",
                            "mute",
                            "fullscreen"
                        ],
                    }}
                />
            </div>
        </CarouselItem>
    )
}
