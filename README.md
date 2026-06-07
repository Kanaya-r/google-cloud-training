# google-cloud-training

Google Cloud の学習を目的とした、シンプルな Next.js アプリケーションです。

タイトル・本文・画像1枚を投稿し、投稿データを Firestore に保存し、画像ファイルを Cloud Storage に保存します。

画像ファイルは Cloud Storage の非公開バケットに保存し、表示時には Next.js 側で署名付きURLを発行して表示します。

## 目的

このアプリケーションでは、Next.js アプリケーションを題材にして、Google Cloud の基本的なサービス連携を学習します。

学習対象は以下です。

* Cloud Run：Next.js アプリケーションをデプロイする
* Firestore：投稿データを保存する
* Cloud Storage：画像ファイルを保存する
* 署名付きURL：非公開バケットの画像を一時的に表示する
* IAM / サービスアカウント：権限管理の基本を学ぶ
* 環境変数：ローカル環境と本番環境で設定値を切り替える

## アプリケーション概要

### 作成する機能

* 投稿一覧表示
* 投稿詳細表示
* 投稿作成

  * タイトル
  * 本文
  * 画像1枚

### 現時点で作成しない機能

* ログイン機能
* 投稿編集
* 投稿削除
* 画像削除
* GitHub Actions による自動デプロイ

## 使用技術

### フロントエンド / アプリケーション

* Next.js 15
* React
* TypeScript
* App Router
* Server Actions

### Google Cloud

* Cloud Run
* Firestore
* Cloud Storage
* Cloud Build
* Artifact Registry
* IAM
* サービスアカウント

## 構成イメージ

```txt
ユーザーのブラウザ
  ↓
Next.js アプリケーション
  ↓
Firestore / Cloud Storage
```

本番環境では、Next.js アプリケーションを Cloud Run 上で動かします。

```txt
ユーザーのブラウザ
  ↓
Cloud Run 上の Next.js アプリケーション
  ↓
Firestore / Cloud Storage
```

Firestore や Cloud Storage へは、ブラウザから直接アクセスしません。

ブラウザからのリクエストを Next.js のサーバー側処理で受け取り、Next.js から Google Cloud の各サービスへアクセスします。

## データの役割

### Firestore

Firestore には、投稿のテキスト情報と画像の保存パスを保存します。

```txt
posts
  postId
    title
    body
    imagePath
    createdAt
```

Firestore に画像ファイルそのものは保存しません。

また、署名付きURLは有効期限があるため、Firestore には保存しません。

画像表示が必要なタイミングで、`imagePath` をもとに Next.js 側で署名付きURLを発行します。

### Cloud Storage

Cloud Storage には、画像ファイル本体を保存します。

保存パスの例です。

```txt
posts/{timestamp}-{fileName}
```

Cloud Storage のバケットは非公開にします。

画像を表示する際は、通常の公開URLではなく、Next.js 側で発行した署名付きURLを使用します。

## 画像表示の流れ

```txt
Firestore
  ↓
imagePath を取得
  ↓
Next.js サーバー側で署名付きURLを発行
  ↓
ブラウザの img src に署名付きURLを指定
  ↓
Cloud Storage の非公開画像を一時的に表示
```

署名付きURLは、一定時間だけ有効なURLです。

現在は、以下のように15分間有効なURLを発行しています。

```ts
expires: Date.now() + 15 * 60 * 1000
```

有効期限が切れると、そのURLでは画像にアクセスできなくなります。

ただし、Cloud Storage 上の画像ファイル自体が削除されるわけではありません。
ページを再読み込みして新しい署名付きURLを発行すれば、再び画像を表示できます。

## Google Cloud 側の設定

### 有効化する API

以下の API を有効化します。

```txt
Cloud Run API
Cloud Build API
Artifact Registry API
Firestore API
Cloud Storage API
```

## Firestore の作成方針

### データベースモード

Firestore は以下で作成します。

```txt
ネイティブ モードの Firestore
```

### データベース ID

基本的には以下を使用します。

```txt
(default)
```

### ロケーション

Cloud Run と合わせて、東京リージョンを使用します。

```txt
asia-northeast1
```

### セキュリティルール

Firestore のセキュリティルールは以下を選択します。

```txt
限定的
```

今回の構成では、ブラウザから Firestore に直接アクセスしません。

```txt
ブラウザ
  ↓
Next.js Server Action / Server Component
  ↓
Firebase Admin SDK
  ↓
Firestore
```

そのため、Firestore のセキュリティルールを公開する必要はありません。

Firestore へのアクセスは、Google Cloud の IAM / サービスアカウントの権限で制御します。

## Cloud Storage バケットの作成方針

### バケット名

バケット名はグローバルで一意である必要があります。

命名例です。

```txt
{プロジェクトID}-post-images
```

### ロケーションタイプ

```txt
リージョン
```

### ロケーション

```txt
asia-northeast1
```

### ストレージクラス

```txt
Standard
```

投稿画像は一覧ページや詳細ページで表示するため、アクセス頻度が極端に低いデータではありません。

そのため、Nearline / Coldline / Archive ではなく、Standard を使用します。

### 公開アクセスの防止

署名付きURLで画像を表示するため、バケットは非公開にします。

```txt
公開アクセスの防止：適用する
```

バケットやオブジェクトを公開しなくても、署名付きURLを発行することで一時的に画像を表示できます。

### アクセス制御

```txt
均一
```

オブジェクトごとの ACL ではなく、IAM によってバケット単位で権限管理します。

### 保護ツール

学習用として、基本的には以下の設定で進めます。

```txt
オブジェクトのバージョニング：無効
保持ポリシー：なし
ソフト削除：デフォルトのまま
```

### 暗号化

```txt
Google が管理する暗号鍵
```

## 環境変数

Next.js プロジェクトのルートに `.env.local` を作成します。

```txt
google-cloud-training/
  .env.local
  package.json
  src/
```

`.env.local` には、以下を設定します。

```env
GOOGLE_CLOUD_PROJECT=あなたのプロジェクトID
GOOGLE_CLOUD_STORAGE_BUCKET=あなたのバケット名
GOOGLE_APPLICATION_CREDENTIALS=サービスアカウントキーJSONの絶対パス
```

例です。

```env
GOOGLE_CLOUD_PROJECT=red-abstraction-423911-q3
GOOGLE_CLOUD_STORAGE_BUCKET=red-abstraction-423911-q3-post-images
GOOGLE_APPLICATION_CREDENTIALS=/Users/your-name/my-projects/gcloud-keys/service-account.json
```

`GOOGLE_APPLICATION_CREDENTIALS` には、必ず絶対パスを指定します。

以下のように `~` を使うと、Node.js 側でホームディレクトリとして展開されず、ファイルを見つけられない場合があります。

```env
GOOGLE_APPLICATION_CREDENTIALS=~/my-projects/gcloud-keys/service-account.json
```

そのため、以下のように `/Users/...` から始まる絶対パスを指定します。

```env
GOOGLE_APPLICATION_CREDENTIALS=/Users/your-name/my-projects/gcloud-keys/service-account.json
```

## `NEXT_PUBLIC_` を付けない理由

今回の環境変数には `NEXT_PUBLIC_` を付けません。

```env
GOOGLE_CLOUD_PROJECT=...
GOOGLE_CLOUD_STORAGE_BUCKET=...
GOOGLE_APPLICATION_CREDENTIALS=...
```

これらはサーバー側でのみ使用する値です。

Next.js では、`NEXT_PUBLIC_` を付けた環境変数はブラウザ側にも公開されます。

Google Cloud への接続情報や認証情報はブラウザに公開する必要がないため、`NEXT_PUBLIC_` は付けません。

## `.env.local` は Git にコミットしない

`.env.local` は Git 管理に含めません。

`.gitignore` に以下が含まれていることを確認します。

```gitignore
.env*
```

または、少なくとも以下を含めます。

```gitignore
.env.local
```

サービスアカウントキーJSONも Git にコミットしません。

プロジェクト内に置く場合は、以下のように `.gitignore` に追加します。

```gitignore
/service-account.local.json
```

ただし、認証用のJSONファイルはプロジェクト外に置く方が安全です。

## Google Cloud への認証

Firestore や Cloud Storage にアクセスするには、アプリケーションが Google Cloud に対して認証されている必要があります。

### ローカル開発の認証

ローカル開発では、サービスアカウントキーJSONを使用します。

理由は、署名付きURLの生成には `client_email` や `private_key` を含む認証情報が必要になるためです。

`gcloud auth application-default login` だけでも Firestore や Cloud Storage の通常操作はできる場合がありますが、署名付きURL生成時に以下のようなエラーが出ることがあります。

```txt
Cannot sign data without `client_email`.
```

そのため、ローカル開発では専用のサービスアカウントを作成し、そのJSONキーを `GOOGLE_APPLICATION_CREDENTIALS` に指定します。

### ローカル開発用サービスアカウント

ローカル開発用には、専用のサービスアカウントを作成します。

例です。

```txt
cloud-memo-local-dev
```

`Default compute service account` を使うこともできますが、用途が混ざりやすいため、学習用アプリ専用のサービスアカウントを作成します。

専用サービスアカウントにすることで、以下がわかりやすくなります。

* 何のための権限か判断しやすい
* 不要になったときに削除しやすい
* 本番用サービスアカウントと分けられる
* 最小権限を意識しやすい

### ローカル開発用サービスアカウントに付与する権限

学習用として、まずは以下を付与します。

```txt
Cloud Datastore User
Storage Object Admin
```

用途は以下です。

| 権限                   | 用途                        |
| -------------------- | ------------------------- |
| Cloud Datastore User | Firestore の読み書き           |
| Storage Object Admin | Cloud Storage への画像保存・読み取り |

署名付きURLの生成方式や本番環境の構成によっては、以下の権限が必要になる場合があります。

```txt
Service Account Token Creator
```

ローカルでサービスアカウントキーJSONを使う場合は、JSON内の秘密鍵で署名できるため、最初から必要にならない場合もあります。

## Cloud Run 上の認証

Cloud Run 上では、Cloud Run に付与されたサービスアカウントの権限を使って Google Cloud にアクセスします。

```txt
Cloud Run
  ↓
サービスアカウント
  ↓
Firestore / Cloud Storage
```

本番環境では、サービスアカウントキーJSONを Cloud Run に置きません。

Cloud Run に専用のサービスアカウントを紐づけ、そのサービスアカウントの権限で Firestore / Cloud Storage にアクセスします。

本番用には、ローカル開発用とは別に専用サービスアカウントを作成するのが理想です。

例です。

```txt
cloud-memo-run
```

## ローカル開発と本番環境の違い

### ローカル開発

ローカルでは `.env.local` から環境変数を読み込みます。

```txt
ローカルPC
  ↓
.env.local
  ↓
Next.js アプリケーション
```

また、`GOOGLE_APPLICATION_CREDENTIALS` に指定したサービスアカウントキーJSONを使って認証します。

```txt
ローカルPC
  ↓
サービスアカウントキーJSON
  ↓
Firestore / Cloud Storage
```

### Cloud Run 本番環境

Cloud Run では `.env.local` は使いません。

Cloud Run の環境変数設定に、必要な値を登録します。

```txt
Cloud Run
  ↓
Cloud Run に設定した環境変数
  ↓
Next.js アプリケーション
```

ただし、Cloud Run 本番環境では `GOOGLE_APPLICATION_CREDENTIALS` は基本的に使用しません。

Cloud Run に紐づけたサービスアカウントの認証情報を使います。

## 現在の主なディレクトリ構成

```txt
src/
  app/
    layout.tsx
    page.tsx
    actions/
      post.ts
    posts/
      new/
        page.tsx
      [id]/
        page.tsx
  lib/
    firebase-admin.ts
    storage.ts
    signed-url.ts
  types/
    post.ts
```

## 主なファイルの役割

### `src/lib/firebase-admin.ts`

Firestore に接続するための設定ファイルです。

Firebase Admin SDK を使い、サーバー側から Firestore を操作します。

### `src/lib/storage.ts`

Cloud Storage に接続するための設定ファイルです。

`.env.local` の `GOOGLE_CLOUD_STORAGE_BUCKET` を使って、画像保存先のバケットを指定します。

### `src/lib/signed-url.ts`

Cloud Storage に保存された非公開画像に対して、署名付きURLを発行するためのファイルです。

### `src/app/actions/post.ts`

投稿作成時の Server Action を定義します。

フォームから受け取ったタイトル・本文・画像をもとに、以下を実行します。

```txt
1. 画像を Cloud Storage に保存
2. imagePath を生成
3. 投稿データを Firestore に保存
4. 投稿詳細ページへリダイレクト
```

### `src/app/posts/new/page.tsx`

投稿作成フォームのページです。

### `src/app/posts/[id]/page.tsx`

投稿詳細ページです。

Firestore から投稿データを取得し、`imagePath` をもとに署名付きURLを発行して画像を表示します。

### `src/app/page.tsx`

投稿一覧ページです。

Firestore から投稿一覧を取得し、各投稿の `imagePath` をもとに署名付きURLを発行して画像を表示します。

## Getting Started

開発サーバーを起動します。

```bash
npm run dev
```

ブラウザで以下を開きます。

```txt
http://localhost:3000
```

投稿作成ページは以下です。

```txt
http://localhost:3000/posts/new
```

## 動作確認

以下を確認します。

```txt
1. /posts/new にアクセスする
2. タイトルを入力する
3. 本文を入力する
4. 画像を1枚選択する
5. 投稿する
6. Cloud Storage に画像が保存される
7. Firestore に title / body / imagePath / createdAt が保存される
8. 投稿詳細ページで画像が表示される
9. トップページで投稿一覧と画像が表示される
```

## よくあるエラー

### `Cannot sign data without client_email`

署名付きURLの生成に必要な `client_email` が認証情報に含まれていない場合に発生します。

`gcloud auth application-default login` の認証情報では、署名付きURLの生成に必要な情報が不足することがあります。

対応として、サービスアカウントキーJSONを作成し、`.env.local` の `GOOGLE_APPLICATION_CREDENTIALS` に絶対パスで指定します。

### `The file at ... does not exist`

`GOOGLE_APPLICATION_CREDENTIALS` に指定したJSONファイルが存在しない場合に発生します。

以下を確認します。

```txt
- パスが絶対パスになっているか
- `~` を使っていないか
- ファイル名が正しいか
- ディレクトリ名にタイプミスがないか
- npm run dev を再起動したか
```

ファイルの存在確認例です。

```bash
ls -l /Users/your-name/my-projects/gcloud-keys/service-account.json
```
