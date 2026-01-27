"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useStory } from "@/components/providers/story-provider";
import { CONTEST_STORY } from "@/data/story";
import { cn } from "@/lib/utils";

export function StoryModal() {
  const { isOpen, close, markSeen, hasSeen, activeSegmentId, openSegment, availableSegments } = useStory();
  const segments = availableSegments.length ? availableSegments : CONTEST_STORY.segments;
  const activeSegment = segments.find((segment) => segment.id === activeSegmentId) ?? segments[0];
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.scrollTo({ top: 0 });
    }
  }, [isOpen]);

  if (!isOpen || !activeSegment) return null;

  const handleClose = () => {
    if (!hasSeen) {
      void markSeen();
    }
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur" onClick={handleClose} />
      <div
        className={cn(
          "relative z-10 w-[75vw] max-w-5xl rounded-3xl border border-white/10",
          "bg-[radial-gradient(circle_at_top,#111d31,#05080f)] p-8 text-white shadow-2xl",
          "max-h-[75vh] flex flex-col",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent">{CONTEST_STORY.subtitle}</p>
            <h2 className="text-3xl font-semibold text-white">{CONTEST_STORY.title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full border border-white/20 p-2 text-white transition hover:border-white hover:text-accent"
            aria-label="Close story"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex w-full flex-wrap gap-2" role="tablist">
          {segments.map((segment) => (
            <button
              key={segment.id}
              role="tab"
              aria-selected={segment.id === activeSegment.id}
              onClick={() => openSegment(segment.id)}
              className={cn(
                "rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition",
                segment.id === activeSegment.id
                  ? "border-accent text-accent"
                  : "border-white/20 text-white/60 hover:border-white/40 hover:text-white",
              )}
            >
              {segment.label}
            </button>
          ))}
        </div>

        <div
          ref={bodyRef}
          className="mt-6 flex-1 overflow-y-auto rounded-2xl border border-white/5 bg-white/5 p-4 pr-2"
        >
          <p className="text-sm leading-relaxed text-white/80 whitespace-pre-line">{activeSegment.body}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">
            {hasSeen ? "Transmission archived" : "Acknowledge to continue"}
          </p>
          <div className="flex gap-3">
            {!hasSeen && (
              <button
                onClick={() => {
                  void markSeen();
                }}
                className="rounded-full border border-accent/40 px-5 py-2 text-sm font-semibold text-accent transition hover:border-accent"
              >
                Acknowledge Brief
              </button>
            )}
            <button
              onClick={handleClose}
              className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
