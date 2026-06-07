export default function NewPostPage() {
  return (
    <main>
      <h1>投稿作成</h1>

      <form>
        <div>
          <label htmlFor="title">タイトル</label>
          <input id="title" name="title" type="text" />
        </div>

        <div>
          <label htmlFor="body">本文</label>
          <textarea id="body" name="body" />
        </div>

        <div>
          <label htmlFor="image">画像</label>
          <input id="image" name="image" type="file" accept="image/*" />
        </div>

        <button type="submit">投稿する</button>
      </form>
    </main>
  )
}