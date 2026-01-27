export const ROUND2_PASSWORD = "123";
export const ROUND2_ACCESS_KEY = "mission:round2:unlocked";

export function readRound2Access(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.sessionStorage.getItem(ROUND2_ACCESS_KEY) === "true";
}

export function persistRound2Access(accessGranted: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(ROUND2_ACCESS_KEY, accessGranted ? "true" : "false");
  } catch (error) {
    console.warn("Failed to persist round access", error);
  }
}
