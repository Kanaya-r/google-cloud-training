import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
}

export const db = getFirestore();
