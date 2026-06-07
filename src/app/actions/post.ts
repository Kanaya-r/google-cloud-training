'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/firebase-admin';
import { bucket } from '@/lib/storage';

export async function createPost(formData: FormData) {
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const image = formData.get('image'); // これらはフォーム側の name と一致させる

  if (!title) {
    throw new Error('タイトルは必須です。');
  }

  if (!body) {
    throw new Error('本文は必須です。');
  }

  if (!(image instanceof File) || image.size === 0) {
    throw new Error('画像は必須です。');
  }

  if (!image.type.startsWith('image/')) {
    throw new Error('画像ファイルを選択してください。');
  }

	// Cloud Storageに保存するパスを作る
  const now = new Date();
  const timestamp = now.getTime();
  const safeFileName = image.name.replace(/[^\w.-]/g, '_');
  const imagePath = `posts/${timestamp}-${safeFileName}`;

	// 画像をBufferに変換する
  const arrayBuffer = await image.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

	// Cloud Storageに保存する
  const file = bucket.file(imagePath);

  await file.save(buffer, {
    metadata: {
      contentType: image.type, // contentType で、ブラウザが画像として扱いやすくなる
    },
  });

  const imageUrl = `https://storage.googleapis.com/${bucket.name}/${imagePath}`;

	// Firestoreに投稿データを保存する
  const postRef = await db.collection('posts').add({
    title,
    body,
    imageUrl,
    imagePath,
    createdAt: now.toISOString(),
  });

	// 詳細ページへ移動する
  redirect(`/posts/${postRef.id}`);
}