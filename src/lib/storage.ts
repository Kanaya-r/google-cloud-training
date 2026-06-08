import { Storage } from '@google-cloud/storage';

export const storage = new Storage();

export function getBucket() {
  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

  if (!bucketName) {
    throw new Error('GOOGLE_CLOUD_STORAGE_BUCKET is not set.');
  }

  return storage.bucket(bucketName);
}