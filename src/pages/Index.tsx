import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPosts } from "@/lib/api";
import { Category } from "@/lib/types";
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import CategoryFilter from "@/components/CategoryFilter";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  // Sync local state when URL ?q= changes (e.g. from Header search)
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Fetch posts from backend
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ["posts", selectedCategory, search],
    queryFn: () =>
      fetchPosts({
        category: selectedCategory || undefined,
        search: search || undefined,
      }),
  });

  const filtered = useMemo(() => {
    // Since the backend filters, we don't need to filter again on the frontend
    return posts;
  }, [posts]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Welcome to <span className="text-primary">PacketHub</span>
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            A beginner-friendly forum for IT enthusiasts. Ask questions, share
            knowledge, and learn together.
          </p>
        </div>

        {/* Search moved to Header — available globally */}

        {/* Filter */}
        <div className="mb-8">
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="font-display text-muted-foreground">
                Loading posts...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="font-display text-destructive">
                Error loading posts. Please try again.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="font-display text-muted-foreground">
                No posts found.
              </p>
            </div>
          ) : (
            filtered.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
