# Research: Phase II Todo Web App

**Date**: 2026-02-05
**Branch**: `001-phase-ii-todo-app`

## Technology Decisions

### 1. Backend Framework: FastAPI

**Decision**: Use FastAPI with Python 3.11

**Rationale**:
- Native async support for database operations
- Automatic OpenAPI documentation
- Pydantic integration for request/response validation
- Dependency injection system perfect for JWT verification
- Excellent performance for API workloads

**Alternatives Considered**:
- Django REST Framework: More opinionated, heavier, unnecessary ORM features
- Flask: No native async, manual validation setup
- Express.js: Would require different backend language

### 2. Frontend Framework: Next.js 14

**Decision**: Use Next.js 14 with App Router

**Rationale**:
- App Router provides clean route organization with route groups
- Server Components for initial page loads
- Client Components for interactive task management
- Built-in TypeScript support
- Better Auth has official Next.js integration

**Alternatives Considered**:
- Vite + React: No built-in routing, more setup required
- Remix: Smaller ecosystem, less Better Auth support
- SvelteKit: Team familiarity with React

### 3. Authentication: Better Auth

**Decision**: Use Better Auth for authentication

**Rationale**:
- Constitution mandates BETTER_AUTH_SECRET environment variable
- Handles JWT issuance and verification
- Session management built-in
- Works with both frontend (Next.js) and backend (JWT verification)

**Configuration**:
- Frontend: Better Auth client for signin/signup/signout
- Backend: JWT verification using shared secret
- Token: Access token in Authorization header

### 4. Database: Neon PostgreSQL

**Decision**: Use Neon PostgreSQL (serverless)

**Rationale**:
- Constitution requires PostgreSQL
- Serverless scales automatically
- Connection pooling built-in
- Branching for development/staging

**Connection Pattern**:
- Use asyncpg for async connections in FastAPI
- Connection string via DATABASE_URL environment variable

### 5. Styling: Tailwind CSS

**Decision**: Use Tailwind CSS

**Rationale**:
- Rapid UI development
- Responsive utilities built-in
- No CSS file management
- Consistent design system

### 6. API Client Pattern

**Decision**: Single API client abstraction in `lib/api.ts`

**Rationale**:
- Constitution requires single API client abstraction
- Centralizes JWT attachment
- Consistent error handling
- Easy to mock for testing

**Implementation**:
```typescript
// lib/api.ts - conceptual
const api = {
  async fetch(path: string, options?: RequestInit) {
    const session = await getSession();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.accessToken}`,
      ...options?.headers,
    };
    return fetch(`${API_URL}${path}`, { ...options, headers });
  }
};
```

## Security Considerations

### JWT Flow

1. User signs in via Better Auth on frontend
2. Better Auth issues JWT with user ID in claims
3. Frontend stores token (Better Auth handles this)
4. Frontend attaches token to all API requests
5. Backend verifies JWT signature using BETTER_AUTH_SECRET
6. Backend extracts user_id from JWT claims
7. All queries filtered by user_id

### Ownership Enforcement

Every task endpoint MUST:
1. Extract user_id from verified JWT
2. Include `WHERE user_id = ?` in query
3. Return 403 if task belongs to different user
4. Never accept user_id from request body

### Environment Variables

| Variable | Purpose | Layer |
|----------|---------|-------|
| DATABASE_URL | PostgreSQL connection string | Backend |
| BETTER_AUTH_SECRET | JWT signing/verification | Both |
| BETTER_AUTH_URL | Auth server URL | Frontend |
| NEXT_PUBLIC_API_URL | Backend API URL | Frontend |

## Performance Considerations

### Database Indexes

Required indexes for query performance:
- `tasks.user_id` - Every query filters by user
- `tasks.completed` - Filter/sort by completion status
- `users.email` - Login lookup

### Connection Pooling

- Neon provides built-in connection pooling
- Use pooled connection string for application
- Direct connection for migrations only

## Resolved Clarifications

| Item | Resolution |
|------|------------|
| Auth method | Better Auth with JWT (per constitution) |
| Database | Neon PostgreSQL (per user input) |
| Frontend framework | Next.js 14 (per user input) |
| Backend framework | FastAPI (per user input) |
| Styling | Tailwind CSS (per user input) |

## Open Questions

None — all technical decisions resolved.
