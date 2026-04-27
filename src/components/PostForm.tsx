import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Category, CATEGORY_LABELS } from "@/lib/types";
import { createPost, updatePost } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const categories: Category[] = [
  "networking", "hardware", "programming", "os",
  "overclocking", "hackintosh", "bios", "troubleshooting",
];

interface PostFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    content: string;
    category: Category;
    author: string;
  };
}

const PostForm = ({ mode, initialData }: PostFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [category, setCategory] = useState<Category | "">(initialData?.category ?? "");
  const [author, setAuthor] = useState(initialData?.author ?? "");

  // Auto-fill author from the logged-in user's profile on create
  useEffect(() => {
    if (mode !== "create" || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const name =
        data?.username ||
        data?.display_name ||
        user.email?.split("@")[0] ||
        "";
      setAuthor(name);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !category || !author.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (mode === "create") {
      const post = createPost({ title: title.trim(), content: content.trim(), category, author: author.trim() });
      toast.success("Post created!");
      navigate(`/post/${post.id}`);
    } else if (initialData) {
      updatePost(initialData.id, { title: title.trim(), content: content.trim(), category, author: author.trim() });
      toast.success("Post updated!");
      navigate(`/post/${initialData.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="font-display text-sm">Title</Label>
        <Input
          id="title"
          placeholder="What's your question or topic?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="author" className="font-display text-sm">Author Name</Label>
        <Input
          id="author"
          placeholder="Your display name"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={50}
          className="bg-secondary border-border"
          disabled
          readOnly
        />
        {mode === "create" && (
          <p className="text-xs text-muted-foreground">
            Posts are published under your account username.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="font-display text-sm">Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content" className="font-display text-sm">Content</Label>
        <Textarea
          id="content"
          placeholder="Describe your question or share your knowledge..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
          rows={8}
          className="bg-secondary border-border resize-none"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="font-display text-sm">
          {mode === "create" ? "Create Post" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)} className="font-display text-sm">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default PostForm;
