import { Storage } from '@google-cloud/storage';

export const storage = new Storage();

export const bucket = storage.bucket(
  process.env.GOOGLE_CLOUD_STORAGE_BUCKET as string
);
