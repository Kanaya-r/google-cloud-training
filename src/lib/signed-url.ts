import { getBucket } from '@/lib/storage';

export async function getImageSignedUrl(imagePath: string) {
  const bucket = getBucket();

  const [signedUrl] = await bucket.file(imagePath).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000,
  });

  return signedUrl;
}
