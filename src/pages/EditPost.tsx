import { useParams, Link } from "react-router-dom";
import { getPost } from "@/lib/store";
import Header from "@/components/Header";
import PostForm from "@/components/PostForm";
import { Button } from "@/components/ui/button";

const EditPost = () => {
  const { id } = useParams<{ id: string }>();
  const post = id ? getPost(id) : undefined;

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <p className="font-display text-lg text-muted-foreground">
            Post not found.
          </p>
          <Link to="/">
            <Button variant="outline" className="mt-4 font-display text-sm">
              Back to Forum
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <h1 className="mb-6 font-display text-2xl font-bold tracking-tight text-foreground">
          Edit Post
        </h1>
        <PostForm
          mode="edit"
          initialData={{
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.category,
            author: post.author,
          }}
        />
      </main>
    </div>
  );
};

export default EditPost;
