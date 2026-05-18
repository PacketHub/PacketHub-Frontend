import { useNavigate } from "react-router-dom";
import { ForumPost } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import CategoryBadge from "./CategoryBadge";
import RoleBadge from "./RoleBadge";
import ProfileHoverCard from "./ProfileHoverCard";
import { useUserRoleByUsername } from "@/hooks/useUserRole";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, User } from "lucide-react";

interface PostCardProps {
  post: ForumPost;
}

const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();
  const { data: topRole } = useUserRoleByUsername(post.author);

  const handleCardClick = () => navigate(`/post/${post.id}`);

  return (
    <Card className="group animate-fade-in glass transition-all hover:glow-primary">
      <div onClick={handleCardClick} className="cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <CategoryBadge category={post.category} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {post.content}
          </p>
        </CardContent>
      </div>
      <CardFooter className="flex items-center gap-4 text-xs text-muted-foreground">
        <ProfileHoverCard username={post.author}>
          <span
            className="flex items-center gap-1.5 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/u/${post.author}`);
            }}
          >
            <User className="h-3.5 w-3.5" />
            <span className="hover:text-primary transition-colors">
              {post.author}
            </span>
            {topRole && topRole !== "user" ? (
              <RoleBadge role={topRole} />
            ) : null}
          </span>
        </ProfileHoverCard>
        <span>
          {formatDistanceToNow(post.createdAt, { addSuffix: true })}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          Discussion
        </span>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
