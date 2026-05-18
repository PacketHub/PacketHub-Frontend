import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { getPost, deletePost } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import CategoryBadge from "@/components/CategoryBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ProfileHoverCard from "@/components/ProfileHoverCard";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Edit, Trash2, User, Calendar, ThumbsUp, ThumbsDown, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AuthorNameWithRole from "@/components/AuthorNameWithRole";

interface AuthorProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_is_animated: boolean | null;
  banner_url: string | null;
  banner_is_animated: boolean | null;
  bio: string | null;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const post = id ? getPost(id) : undefined;
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [votes, setVotes] = useState<{ up: number; down: number }>({ up: 0, down: 0 });
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Check if user is admin or post author
  useEffect(() => {
    if (!user) { setIsAdmin(false); setCurrentUsername(null); return; }
    const checkAccess = async () => {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin"),
        supabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle(),
      ]);
      setIsAdmin(!!(roles && roles.length > 0));
      setCurrentUsername(profile?.username || null);
    };
    checkAccess();
  }, [user]);

  const canEditDelete = isAdmin || (currentUsername && currentUsername === post?.author);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch profiles for comment authors
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      setComments(
        data.map((c) => ({
          ...c,
          profile: profileMap.get(c.user_id) || undefined,
        }))
      );
    }
  }, [id]);

  const fetchVotes = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("post_votes")
      .select("vote_type, user_id")
      .eq("post_id", id);

    if (data) {
      setVotes({
        up: data.filter((v) => v.vote_type === "up").length,
        down: data.filter((v) => v.vote_type === "down").length,
      });
      if (user) {
        const myVote = data.find((v) => v.user_id === user.id);
        setUserVote(myVote ? (myVote.vote_type as "up" | "down") : null);
      }
    }
  }, [id, user]);

  useEffect(() => {
    if (!post) return;
    const fetchAuthor = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, avatar_is_animated, banner_url, banner_is_animated, bio, created_at")
        .eq("username", post.author)
        .maybeSingle();
      if (data) setAuthorProfile(data);
    };
    fetchAuthor();
  }, [post?.author]);

  useEffect(() => {
    fetchComments();
    fetchVotes();
  }, [fetchComments, fetchVotes]);

  // Realtime subscriptions
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`post-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${id}` }, () => {
        fetchComments();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "post_votes", filter: `post_id=eq.${id}` }, () => {
        fetchVotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchComments, fetchVotes]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <p className="font-display text-lg text-muted-foreground">Post not found.</p>
          <Link to="/">
            <Button variant="outline" className="mt-4 font-display text-sm">
              Back to Forum
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const handleDelete = () => {
    deletePost(post.id);
    toast.success("Post deleted");
    navigate("/");
  };

  const handleVote = async (type: "up" | "down") => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }

    if (userVote === type) {
      // Remove vote
      await supabase.from("post_votes").delete().eq("post_id", post.id).eq("user_id", user.id);
      setUserVote(null);
      setVotes((prev) => ({ ...prev, [type]: prev[type] - 1 }));
    } else {
      if (userVote) {
        // Change vote
        await supabase.from("post_votes").update({ vote_type: type }).eq("post_id", post.id).eq("user_id", user.id);
        setVotes((prev) => ({
          up: type === "up" ? prev.up + 1 : prev.up - (userVote === "up" ? 1 : 0),
          down: type === "down" ? prev.down + 1 : prev.down - (userVote === "down" ? 1 : 0),
        }));
      } else {
        // New vote
        await supabase.from("post_votes").insert({ post_id: post.id, user_id: user.id, vote_type: type });
        setVotes((prev) => ({ ...prev, [type]: prev[type] + 1 }));
      }
      setUserVote(type);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    const { error } = await supabase.from("comments").insert({
      post_id: post.id,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      toast.error("Failed to post comment");
    } else {
      setNewComment("");
      toast.success("Comment posted!");
    }
    setSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) toast.error("Failed to delete comment");
  };

  const netVotes = votes.up - votes.down;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-6xl py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Forum
        </Link>

        <div className="animate-fade-in flex flex-col lg:flex-row gap-8">
          {/* Author sidebar */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="glass rounded-xl overflow-hidden lg:sticky lg:top-24">
              {/* Banner */}
              <div className="relative h-28 w-full bg-muted">
                {authorProfile?.banner_url ? (
                  <img
                    src={authorProfile.banner_url}
                    alt={`${authorProfile.display_name || authorProfile.username}'s banner`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/30 to-accent/10" />
                )}
              </div>
              {/* Avatar + info */}
              <div className="flex flex-col items-center -mt-10 px-5 pb-6">
                <ProfileHoverCard username={post.author} initialProfile={authorProfile}>
                  <Avatar className="h-20 w-20 border-4 border-border ring-2 ring-primary/20 cursor-pointer">
                    {authorProfile?.avatar_url ? (
                      <AvatarImage src={authorProfile.avatar_url} alt={post.author} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary font-display text-2xl">
                      {(authorProfile?.display_name || post.author).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </ProfileHoverCard>
                <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
                  <AuthorNameWithRole
                    username={authorProfile?.username || post.author}
                    displayName={authorProfile?.display_name || post.author}
                    className="font-display text-base font-semibold text-foreground"
                    badgeSize="md"
                  />
                </div>
                <p className="text-sm text-muted-foreground">@{authorProfile?.username || post.author}</p>
                {authorProfile?.bio && (
                  <p className="mt-3 text-xs text-muted-foreground text-center leading-relaxed">
                    {authorProfile.bio}
                  </p>
                )}
              </div>

              {/* Vote section */}
              <div className="border-t border-border/40 px-5 py-4">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote("up")}
                    className={`gap-1.5 transition-all ${userVote === "up" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"}`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="font-display text-sm font-semibold">{votes.up}</span>
                  </Button>
                  <span className={`font-display text-lg font-bold ${netVotes > 0 ? "text-primary" : netVotes < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {netVotes > 0 ? `+${netVotes}` : netVotes}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote("down")}
                    className={`gap-1.5 transition-all ${userVote === "down" ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive"}`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span className="font-display text-sm font-semibold">{votes.down}</span>
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          {/* Post content + comments */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Post */}
            <article>
              <div className="mb-4">
                <CategoryBadge category={post.category} />
              </div>

              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {post.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(post.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>

              <div className="mt-8 rounded-xl glass p-6">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {post.content}
                </div>
              </div>

              {canEditDelete && (
                <div className="mt-6 flex gap-3">
                  <Link to={`/edit/${post.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 font-display text-xs">
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 font-display text-xs text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-display">Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The post will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-display text-sm">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground font-display text-sm">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </article>

            {/* Comments section */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Comments ({comments.length})
                </h2>
              </div>

              {/* Add comment */}
              <div className="glass rounded-xl p-4 mb-6">
                <Textarea
                  placeholder={user ? "Write a comment..." : "Sign in to comment..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={!user}
                  className="min-h-[80px] bg-background/50 border-border/40 resize-none mb-3"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!user || !newComment.trim() || submittingComment}
                    className="gap-1.5 font-display text-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {submittingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>

              {/* Comments list */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="glass rounded-xl p-8 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="glass rounded-xl p-4 animate-fade-in">
                      <div className="flex items-start gap-3">
                        {comment.profile?.username ? (
                          <ProfileHoverCard
                            username={comment.profile.username}
                            initialProfile={{
                              username: comment.profile.username,
                              display_name: comment.profile.display_name,
                              avatar_url: comment.profile.avatar_url,
                            }}
                          >
                            <Avatar className="h-9 w-9 shrink-0 cursor-pointer">
                              {comment.profile.avatar_url ? (
                                <AvatarImage src={comment.profile.avatar_url} alt={comment.profile.username} />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-primary font-display text-sm">
                                {(comment.profile.display_name || comment.profile.username).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </ProfileHoverCard>
                        ) : (
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-display text-sm">
                              U
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <AuthorNameWithRole
                              username={comment.profile?.username || "anonymous"}
                              displayName={comment.profile?.display_name || comment.profile?.username || "Anonymous"}
                              className="font-display text-sm font-semibold text-foreground"
                            />
                            {comment.profile?.username &&
                            post.author &&
                            comment.profile.username.toLowerCase() === post.author.toLowerCase() ? (
                              <span
                                className="rounded-md bg-primary/15 px-1.5 py-0 font-display text-[10px] font-semibold uppercase tracking-wide text-primary"
                                title="Original poster"
                              >
                                OP
                              </span>
                            ) : null}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                            {user && user.id === comment.user_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="ml-auto h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetail;
