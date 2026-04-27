import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPost } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import PostForm from "@/components/PostForm";
import { Button } from "@/components/ui/button";

const EditPost = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const post = id ? getPost(id) : undefined;
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !post) { setAllowed(false); return; }

    const check = async () => {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin"),
        supabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle(),
      ]);
      const isAdmin = !!(roles && roles.length > 0);
      const isAuthor = profile?.username === post.author;
      setAllowed(isAdmin || isAuthor);
    };
    check();
  }, [user, authLoading, post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <p className="font-display text-lg text-muted-foreground">Post not found.</p>
          <Link to="/">
            <Button variant="outline" className="mt-4 font-display text-sm">Back to Forum</Button>
          </Link>
        </main>
      </div>
    );
  }

  if (allowed === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <p className="text-muted-foreground">Checking permissions...</p>
        </main>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to={`/post/${id}`} replace />;
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
