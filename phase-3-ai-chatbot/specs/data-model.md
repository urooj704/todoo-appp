# Data Model: Phase III AI Chatbot

**Date**: 2026-02-06
**Branch**: `002-phase-iii-ai-chatbot`

## Entity Relationship Diagram

```text
┌──────────────────────┐       ┌──────────────────────────┐
│        users         │       │          tasks           │
├──────────────────────┤       ├──────────────────────────┤
│ id (PK, UUID)        │──┐    │ id (PK, UUID)            │
│ email (UNIQUE)       │  │    │ user_id (FK) ────────────┼──┐
│ name                 │  │    │ title (NOT NULL)         │  │
│ email_verified       │  │    │ description              │  │
│ image                │  │    │ completed (DEFAULT false) │  │
│ created_at           │  │    │ created_at               │  │
│ updated_at           │  │    │ updated_at               │  │
└──────────────────────┘  │    └──────────────────────────┘  │
                          │                                   │
                          │    ┌──────────────────────────┐   │
                          │    │     conversations        │   │
                          │    ├──────────────────────────┤   │
                          ├───>│ id (PK, UUID)            │   │
                          │    │ user_id (FK) ────────────┼───┘
                          │    │ created_at               │
                          │    │ updated_at               │
                          │    └───────────┬──────────────┘
                          │                │
                          │    ┌───────────▼──────────────┐
                          │    │       messages           │
                          │    ├──────────────────────────┤
                          └───>│ id (PK, UUID)            │
                               │ conversation_id (FK) ────┼──> conversations(id)
                               │ user_id (FK) ────────────┼──> users(id)
                               │ role (NOT NULL)          │
                               │ content (NOT NULL)       │
                               │ created_at               │
                               └──────────────────────────┘
```

## Existing Tables (Unchanged)

### users
Managed by Better Auth. No changes from Phase II.

### tasks
Application-managed. No schema changes from Phase II. MCP tools reuse the existing tasks table and Phase II query patterns.

## New Tables

### conversations

Represents a chat thread belonging to a user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique conversation identifier |
| user_id | UUID | FOREIGN KEY → users(id), NOT NULL | Conversation owner |
| created_at | TIMESTAMP | DEFAULT now(), NOT NULL | Conversation creation time |
| updated_at | TIMESTAMP | DEFAULT now(), NOT NULL | Last activity time |

**Indexes**:
- `idx_conversations_user_id` on `user_id` — Required for user-scoped queries
- `idx_conversations_user_updated` on `(user_id, updated_at DESC)` — For listing recent conversations

**Foreign Key**:
- `conversations.user_id` → `users(id)` ON DELETE CASCADE

### messages

Represents a single message within a conversation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique message identifier |
| conversation_id | UUID | FOREIGN KEY → conversations(id), NOT NULL | Parent conversation |
| user_id | UUID | FOREIGN KEY → users(id), NOT NULL | Message owner (for scoping) |
| role | VARCHAR(20) | NOT NULL, CHECK (role IN ('user', 'assistant')) | Message author role |
| content | TEXT | NOT NULL | Message text content |
| created_at | TIMESTAMP | DEFAULT now(), NOT NULL | Message creation time |

**Indexes**:
- `idx_messages_conversation_id` on `conversation_id` — Required for loading conversation history
- `idx_messages_conversation_created` on `(conversation_id, created_at ASC)` — For ordered history loading
- `idx_messages_user_id` on `user_id` — Required for user-scoped queries

**Foreign Keys**:
- `messages.conversation_id` → `conversations(id)` ON DELETE CASCADE
- `messages.user_id` → `users(id)` ON DELETE CASCADE

## Validation Rules

### Conversation (enforced by application)

| Field | Rule |
|-------|------|
| user_id | Must match authenticated user (immutable after creation) |

### Message (enforced by application)

| Field | Rule |
|-------|------|
| content | Required, non-empty, trimmed whitespace |
| role | Must be 'user' or 'assistant' |
| user_id | Must match authenticated user (immutable after creation) |
| conversation_id | Must reference a conversation owned by the same user |

## SQL Schema (Migration)

```sql
-- Phase III: Add conversations and messages tables

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_content_not_empty CHECK (length(trim(content)) > 0)
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at ASC);
CREATE INDEX idx_messages_user_id ON messages(user_id);

-- Trigger for conversations.updated_at
CREATE TRIGGER conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

## Query Patterns

### Create Conversation

```sql
INSERT INTO conversations (user_id)
VALUES ($1)
RETURNING id, user_id, created_at, updated_at;
```

### Get Conversation (with ownership check)

```sql
SELECT id, user_id, created_at, updated_at
FROM conversations
WHERE id = $1 AND user_id = $2;
```

### List User's Conversations

```sql
SELECT id, created_at, updated_at
FROM conversations
WHERE user_id = $1
ORDER BY updated_at DESC;
```

### Store Message

```sql
INSERT INTO messages (conversation_id, user_id, role, content)
VALUES ($1, $2, $3, $4)
RETURNING id, conversation_id, user_id, role, content, created_at;
```

### Load Conversation History (bounded)

```sql
SELECT id, role, content, created_at
FROM messages
WHERE conversation_id = $1 AND user_id = $2
ORDER BY created_at ASC
LIMIT $3;  -- Bounded to MAX_CONVERSATION_HISTORY (default 50)
```

### Load Recent History (for agent context window)

```sql
SELECT role, content
FROM messages
WHERE conversation_id = $1 AND user_id = $2
ORDER BY created_at DESC
LIMIT $3;
```

Note: Results are reversed in application code to restore chronological order.

### Update Conversation Timestamp

```sql
UPDATE conversations
SET updated_at = now()
WHERE id = $1 AND user_id = $2;
```

## Constitution Compliance

| Rule | Implementation |
|------|----------------|
| User-scoped queries | Every query includes `WHERE user_id = ?` |
| No global queries | No SELECT without user filter |
| FK to users | Both tables reference `users(id)` |
| Immutable user_id | Not included in UPDATE statements |
| ON DELETE CASCADE | User deletion cascades to conversations and messages |
| Ownership check | Conversation ownership validated before message operations |
