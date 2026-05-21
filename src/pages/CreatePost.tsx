import Header from "@/components/Header";
import PostForm from "@/components/PostForm";

const CreatePost = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <h1 className="mb-6 font-display text-2xl font-bold tracking-tight text-foreground">
          Create a New Post
        </h1>
        <PostForm mode="create" />
      </main>
    </div>
  );
};

export default CreatePost;
