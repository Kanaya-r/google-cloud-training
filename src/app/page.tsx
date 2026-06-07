import Link from 'next/link';
import { db } from '@/lib/firebase-admin';
import { getImageSignedUrl } from '@/lib/signed-url';

export default async function HomePage() {
  const snapshot = await db
    .collection('posts')
    .orderBy('createdAt', 'desc')
    .get();

  const posts = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data() as {
        title: string;
        body: string;
        imagePath: string;
        createdAt: string;
      };

      const imageUrl = await getImageSignedUrl(data.imagePath);

      return {
        id: doc.id,
        title: data.title,
        body: data.body,
        imagePath: data.imagePath,
        imageUrl,
        createdAt: data.createdAt,
      };
    })
  );

  return (
    <div>
      <main>
        <h1>Cloud Training</h1>
        <p>Google Cloud 学習用の投稿アプリ。</p>

        <p>
          <Link href="/posts/new">投稿作成</Link>
        </p>

        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/posts/${post.id}`}>
                <img src={post.imageUrl} alt="" width={240} />
                <h2>{post.title}</h2>
                <p>{post.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
