"use client";

import { useEffect, useRef, useState } from "react";
import { useTelecast } from "@/lib/supabase/hooks";

export function TelecastViewer() {
  const { activeTelecast } = useTelecast();
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef<Set<number>>(new Set());

  // Disable context menu, keyboard shortcuts, and mouse interactions
  useEffect(() => {
    if (showVideo) {
      const preventDefaults = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };

      const preventKeyboard = (e: KeyboardEvent) => {
        // Prevent all keyboard shortcuts that could exit fullscreen or control video
        if (
          e.key === 'Escape' || 
          e.key === 'F11' || 
          e.key === ' ' || 
          e.key === 'Tab' ||
          e.key === 'Enter' ||
          e.altKey || 
          e.ctrlKey || 
          e.metaKey ||
          (e.ctrlKey && e.shiftKey) // Prevent Ctrl+Shift+I (dev tools)
        ) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      // Disable right-click context menu
      document.addEventListener('contextmenu', preventDefaults);
      // Disable keyboard shortcuts
      document.addEventListener('keydown', preventKeyboard);
      // Disable text selection
      document.addEventListener('selectstart', preventDefaults);
      // Disable drag and drop
      document.addEventListener('dragstart', preventDefaults);
      
      // Hide cursor
      document.body.style.cursor = 'none';
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('contextmenu', preventDefaults);
        document.removeEventListener('keydown', preventKeyboard);
        document.removeEventListener('selectstart', preventDefaults);
        document.removeEventListener('dragstart', preventDefaults);
        document.body.style.cursor = 'auto';
        document.body.style.overflow = 'auto';
      };
    }
  }, [showVideo]);

  useEffect(() => {
    if (!activeTelecast?.active) {
      setShowVideo(false);
      return;
    }

    // Show video immediately when telecast is active
    setShowVideo(true);

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (containerRef.current && videoRef.current) {
        
        // Try to play video first
        if (videoRef.current) {
          videoRef.current.muted = false; // Don't mute initially
          videoRef.current.play()
            .then(() => {
              // Then try fullscreen
              if (containerRef.current) {
                containerRef.current.requestFullscreen()
                  .catch(err => console.warn("Fullscreen failed:", err));
              }
            })
            .catch(err => {
              console.error("Play failed:", err);
              // If play fails, try muted autoplay
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play()
                  .then(() => {
                    // Try fullscreen
                    if (containerRef.current) {
                      containerRef.current.requestFullscreen()
                        .catch(err => console.warn("Fullscreen failed:", err));
                    }
                    // Unmute after a delay
                    setTimeout(() => {
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                      }
                    }, 1000);
                  })
                  .catch(err => console.error("Muted play also failed:", err));
              }
            });
        }
      }
    }, 500); // Increased delay

    return () => clearTimeout(timer);
  }, [activeTelecast?.active, activeTelecast?.timestamp]);

  const handleVideoEnd = () => {
    // Mark telecast as completed
    localStorage.setItem('telecastCompleted', 'true');
    
    // Mark as viewed in the database (if we have team info)
    const teamId = localStorage.getItem('teamId');
    if (teamId) {
      fetch("/api/contest/telecast/mark-viewed", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId })
      }).catch(err => console.error("Failed to mark as viewed:", err));
    }
    
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    // Clear telecast state
    fetch("/api/contest/telecast/clear", { method: "POST" });
    
    setShowVideo(false);
  };

  if (!showVideo) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{ cursor: "none" }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        src={typeof activeTelecast?.videoPath === 'string' ? activeTelecast.videoPath : "/infovid.mp4"}
        className="w-full h-full"
        style={{ objectFit: "contain", cursor: "none" }}
        onEnded={handleVideoEnd}
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => e.preventDefault()}
        tabIndex={-1}
      />
    </div>
  );
}
