import { ForumPost } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const TOKEN_KEY = "packethub-token";

// Helper function to get authorization header
function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Auth endpoints
export async function signup(email: string, password: string, username: string) {
  const data = await apiRequest<{ accessToken: string; user: { id: string; email: string }; profile: { username: string } }>(
    "/auth/signup",
    {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    },
  );
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  return data;
}

export async function login(email: string, password: string) {
  const data = await apiRequest<{ accessToken: string; user: { id: string; email: string } }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  return data;
}

export async function logout() {
  await apiRequest("/auth/logout", { method: "POST" });
  localStorage.removeItem(TOKEN_KEY);
}

export async function getSession() {
  try {
    return await apiRequest<{ user: { email: string } }>("/auth/session");
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

// Posts endpoints
export async function fetchPosts(
  filters?: Partial<{ category: string; search: string; limit: number; offset: number }>,
) {
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/posts?${queryString}` : "/posts";
  return apiRequest<ForumPost[]>(endpoint);
}

export async function fetchPost(id: string) {
  return apiRequest<ForumPost>(`/posts/${id}`);
}

export async function createPost(post: {
  title: string;
  content: string;
  category: string;
}) {
  return apiRequest<ForumPost>("/posts", {
    method: "POST",
    body: JSON.stringify(post),
  });
}

export async function updatePost(
  id: string,
  data: Partial<{ title: string; content: string; category: string }>,
) {
  return apiRequest<ForumPost>(`/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePost(id: string) {
  await apiRequest(`/posts/${id}`, { method: "DELETE" });
}

// Comments endpoints
export async function fetchComments(postId: string) {
  return apiRequest(`/posts/${postId}/comments`);
}

export async function createComment(postId: string, content: string) {
  return apiRequest(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(commentId: string) {
  await apiRequest(`/comments/${commentId}`, { method: "DELETE" });
}

// Votes endpoints
export async function votePost(postId: string, voteType: "up" | "down") {
  return apiRequest(`/posts/${postId}/votes`, {
    method: "POST",
    body: JSON.stringify({ voteType }),
  });
}

export async function removeVote(postId: string) {
  await apiRequest(`/posts/${postId}/votes`, { method: "DELETE" });
}

// Profile endpoints
export async function getUserProfile() {
  return apiRequest("/profiles/me");
}

export async function getPublicProfile(username: string) {
  return apiRequest(`/profiles/${username}`);
}

export async function updateProfile(data: Partial<{ bio: string; avatar: string }>) {
  return apiRequest("/profiles/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Messaging endpoints
export async function fetchConversations() {
  return apiRequest("/conversations");
}

export async function fetchMessages(conversationId: string) {
  return apiRequest(`/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId: string, content: string) {
  return apiRequest(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

// Token management
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
