"use client";

import { useEffect, useMemo, useState } from "react";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const DEFAULT_TARGET = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString();

function getTimeLeft(targetIso: string): TimeLeft {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const delta = Math.max(target - now, 0);

  const days = Math.floor(delta / (1000 * 60 * 60 * 24));
  const hours = Math.floor((delta / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((delta / (1000 * 60)) % 60);
  const seconds = Math.floor((delta / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export function CountdownTimer({ targetDate }: { targetDate?: string }) {
  const target = useMemo(() => targetDate ?? DEFAULT_TARGET, [targetDate]);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Object.entries(timeLeft).map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center shadow-md"
        >
          <p className="text-3xl font-semibold text-accent">
            {value.toString().padStart(2, "0")}
          </p>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">{label}</p>
        </div>
      ))}
    </div>
  );
}
