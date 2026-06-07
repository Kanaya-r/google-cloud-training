export type Post = {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  imagePath: string;
  createdAt: string;
};

export type PostData = Omit<Post, 'id'>;
