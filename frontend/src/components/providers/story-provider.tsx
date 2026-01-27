"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { CONTEST_STORY, type StorySegment } from "@/data/story";
import { contestApi } from "@/lib/api-client";

export type StoryContextValue = {
  isOpen: boolean;
  open: (segmentId?: StorySegment["id"]) => void;
  openSegment: (segmentId: StorySegment["id"]) => void;
  close: () => void;
  markSeen: () => Promise<void>;
  hasSeen: boolean;
  loading: boolean;
  activeSegmentId: StorySegment["id"];
  availableSegments: StorySegment[];
  setSegmentScope: (segmentIds?: StorySegment["id"][]) => void;
};

const StoryContext = createContext<StoryContextValue | undefined>(undefined);

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);
  const [loading, setLoading] = useState(false);
  const defaultSegment = CONTEST_STORY.segments[0]?.id ?? "briefing";
  const [activeSegmentId, setActiveSegmentId] = useState<StorySegment["id"]>(defaultSegment);
  const [availableSegmentIds, setAvailableSegmentIds] = useState<string[]>(() =>
    CONTEST_STORY.segments.map((segment) => segment.id),
  );

  const fetchStoryState = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await contestApi.getStoryAck();
      setHasSeen(data.acknowledged || false);
      // Removed auto-open: Story modal will only open when manually triggered
      // if (!data.acknowledged) {
      //   setActiveSegmentId(defaultSegment);
      //   setOpen(true);
      // }
    } catch (error) {
      console.error("Failed to fetch story state", error);
    } finally {
      setLoading(false);
    }
  }, [user, defaultSegment]);

  useEffect(() => {
    if (!user) return;
    fetchStoryState().catch((err) => console.error(err));
  }, [user, fetchStoryState]);

  const markSeen = useCallback(async () => {
    try {
      await contestApi.acknowledgeStory();
      setHasSeen(true);
    } catch (error) {
      console.error("Failed to mark story seen", error);
    }
  }, []);

  const open = useCallback(
    (segmentId?: StorySegment["id"]) => {
      if (segmentId) {
        setActiveSegmentId(segmentId);
      }
      setOpen(true);
    },
    [],
  );

  const openSegment = useCallback((segmentId: StorySegment["id"]) => {
    setActiveSegmentId(segmentId);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const availableSegments = useMemo(
    () => CONTEST_STORY.segments.filter((segment) => availableSegmentIds.includes(segment.id)),
    [availableSegmentIds],
  );

  useEffect(() => {
    if (!availableSegments.length) {
      setAvailableSegmentIds(CONTEST_STORY.segments.map((segment) => segment.id));
      return;
    }
    if (!availableSegments.some((segment) => segment.id === activeSegmentId)) {
      setActiveSegmentId(availableSegments[0].id);
    }
  }, [availableSegments, activeSegmentId]);

  const setSegmentScope = useCallback((segmentIds?: StorySegment["id"][]) => {
    if (!segmentIds || !segmentIds.length) {
      setAvailableSegmentIds(CONTEST_STORY.segments.map((segment) => segment.id));
      return;
    }

    const normalized = Array.from(new Set([defaultSegment, ...segmentIds]));
    setAvailableSegmentIds(
      CONTEST_STORY.segments
        .filter((segment) => normalized.includes(segment.id))
        .map((segment) => segment.id),
    );
  }, [defaultSegment]);

  const value: StoryContextValue = useMemo(
    () => ({
      isOpen,
      open,
      openSegment,
      close,
      hasSeen,
      markSeen,
      loading,
      activeSegmentId,
      availableSegments,
      setSegmentScope,
    }),
    [
      isOpen,
      open,
      openSegment,
      close,
      hasSeen,
      markSeen,
      loading,
      activeSegmentId,
      availableSegments,
      setSegmentScope,
    ],
  );

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStory() {
  const ctx = useContext(StoryContext);
  if (!ctx) {
    throw new Error("useStory must be used within StoryProvider");
  }
  return ctx;
}
