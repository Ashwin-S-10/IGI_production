import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let cachedApp: App | null = null;

function readServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return { projectId, clientEmail, privateKey };
}

export function hasFirebaseAdminCredentials(): boolean {
  const { projectId, clientEmail, privateKey } = readServiceAccount();
  return Boolean(projectId && clientEmail && privateKey);
}

function getServiceAccount() {
  const creds = readServiceAccount();
  if (!creds.projectId || !creds.clientEmail || !creds.privateKey) {
    throw new Error("Missing Firebase Admin credentials");
  }

  return creds as { projectId: string; clientEmail: string; privateKey: string };
}

export function getFirebaseAdminApp(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length) {
    cachedApp = getApps()[0];
    return cachedApp;
  }

  const { projectId, clientEmail, privateKey } = getServiceAccount();
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  cachedApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    ...(storageBucket ? { storageBucket } : {}),
  });

  return cachedApp;
}

export const getFirebaseAdminDb = () => getFirestore(getFirebaseAdminApp());
export const getFirebaseAdminStorage = () => getStorage(getFirebaseAdminApp());
