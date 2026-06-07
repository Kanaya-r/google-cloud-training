import Link from "next/link";

export default function Home() {
  return (
    <div>
      <main>
        <h1>Cloud Training</h1>
        <p>Google Cloud 学習用の投稿アプリ。</p>

        <p>
          <Link href="/posts/new">投稿作成</Link>
        </p>
      </main>
    </div>
  );
}
