import { CarouselItem } from "@/components/ui/carousel";

export const ImageItem = ({ id, uri }: { id: string; uri: string }) => {
  return (
    <CarouselItem className="h-[55vh] flex items-center justify-center">
      <img
        src={uri}
        alt={`${id}_image`}
        className="max-h-full w-auto max-w-full object-contain rounded-xs"
      />
    </CarouselItem>
  );
};
