import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width === Math.round(rect.width * ratio) && canvas.height === Math.round(rect.height * ratio)) return;
    const previous = document.createElement("canvas");
    previous.width = canvas.width;
    previous.height = canvas.height;
    previous.getContext("2d")?.drawImage(canvas, 0, 0);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2.25;
    context.strokeStyle = "#17202a";
    if (previous.width && previous.height) context.drawImage(previous, 0, 0, previous.width, previous.height, 0, 0, rect.width, rect.height);
  }, []);

  useEffect(() => {
    resize();
    const observer = new ResizeObserver(resize);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [resize]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPoint.current = point(event);
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !lastPoint.current) return;
    event.preventDefault();
    const next = point(event);
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    context.beginPath();
    context.moveTo(lastPoint.current.x, lastPoint.current.y);
    context.lineTo(next.x, next.y);
    context.stroke();
    lastPoint.current = next;
    hasInkRef.current = true;
    setEmpty(false);
  };

  const finish = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    drawingRef.current = false;
    lastPoint.current = null;
    if (hasInkRef.current) onChange(event.currentTarget.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    hasInkRef.current = false;
    setEmpty(true);
    onChange(null);
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-[var(--radius-control)] border-2 border-input bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
        <canvas
          ref={canvasRef}
          width={640}
          height={190}
          className="block h-48 w-full cursor-crosshair touch-none focus:outline-none"
          aria-label="Draw your signature"
          role="img"
          tabIndex={0}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={finish}
        />
        {empty && <p className="pointer-events-none absolute inset-x-4 bottom-4 border-b border-muted-foreground/40 pb-2 text-center text-sm text-muted-foreground">Sign here with your finger, mouse, or stylus</p>}
      </div>
      <Button type="button" variant="ghost" size="sm" className="mt-2 min-h-11" onClick={clear} disabled={empty}>
        <Eraser className="me-2 h-4 w-4" aria-hidden="true" /> Clear signature
      </Button>
    </div>
  );
}
