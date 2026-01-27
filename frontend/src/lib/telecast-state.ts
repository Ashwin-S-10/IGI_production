// Shared telecast state for Next.js API routes
export interface TelecastState {
  active: boolean;
  triggeredAt: string | null;
  timestamp: number | null;
  videoPath: string;
  title?: string;
}

let globalTelecastState: TelecastState = {
  active: false,
  triggeredAt: null,
  timestamp: null,
  videoPath: '/infovid.mp4',
  title: undefined,
};

export function getTelecastState(): TelecastState {
  return { ...globalTelecastState };
}

export function setTelecastState(state: Partial<TelecastState>): TelecastState {
  globalTelecastState = { ...globalTelecastState, ...state };
  return { ...globalTelecastState };
}

export function triggerTelecast(videoPath: string, title?: string): TelecastState {
  // Ensure videoPath is always a string
  const validVideoPath = typeof videoPath === 'string' ? videoPath : '/infovid.mp4';
  
  return setTelecastState({
    active: true,
    triggeredAt: new Date().toISOString(),
    timestamp: Date.now(),
    videoPath: validVideoPath,
    title,
  });
}

export function clearTelecast(): TelecastState {
  return setTelecastState({
    active: false,
    triggeredAt: null,
    timestamp: null,
    videoPath: '/infovid.mp4',
    title: undefined,
  });
}