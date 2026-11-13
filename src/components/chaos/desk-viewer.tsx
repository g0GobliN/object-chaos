import { ScanLine, Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DetectedObject } from "@/lib/mirage/adapter";

const TONES = ["violet", "orange", "lime"] as const;

type DeskViewerProps = {
  image?: string | undefined;
  objects?: DetectedObject[];
  selected?: string | undefined;
  onSelect?: (id: string) => void;
  interactive?: boolean;
  compact?: boolean;
  inferenceMs?: number | undefined;
  caption?: string;
};

export function DeskViewer({
  image,
  objects = [],
  selected,
  onSelect,
  interactive = false,
  compact = false,
  inferenceMs,
  caption,
}: DeskViewerProps) {
  // Smallest boxes last: they sit on top, so a big box never swallows their taps.
  const ordered = [...objects].sort((a, b) => b.area - a.area);
  const shown = compact ? ordered.slice(0, 6) : ordered;
  const total = objects.length;

  return (
    <div className={`desk-viewer ${compact ? "compact" : ""}`}>
      <div className="viewer-top">
        <span>
          <span className="status-dot" /> {caption ?? (image ? "YOUR PHOTO" : "SAMPLE DESK")}
        </span>
        <span>
          <ScanLine size={13} /> MIRAGE · ON-DEVICE
        </span>
      </div>
      <div className="desk-photo">
        {image ? (
          <img
            src={image}
            alt="The photo being analysed"
            width={1536}
            height={1024}
            className="desk-photo-img"
          />
        ) : (
          <div className="desk-photo-empty">
            <ScanLine size={28} />
            <span>Your photo lands here</span>
          </div>
        )}
        {shown.map((object, index) => (
          <Button
            key={object.id}
            variant="object"
            aria-label={`${object.name} (${Math.round(object.confidence * 100)}% confident)`}
            aria-pressed={selected === object.id}
            disabled={!interactive}
            className={`detection-box box-${TONES[index % TONES.length]} ${
              selected === object.id ? "selected" : ""
            }`}
            style={{
              left: `${object.box.x * 100}%`,
              top: `${object.box.y * 100}%`,
              width: `${object.box.width * 100}%`,
              height: `${object.box.height * 100}%`,
            }}
            onClick={() => onSelect?.(object.id)}
          >
            <span className="detection-label">
              {object.name}
              <span>{Math.round(object.confidence * 100)}%</span>
            </span>
          </Button>
        ))}
        <span className="photo-corner">
          <Maximize2 size={15} />
        </span>
      </div>
      <div className="viewer-bottom">
        <span>
          <span className="status-dot" /> REAL DETECTIONS
        </span>
        <span>
          {total} OBJECT{total === 1 ? "" : "S"} FOUND <span className="text-primary">✦</span>
          {typeof inferenceMs === "number" && inferenceMs > 0 ? (
            <span className="viewer-timing"> {Math.round(inferenceMs)} ms</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
