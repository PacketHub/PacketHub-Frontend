import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getPosts } from "@/lib/store";
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
  const posts = getPosts();

  // Sync local state when URL ?q= changes (e.g. from Header search)
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchCat = !selectedCategory || p.category === selectedCategory;
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.content.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [posts, selectedCategory, search]);

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
          {filtered.length === 0 ? (
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
