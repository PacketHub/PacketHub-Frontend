import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Category, CATEGORY_LABELS } from "@/lib/types";
import { createPost as apiCreatePost, updatePost as apiUpdatePost } from "@/lib/api";
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

const categories: Category[] = [
  "networking",
  "hardware",
  "programming",
  "os",
  "overclocking",
  "hackintosh",
  "bios",
  "troubleshooting",
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
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [category, setCategory] = useState<Category | "">(
    initialData?.category ?? "",
  );
  const [author, setAuthor] = useState(initialData?.author ?? "");

  // Mutations for API calls
  const createMutation = useMutation({
    mutationFn: () =>
      apiCreatePost({
        title: title.trim(),
        content: content.trim(),
        category: category as string,
      }),
    onSuccess: (post) => {
      toast.success("Post created!");
      navigate(`/post/${post.id}`);
    },
    onError: () => {
      toast.error("Failed to create post");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiUpdatePost(initialData!.id, {
        title: title.trim(),
        content: content.trim(),
        category: category as string,
      }),
    onSuccess: () => {
      toast.success("Post updated!");
      navigate(`/post/${initialData!.id}`);
    },
    onError: () => {
      toast.error("Failed to update post");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !category) {
      toast.error("Please fill in all fields");
      return;
    }

    if (mode === "create") {
      createMutation.mutate();
    } else if (initialData) {
      updateMutation.mutate();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="font-display text-sm">
          Title
        </Label>
        <Input
          id="title"
          placeholder="What's your question or topic?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          disabled={isLoading}
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="font-display text-sm">
          Category
        </Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as Category)}
          disabled={isLoading}
        >
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
        <Label htmlFor="content" className="font-display text-sm">
          Content
        </Label>
        <Textarea
          id="content"
          placeholder="Describe your question or share your knowledge..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
          disabled={isLoading}
          rows={8}
          className="bg-secondary border-border resize-none"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading} className="font-display text-sm">
          {isLoading
            ? "Saving..."
            : mode === "create"
              ? "Create Post"
              : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={isLoading}
          className="font-display text-sm"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default PostForm;
