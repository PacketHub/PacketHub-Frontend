import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, MessageSquare, AtSign, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileLite = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Conversation = {
  id: string;
  user_a: string;
  user_b: string;
  last_message_at: string;
  other: ProfileLite | null;
  last_message?: { content: string; sender_id: string; created_at: string } | null;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [composeTo, setComposeTo] = useState("");
  const [draft, setDraft] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Redirect when not signed in
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  // Conversations list
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["conversations", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: convs, error } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const otherIds = Array.from(
        new Set((convs ?? []).map((c) => (c.user_a === user!.id ? c.user_b : c.user_a)))
      );
      const profilesMap = new Map<string, ProfileLite>();
      if (otherIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", otherIds);
        (profs ?? []).forEach((p) => profilesMap.set(p.user_id, p));
      }
      // Last message per conv
      const ids = (convs ?? []).map((c) => c.id);
      const lastMap = new Map<string, Message>();
      if (ids.length) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("conversation_id, content, sender_id, created_at")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false });
        (msgs ?? []).forEach((m) => {
          if (!lastMap.has(m.conversation_id)) lastMap.set(m.conversation_id, m as Message);
        });
      }
      return (convs ?? []).map((c) => {
        const otherId = c.user_a === user!.id ? c.user_b : c.user_a;
        return {
          ...c,
          other: profilesMap.get(otherId) ?? null,
          last_message: lastMap.get(c.id) ?? null,
        } as Conversation;
      });
    },
  });

  // Handle ?to=username to start a conversation
  useEffect(() => {
    const to = searchParams.get("to");
    if (!to || !user) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", to)
        .maybeSingle();
      if (!prof) {
        toast.error(`User @${to} not found`);
        searchParams.delete("to");
        setSearchParams(searchParams, { replace: true });
        return;
      }
      const { data: convId, error } = await supabase.rpc("get_or_create_conversation", {
        _other_user: prof.user_id,
      });
      if (error || !convId) {
        toast.error(error?.message || "Couldn't open conversation");
        return;
      }
      searchParams.delete("to");
      setSearchParams(searchParams, { replace: true });
      queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
      navigate(`/messages/${convId}`, { replace: true });
    })();
  }, [searchParams, user, navigate, queryClient, setSearchParams]);

  // Selected conversation
  const activeConv = useMemo(
    () => conversations.find((c) => c.id === conversationId) ?? null,
    [conversations, conversationId]
  );

  // Messages
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient, user?.id]);

  // Realtime for new conversations
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`convs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => queryClient.invalidateQueries({ queryKey: ["conversations", user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, conversationId]);

  // @mention autocomplete
  const { data: mentionResults = [] } = useQuery<ProfileLite[]>({
    queryKey: ["mention-search", mentionQuery],
    enabled: mentionQuery !== null && mentionQuery.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .ilike("username", `${mentionQuery}%`)
        .neq("user_id", user!.id)
        .limit(6);
      return data ?? [];
    },
  });

  const onComposeChange = (v: string) => {
    setComposeTo(v);
    const m = v.match(/^@?([a-zA-Z0-9_]*)$/);
    setMentionQuery(m ? m[1] : null);
  };

  const startConversation = async (username: string) => {
    const clean = username.replace(/^@/, "").trim();
    if (!clean) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", clean)
      .maybeSingle();
    if (!prof) {
      toast.error(`User @${clean} not found`);
      return;
    }
    const { data: convId, error } = await supabase.rpc("get_or_create_conversation", {
      _other_user: prof.user_id,
    });
    if (error || !convId) {
      toast.error(error?.message || "Couldn't open conversation");
      return;
    }
    setComposeTo("");
    setMentionQuery(null);
    queryClient.invalidateQueries({ queryKey: ["conversations", user!.id] });
    navigate(`/messages/${convId}`);
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || !conversationId || !user) return;
    setDraft("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });
    if (error) {
      toast.error(error.message);
      setDraft(content);
    } else {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
    }
  };

  const renderContent = (text: string) =>
    text.split(/(\s+)/).map((part, i) => {
      const m = part.match(/^@([a-zA-Z0-9_]+)$/);
      if (m) {
        return (
          <Link
            key={i}
            to={`/u/${m[1]}`}
            className="text-primary hover:underline"
          >
            @{m[1]}
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });

  if (authLoading) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container py-6">
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Sidebar */}
          <aside
            className={cn(
              "glass rounded-2xl p-3 lg:block",
              conversationId ? "hidden" : "block"
            )}
          >
            <div className="px-2 pt-1 pb-3">
              <h1 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Messages
              </h1>
            </div>

            {/* Compose */}
            <div className="relative px-1 pb-3">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={composeTo}
                  onChange={(e) => onComposeChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      startConversation(composeTo);
                    }
                  }}
                  placeholder="username"
                  className="glass-subtle border-border/40 pl-9 h-9 text-sm"
                />
              </div>
              {mentionQuery && mentionResults.length > 0 && (
                <div className="absolute left-1 right-1 z-20 mt-1 rounded-lg border border-border/50 bg-popover p-1 shadow-lg">
                  {mentionResults.map((p) => (
                    <button
                      key={p.user_id}
                      type="button"
                      onClick={() => startConversation(p.username)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/40"
                    >
                      <Avatar className="h-6 w-6">
                        {p.avatar_url ? <AvatarImage src={p.avatar_url} alt="" /> : null}
                        <AvatarFallback className="text-[10px]">
                          {(p.display_name || p.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">
                        <span className="font-medium">{p.display_name || p.username}</span>
                        <span className="ml-1 text-xs text-muted-foreground">@{p.username}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="space-y-1 pr-1">
                {conversations.length === 0 && (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                    No conversations yet. Start one with @username above.
                  </p>
                )}
                {conversations.map((c) => {
                  const active = c.id === conversationId;
                  const name = c.other?.display_name || c.other?.username || "Unknown";
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigate(`/messages/${c.id}`)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                        active ? "bg-primary/10" : "hover:bg-muted/40"
                      )}
                    >
                      <Avatar className="h-9 w-9">
                        {c.other?.avatar_url ? (
                          <AvatarImage src={c.other.avatar_url} alt={name} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-display text-sm font-medium text-foreground">
                            {name}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {new Date(c.last_message_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.last_message?.content || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </aside>

          {/* Chat */}
          <section
            className={cn(
              "glass rounded-2xl flex flex-col h-[calc(100vh-7rem)] lg:flex",
              conversationId ? "flex" : "hidden lg:flex"
            )}
          >
            {!activeConv ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Select a conversation or start one with @username
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-border/40 p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => navigate("/messages")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9">
                    {activeConv.other?.avatar_url ? (
                      <AvatarImage
                        src={activeConv.other.avatar_url}
                        alt={activeConv.other.username}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {(activeConv.other?.display_name || activeConv.other?.username || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-foreground truncate">
                      {activeConv.other?.display_name || activeConv.other?.username}
                    </p>
                    {activeConv.other?.username && (
                      <Link
                        to={`/u/${activeConv.other.username}`}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        @{activeConv.other.username}
                      </Link>
                    )}
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-8">
                      Say hi — this is the beginning of your conversation.
                    </p>
                  )}
                  {messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={cn("flex", mine ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm break-words whitespace-pre-wrap",
                            mine
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "glass-subtle text-foreground rounded-bl-sm"
                          )}
                        >
                          {renderContent(m.content)}
                          <div
                            className={cn(
                              "mt-1 text-[10px] opacity-70",
                              mine ? "text-primary-foreground/80" : "text-muted-foreground"
                            )}
                          >
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-center gap-2 border-t border-border/40 p-3"
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message… use @username to mention"
                    className="glass-subtle border-border/40"
                  />
                  <Button type="submit" size="icon" disabled={!draft.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Messages;
