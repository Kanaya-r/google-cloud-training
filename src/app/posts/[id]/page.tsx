import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase-admin';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  const doc = await db.collection('posts').doc(id).get();

  if (!doc.exists) {
    notFound();
  }

  const post = doc.data() as {
    title: string;
    body: string;
    imageUrl: string;
    imagePath: string;
    createdAt: string;
  };

  return (
    <main>
      <h1>{post.title}</h1>

      <img src={post.imageUrl} alt="" width={640} />

      <p>{post.body}</p>

      <time dateTime={post.createdAt}>
        {new Date(post.createdAt).toLocaleString('ja-JP')}
      </time>
    </main>
  );
}