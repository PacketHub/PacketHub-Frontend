import { Link } from "react-router-dom";
import { ForumPost } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import CategoryBadge from "./CategoryBadge";
import RoleBadge from "./RoleBadge";
import { useUserRoleByUsername } from "@/hooks/useUserRole";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, User } from "lucide-react";

interface PostCardProps {
  post: ForumPost;
}

const PostCard = ({ post }: PostCardProps) => {
  const { data: topRole } = useUserRoleByUsername(post.author);
  return (
    <Link to={`/post/${post.id}`}>
      <Card className="group animate-fade-in glass transition-all hover:glow-primary">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <CategoryBadge category={post.category} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {post.content}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {post.author}
              {topRole && topRole !== "user" ? (
                <RoleBadge role={topRole} />
              ) : null}
            </span>
            <span>
              {formatDistanceToNow(post.createdAt, { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Discussion
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default PostCard;
