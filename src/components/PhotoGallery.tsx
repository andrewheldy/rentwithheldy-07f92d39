import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PhotoGalleryLabels {
  open: string;
  close: string;
  previous: string;
  next: string;
  thumbnail: string;
  photo: string;
}

interface PhotoGalleryProps {
  images: string[];
  alt: string;
  labels?: Partial<PhotoGalleryLabels>;
  priority?: boolean;
  className?: string;
}

const DEFAULT_LABELS: PhotoGalleryLabels = {
  open: "Open photo gallery",
  close: "Close photo gallery",
  previous: "Previous photo",
  next: "Next photo",
  thumbnail: "Show photo",
  photo: "Photo",
};

const PhotoGallery = ({
  images,
  alt,
  labels,
  priority = false,
  className,
}: PhotoGalleryProps) => {
  const copy = { ...DEFAULT_LABELS, ...labels };
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const pointerMoved = useRef(false);

  if (images.length === 0) return null;

  const goToPrevious = () => {
    setSelectedIndex((previous) =>
      previous === 0 ? images.length - 1 : previous - 1,
    );
  };

  const goToNext = () => {
    setSelectedIndex((previous) =>
      previous === images.length - 1 ? 0 : previous + 1,
    );
  };

  const onPointerDown = (event: React.PointerEvent) => {
    pointerStart.current = event.clientX;
    pointerMoved.current = false;
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(delta) < 45) return;
    pointerMoved.current = true;
    if (delta < 0) goToNext();
    else goToPrevious();
  };

  const galleryImage = (
    <img
      src={images[selectedIndex]}
      alt={`${alt} — ${copy.photo} ${selectedIndex + 1}`}
      width={1600}
      height={1200}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className="h-full w-full object-cover transition-transform duration-300 ease-out-expo group-hover:scale-[1.015]"
    />
  );

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="group relative aspect-[4/3] overflow-hidden rounded-card bg-secondary shadow-card"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <button
          type="button"
          className="absolute inset-0 h-full w-full touch-pan-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          onClick={() => {
            if (pointerMoved.current) {
              pointerMoved.current = false;
              return;
            }
            setLightboxOpen(true);
          }}
          aria-label={`${copy.open}: ${alt}`}
        >
          {galleryImage}
          <span className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
            <Expand className="h-3.5 w-3.5" aria-hidden="true" />
            {selectedIndex + 1} / {images.length}
          </span>
        </button>

        {images.length > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-card/95 opacity-100 shadow-card sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              onClick={goToPrevious}
              aria-label={copy.previous}
            >
              <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-card/95 opacity-100 shadow-card sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              onClick={goToNext}
              aria-label={copy.next}
            >
              <ChevronRight className="h-5 w-5 rtl:-scale-x-100" />
            </Button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-0.5 pb-2 [scrollbar-width:thin]"
          role="tablist"
          aria-label={alt}
        >
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              role="tab"
              aria-selected={selectedIndex === index}
              aria-label={`${copy.thumbnail} ${index + 1}`}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "h-16 w-20 shrink-0 snap-start overflow-hidden rounded-control border-2 bg-secondary transition-[border-color,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-20 sm:w-28",
                selectedIndex === index
                  ? "border-primary opacity-100"
                  : "border-transparent opacity-65 hover:opacity-100",
              )}
            >
              <img
                src={image}
                alt=""
                width={160}
                height={120}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          closeLabel={copy.close}
          className="h-[min(92vh,900px)] w-[calc(100vw-1rem)] max-w-6xl border-0 bg-ink p-2 text-white shadow-elevated sm:rounded-card [&>button]:text-white"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <DialogDescription className="sr-only">
            {copy.photo} {selectedIndex + 1} / {images.length}
          </DialogDescription>
          <div className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-control">
            <img
              src={images[selectedIndex]}
              alt={`${alt} — ${copy.photo} ${selectedIndex + 1}`}
              width={1600}
              height={1200}
              className="max-h-full max-w-full select-none object-contain"
            />
            {images.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-card/90 text-foreground"
                  onClick={goToPrevious}
                  aria-label={copy.previous}
                >
                  <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-card/90 text-foreground"
                  onClick={goToNext}
                  aria-label={copy.next}
                >
                  <ChevronRight className="h-5 w-5 rtl:-scale-x-100" />
                </Button>
              </>
            )}
            <span className="absolute bottom-3 start-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white rtl:translate-x-1/2">
              {selectedIndex + 1} / {images.length}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoGallery;
