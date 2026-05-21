# PacketHub Backend API Documentation

This document describes the backend API for PacketHub when using PostgreSQL in Docker. It covers the database schema, Docker setup, and all API routes needed to support the frontend features.

> Note: The current frontend still contains local-storage post logic and Supabase references. This API spec is intended for the backend you want to build so the frontend can connect to Postman-tested endpoints.

---

## 1. Docker + PostgreSQL Setup

Use Docker Compose to run PostgreSQL locally.

### `docker-compose.yml`

```yaml
version: "3.9"
services:
  db:
    image: postgres:15
    container_name: packethub-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: packethub
      POSTGRES_PASSWORD: packethub_password
      POSTGRES_DB: packethub
    ports:
      - "5432:5432"
    volumes:
      - packethub-db-data:/var/lib/postgresql/data

  adminer:
    image: adminer
    container_name: packethub-adminer
    restart: unless-stopped
    ports:
      - "8080:8080"

volumes:
  packethub-db-data:
```

Run it with:

```bash
docker compose up -d
```

Connect to the database at:

- Host: `localhost`
- Port: `5432`
- User: `packethub`
- Password: `packethub_password`
- Database: `packethub`

Adminer will be available at `http://localhost:8080`.

---

## 2. Database Schema

The backend should use the following schema.

### Enums

```sql
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE vote_type AS ENUM ('up', 'down');
```

### Tables

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  display_name text,
  bio text,
  avatar_url text,
  banner_url text,
  avatar_is_animated boolean,
  banner_is_animated boolean,
  spec_cpu text,
  spec_gpu text,
  spec_ram text,
  spec_storage text,
  spec_os text,
  specs text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  author text NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE post_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type vote_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL
);

CREATE TABLE role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  role app_role NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Optional helper functions

If you want behavior similar to the current Supabase backend references, add these helper stored procedures:

```sql
CREATE FUNCTION has_role(_user_id uuid, _role app_role) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION get_or_create_conversation(_user_a uuid, _user_b uuid) RETURNS uuid AS $$
DECLARE
  conv_id uuid;
BEGIN
  SELECT id INTO conv_id
  FROM conversations
  WHERE (user_a = _user_a AND user_b = _user_b) OR (user_a = _user_b AND user_b = _user_a)
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  INSERT INTO conversations (user_a, user_b)
  VALUES (_user_a, _user_b)
  RETURNING id INTO conv_id;
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 3. API Base Definition

- Base URL: `http://localhost:4000/api`
- Authentication: `Authorization: Bearer <token>`
- Content-Type: `application/json`

Use Postman variables:

- `{{baseUrl}} = http://localhost:4000/api`
- `{{authToken}}` for the logged-in user token

---

## 4. Endpoints

### Authentication

#### POST `/auth/signup`

Create a new user.

Body:

```json
{
  "email": "user@example.com",
  "password": "secretPassword",
  "username": "coolhacker42",
  "display_name": "Cool Hacker"
}
```

Response:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2026-05-21T12:00:00Z"
  },
  "profile": {
    "username": "coolhacker42",
    "display_name": "Cool Hacker"
  }
}
```

#### POST `/auth/login`

Sign in and return a token.

Body:

```json
{
  "email": "user@example.com",
  "password": "secretPassword"
}
```

Response:

```json
{
  "accessToken": "jwt.token.here",
  "refreshToken": "refresh.token.here",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### POST `/auth/logout`

Invalidate the current session.

Headers:

- `Authorization: Bearer {{authToken}}`

Response:

```json
{ "success": true }
```

#### GET `/auth/session`

Get current authenticated user session.

Response:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### POST `/auth/password-reset`

Send a password reset link.

Body:

```json
{ "email": "user@example.com" }
```

Response:

```json
{ "success": true }
```

#### POST `/auth/password-reset/confirm`

Complete password reset using a token.

Body:

```json
{
  "token": "reset-token",
  "password": "newPassword123"
}
```

Response:

```json
{ "success": true }
```

---

### Profiles

#### GET `/profiles/me`

Get the authenticated user’s profile.

Headers:

- `Authorization: Bearer {{authToken}}`

Response:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "username": "coolhacker42",
  "display_name": "Cool Hacker",
  "bio": "...",
  "avatar_url": null,
  "banner_url": null,
  "spec_cpu": "Ryzen 7 7800X3D",
  "spec_gpu": "RX 6800 XT",
  "created_at": "2026-05-20T10:00:00Z"
}
```

#### GET `/profiles/:username`

Get a public user profile.

Response:

```json
{
  "id": "uuid",
  "username": "coolhacker42",
  "display_name": "Cool Hacker",
  "bio": "...",
  "avatar_url": null,
  "banner_url": null,
  "spec_cpu": "Ryzen 7 7800X3D"
}
```

#### PATCH `/profiles/me`

Update the current profile.

Headers:

- `Authorization: Bearer {{authToken}}`

Body:

```json
{
  "display_name": "Cool Hacker",
  "bio": "New bio text",
  "username": "coolhacker42",
  "spec_cpu": "Ryzen 7 7800X3D"
}
```

Response:

```json
{ "success": true }
```

#### PATCH `/auth/password`

Change the current user’s password.

Headers:

- `Authorization: Bearer {{authToken}}`

Body:

```json
{ "currentPassword": "oldPass", "newPassword": "newPass123" }
```

Response:

```json
{ "success": true }
```

#### PATCH `/auth/email`

Change the current user’s email.

Headers:

- `Authorization: Bearer {{authToken}}`

Body:

```json
{ "newEmail": "new@example.com" }
```

Response:

```json
{ "success": true }
```

---

### Posts

#### GET `/posts`

List posts with optional filters.

Query parameters:

- `q` — search term in title/content
- `category` — category filter
- `author` — author username

Response:

```json
[
  {
    "id": "uuid",
    "title": "How do I set up a home network with VLANs?",
    "content": "...",
    "category": "networking",
    "author": "NetNewbie42",
    "author_id": "uuid",
    "created_at": "2026-03-24T10:30:00Z"
  }
]
```

#### GET `/posts/:id`

Get a single post.

Response:

```json
{
  "id": "uuid",
  "title": "How do I set up a home network with VLANs?",
  "content": "...",
  "category": "networking",
  "author": "NetNewbie42",
  "author_id": "uuid",
  "created_at": "2026-03-24T10:30:00Z"
}
```

#### POST `/posts`

Create a post.

Headers:

- `Authorization: Bearer {{authToken}}`

Body:

```json
{
  "title": "New post title",
  "content": "Post content goes here.",
  "category": "hardware",
  "author": "MyUsername"
}
```

Response:

```json
{
  "id": "uuid",
  "title": "New post title"
}
```

#### PUT `/posts/:id`

Update a post.

Headers:

- `Authorization: Bearer {{authToken}}`

Body:

```json
{
  "title": "Updated title",
  "content": "New content",
  "category": "hardware"
}
```

Response:

```json
{ "success": true }
```

#### DELETE `/posts/:id`

Delete a post.

Headers:

- `Authorization: Bearer {{authToken}}`

Response:

```json
{ "success": true }
```

---

### Comments

#### GET `/posts/:postId/comments`

List comments for a post.

Response:

```json
[
  {
    "id": "uuid",
    "post_id": "uuid",
    "user_id": "uuid",
    "content": "...",
    "created_at": "2026-05-20T11:00:00Z",
    "profile": {
      "username": "commenter",
      "display_name": "Commenter",
      "avatar_url": null
    }
  }
]
```

#### POST `/posts/:postId/comments`

Create a comment.

Headers:

- `Authorization: Bearer {{authToken}}`

Body:

```json
{ "content": "This is a comment." }
```

Response:

```json
{ "id": "uuid" }
```

#### DELETE `/comments/:id`

Delete a comment.

Headers:

- `Authorization: Bearer {{authToken}}`

Response:

```json
{ "success": true }
```

---

### Voting

#### POST `/posts/:id/votes`

Submit or update a vote.

Headers:

- `Authorization: Bearer {{authToken}}`

Body:

```json
{ "vote_type": "up" }
```

Response:

```json
{ "up": 10, "down": 2, "user_vote": "up" }
```

#### DELETE `/posts/:id/votes`

Remove current user vote.

Headers:

- `Authorization: Bearer {{authToken}}`

Response:

```json
{ "up": 9, "down": 2 }
```

---

### Messaging

#### GET `/conversations`

List conversations for the current user.

Headers:

- `Authorization: Bearer {{authToken}}`

Response:

```json
[
  {
    "id": "uuid",
    "user_a": "uuid",
    "user_b": "uuid",
    "last_message_at": "2026-05-20T12:00:00Z",
    "other": {
      "user_id": "uuid",
      "username": "friend",
      "display_name": "Friend",
      "avatar_url": null
    },
    "last_message": {
      "content": "Hey!",
      "sender_id": "uuid",
      "created_at": "2026-05-20T12:00:00Z"
    }
  }
]
```

#### GET `/conversations/:id/messages`

Get messages for a conversation.

Response:

```json
[
  {
    "id": "uuid",
    "conversation_id": "uuid",
    "sender_id": "uuid",
    "content": "Hello",
    "created_at": "2026-05-20T12:00:00Z",
    "read_at": null
  }
]
```

#### POST `/conversations`

Create or find a conversation with another user.

Headers:

- `Authorization: Bearer {{authToken}}`

Body:

```json
{ "other_user_id": "uuid" }
```

Response:

```json
{ "conversation_id": "uuid" }
```

#### POST `/conversations/:id/messages`

Send a message in a conversation.

Headers:

- `Authorization: Bearer {{authToken}}`

Body:

```json
{ "content": "Hello there" }
```

Response:

```json
{ "id": "uuid" }
```

---

### Admin

Admin routes should only be accessible by users with role `admin`.

#### GET `/admin/profiles`

List all profiles.

Response:

```json
[
  {
    "user_id": "uuid",
    "username": "coolhacker42",
    "display_name": "Cool Hacker",
    "avatar_url": null,
    "created_at": "2026-05-20T10:00:00Z"
  }
]
```

#### GET `/admin/auth-users`

List all auth users.

Response:

```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2026-05-20T10:00:00Z"
  }
]
```

#### GET `/admin/user-roles`

List all user roles.

Response:

```json
[{ "user_id": "uuid", "role": "admin" }]
```

#### POST `/admin/user-roles`

Grant a role.

Body:

```json
{ "user_id": "uuid", "username": "coolhacker42", "role": "moderator" }
```

Response:

```json
{ "success": true }
```

#### DELETE `/admin/user-roles`

Revoke a role.

Body:

```json
{ "user_id": "uuid", "role": "moderator" }
```

Response:

```json
{ "success": true }
```

#### POST `/admin/users/delete`

Delete a user account.

Body:

```json
{ "user_id": "uuid", "username": "coolhacker42" }
```

Response:

```json
{ "success": true }
```

#### GET `/admin/role-audit-log`

Read the role audit trail.

Response:

```json
[
  {
    "id": "uuid",
    "action": "granted",
    "role": "admin",
    "target_user_id": "uuid",
    "actor_user_id": "uuid",
    "created_at": "2026-05-20T12:00:00Z"
  }
]
```

---

## 5. Postman Testing Notes

1. Set `{{baseUrl}}` to `http://localhost:4000/api`.
2. Use `Content-Type: application/json` for all request bodies.
3. Save `{{authToken}}` from `/auth/login`.
4. Add `Authorization: Bearer {{authToken}}` to requests that require authentication.
5. Test routes in this order:
   - `/auth/signup`
   - `/auth/login`
   - `/auth/session`
   - `/profiles/me`
   - `/posts`
   - `/posts/:id`
   - `/posts/:id/comments`
   - `/conversations`
   - Admin routes last if you have an admin user.

---

## 6. Notes on Frontend Integration

These backend routes should be wired into the frontend wherever the app currently interacts with data or authentication. The current frontend still stores forum posts locally in `src/lib/store.ts`, so you must replace those local calls with REST calls to:

- `/posts`
- `/posts/:id`
- `/posts/:id/comments`
- `/posts/:id/votes`

For profile and auth, replace Supabase auth flows with the REST routes in this document.
