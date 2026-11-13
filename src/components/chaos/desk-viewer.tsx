import desk from "@/assets/chaos-desk.jpg";
import { objects } from "@/lib/chaos";
import { Button } from "@/components/ui/button";
import { ScanLine, Maximize2 } from "lucide-react";
export function DeskViewer({
  compact = false,
  interactive = false,
  image,
  selected,
  onSelect,
}: {
  compact?: boolean;
  interactive?: boolean;
  image?: string | undefined;
  selected?: string | undefined;
  onSelect?: (id: string) => void;
}) {
  const shown = compact ? objects.slice(0, 4) : objects;
  return (
    <div className={`desk-viewer ${compact ? "compact" : ""}`}>
      <div className="viewer-top">
        <span>
          <span className="status-dot" />{" "}
          {image ? "YOUR PHOTO · DEMO DETECTIONS" : "LIVE PREVIEW · DESK_001.JPG"}
        </span>
        <span>
          <ScanLine size={13} /> OBJECT VISION
        </span>
      </div>
      <div className="desk-photo">
        <img
          src={image || desk}
          alt="A messy desk with a coffee mug, headphones, cables, keyboard, notebook and plant"
          width={1536}
          height={1024}
        />
        {shown.map((o) => (
          <Button
            key={o.id}
            variant="object"
            aria-label={o.name}
            disabled={!interactive}
            className={`detection-box box-${o.tone} ${selected === o.id ? "selected" : ""}`}
            style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, height: `${o.h}%` }}
            onClick={() => onSelect?.(o.id)}
          >
            <span className="detection-label">
              {o.label}
              <span> {o.id === "cable" ? "??" : "99%"}</span>
            </span>
          </Button>
        ))}
        <div className="scan-caption">
          <ScanLine size={14} /> SCANNING YOUR CHAOS<span className="scan-dots">...</span>
        </div>
        <span className="photo-corner">
          <Maximize2 size={15} />
        </span>
      </div>
      <div className="viewer-bottom">
        <span>
          <span className="status-dot" /> DEMO DETECTIONS
        </span>
        <span>
          {compact ? "12" : "10"} OBJECTS FOUND <span className="text-primary">✦</span>
        </span>
      </div>
    </div>
  );
}
