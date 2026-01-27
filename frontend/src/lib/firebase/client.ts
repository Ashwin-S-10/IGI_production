/**
 * Firebase Client SDK - Storage & Firestore only (Auth not used)
 * Authentication is handled via custom session cookies in /lib/auth/session.ts
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import type { Analytics } from "firebase/analytics";

type FirebaseBrowserConfig = {
  apiKey?: string;
  projectId?: string;
  storageBucket?: string;
  appId?: string;
  measurementId?: string;
};

const firebaseConfig: FirebaseBrowserConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Only require projectId and storageBucket for basic functionality
const requiredKeys = ["projectId", "storageBucket"] as const;
const missingConfigKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

export const isFirebaseConfigured = missingConfigKeys.length === 0;

let firebaseApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;
let cachedStorage: FirebaseStorage | null = null;
let cachedAnalytics: Analytics | null = null;
let analyticsModulePromise: Promise<typeof import("firebase/analytics")> | null = null;

function initializeFirebase(): FirebaseApp | null {
  if (!isFirebaseConfigured) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Firebase client not configured. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET to enable storage features.",
      );
    }
    return null;
  }

  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig as Required<FirebaseBrowserConfig>);
  } else if (!firebaseApp) {
    firebaseApp = getApp();
  }

  return firebaseApp;
}

export function getFirebaseApp(): FirebaseApp | null {
  return firebaseApp ?? initializeFirebase();
}

export function getFirebaseDb(): Firestore | null {
  if (cachedDb) return cachedDb;
  const app = getFirebaseApp();
  if (!app) return null;
  cachedDb = getFirestore(app);
  return cachedDb;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (cachedStorage) return cachedStorage;
  const app = getFirebaseApp();
  if (!app) return null;
  cachedStorage = getStorage(app);
  return cachedStorage;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (cachedAnalytics) return cachedAnalytics;
  if (typeof window === "undefined") return null;
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return null;
  const app = getFirebaseApp();
  if (!app) return null;

  if (!analyticsModulePromise) {
    analyticsModulePromise = import("firebase/analytics");
  }

  const [{ isSupported, getAnalytics }] = await Promise.all([
    analyticsModulePromise,
  ]);

  if (!(await isSupported())) {
    return null;
  }

  cachedAnalytics = getAnalytics(app);
  return cachedAnalytics;
}
