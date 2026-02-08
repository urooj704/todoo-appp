# Data Model: Phase II Todo Web App

**Date**: 2026-02-05
**Branch**: `001-phase-ii-todo-app`

## Entity Relationship Diagram

```text
┌──────────────────────┐       ┌──────────────────────────┐
│        users         │       │          tasks           │
├──────────────────────┤       ├──────────────────────────┤
│ id (PK, UUID)        │───┐   │ id (PK, UUID)            │
│ email (UNIQUE)       │   │   │ user_id (FK) ────────────┼───┘
│ name                 │   └──>│ title (NOT NULL)         │
│ email_verified       │       │ description              │
│ image                │       │ completed (DEFAULT false)│
│ created_at           │       │ created_at               │
│ updated_at           │       │ updated_at               │
└──────────────────────┘       └──────────────────────────┘
```

## Tables

### users

Managed by Better Auth. Schema follows Better Auth conventions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| name | VARCHAR(255) | | Display name |
| email_verified | BOOLEAN | DEFAULT false | Email verification status |
| image | TEXT | | Profile image URL |
| created_at | TIMESTAMP | DEFAULT now() | Account creation time |
| updated_at | TIMESTAMP | DEFAULT now() | Last update time |

**Note**: Better Auth may create additional tables (sessions, accounts, verification_tokens). These are managed by Better Auth and should not be modified directly.

### tasks

Application-managed table for user tasks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique task identifier |
| user_id | UUID | FOREIGN KEY → users(id), NOT NULL | Task owner |
| title | VARCHAR(200) | NOT NULL | Task title (max 200 chars) |
| description | TEXT | | Optional task description (max 2000 chars) |
| completed | BOOLEAN | DEFAULT false, NOT NULL | Completion status |
| created_at | TIMESTAMP | DEFAULT now(), NOT NULL | Task creation time |
| updated_at | TIMESTAMP | DEFAULT now(), NOT NULL | Last modification time |

**Indexes**:
- `idx_tasks_user_id` on `user_id` — Required for user-scoped queries
- `idx_tasks_user_completed` on `(user_id, completed)` — For filtered lists

**Foreign Key**:
- `tasks.user_id` → `users.id` ON DELETE CASCADE

## Validation Rules

### User (enforced by Better Auth)

| Field | Rule |
|-------|------|
| email | Valid email format, unique |
| name | Optional, max 255 chars |

### Task (enforced by application)

| Field | Rule |
|-------|------|
| title | Required, 1-200 characters, trimmed whitespace |
| description | Optional, max 2000 characters |
| completed | Boolean only |
| user_id | Must match authenticated user (immutable after creation) |

## State Transitions

### Task Completion

```text
┌─────────────┐     mark complete      ┌─────────────┐
│  Incomplete │ ────────────────────>  │  Completed  │
│ (completed  │                        │ (completed  │
│  = false)   │ <────────────────────  │  = true)    │
└─────────────┘    mark incomplete     └─────────────┘
```

- Tasks are created in `incomplete` state
- Users can toggle between states freely
- No restrictions on state transitions

## SQL Schema

```sql
-- Better Auth manages the users table
-- This is a reference for the expected structure

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    image TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Application manages the tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT chk_title_not_empty CHECK (length(trim(title)) > 0)
);

-- Required indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

## Query Patterns

### List User's Tasks

```sql
SELECT id, title, description, completed, created_at, updated_at
FROM tasks
WHERE user_id = $1  -- Always scoped to user
ORDER BY created_at DESC;
```

### Get Single Task (with ownership check)

```sql
SELECT id, title, description, completed, created_at, updated_at
FROM tasks
WHERE id = $1 AND user_id = $2;  -- Both task ID and user ID required
```

### Create Task

```sql
INSERT INTO tasks (user_id, title, description)
VALUES ($1, $2, $3)
RETURNING id, title, description, completed, created_at, updated_at;
```

### Update Task

```sql
UPDATE tasks
SET title = $1, description = $2, updated_at = now()
WHERE id = $3 AND user_id = $4  -- Ownership enforced
RETURNING id, title, description, completed, created_at, updated_at;
```

### Toggle Completion

```sql
UPDATE tasks
SET completed = NOT completed, updated_at = now()
WHERE id = $1 AND user_id = $2
RETURNING id, title, description, completed, created_at, updated_at;
```

### Delete Task

```sql
DELETE FROM tasks
WHERE id = $1 AND user_id = $2;  -- Ownership enforced
```

## Constitution Compliance

| Rule | Implementation |
|------|----------------|
| User-scoped queries | Every query includes `WHERE user_id = ?` |
| No global queries | No SELECT without user filter |
| FK to users | `tasks.user_id REFERENCES users(id)` |
| Immutable user_id | Not included in UPDATE statements |
| ON DELETE CASCADE | User deletion removes all their tasks |
