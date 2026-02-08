# Implementation Plan: Phase II Todo Web App

**Branch**: `001-phase-ii-todo-app` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-phase-ii-todo-app/spec.md`

## Summary

Build a secure, multi-user Todo web application with JWT-based authentication, PostgreSQL persistence, and a responsive frontend. The system enforces strict data isolation where each user can only access their own tasks. Technical approach: Next.js frontend with Better Auth, FastAPI backend with JWT verification, Neon PostgreSQL database.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5.x (frontend)
**Primary Dependencies**: FastAPI, Better Auth, Next.js 14, Tailwind CSS
**Storage**: Neon PostgreSQL (cloud-hosted)
**Testing**: pytest (backend), Jest/React Testing Library (frontend)
**Target Platform**: Web (modern browsers), Linux server (backend)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: 100 concurrent users, <3s page load, <1s task operations
**Constraints**: Stateless backend, JWT-only auth, user-scoped queries
**Scale/Scope**: Multi-user (100+ users), 5 pages, 6 API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Scope | ✅ PASS | CRUD + complete tasks only, multi-user, auth required |
| II. Architecture | ✅ PASS | Frontend/Backend/Database separation enforced |
| III. Auth & Security | ✅ PASS | JWT on all requests, ownership enforced, BETTER_AUTH_SECRET |
| IV. API Rules | ✅ PASS | RESTful, JSON-only, correct status codes |
| V. Data Rules | ✅ PASS | User-scoped queries, FK to users, no global queries |
| VI. Frontend Rules | ✅ PASS | Auth-gated views, single API client, responsive |

**Quality Gates Compliance:**
- [ ] No hardcoded IDs or user identifiers → Enforced via JWT claims
- [ ] No hardcoded secrets → Environment variables only
- [ ] No hidden state bypassing auth → All routes protected
- [ ] All API endpoints return correct status codes → Defined in contracts
- [ ] All queries user-scoped → WHERE user_id = ? on every query
- [ ] JWT validation on every protected endpoint → Middleware enforced

## Project Structure

### Documentation (this feature)

```text
specs/001-phase-ii-todo-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.yaml         # OpenAPI specification
└── tasks.md             # Phase 2 output (/sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry
│   ├── config.py            # Environment configuration
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── dependencies.py  # JWT verification dependency
│   │   └── utils.py         # Token utilities
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # User model
│   │   └── task.py          # Task model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py          # Pydantic schemas for users
│   │   └── task.py          # Pydantic schemas for tasks
│   ├── routers/
│   │   ├── __init__.py
│   │   └── tasks.py         # Task CRUD endpoints
│   └── database.py          # Database connection
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_tasks.py
│   └── test_auth.py
├── requirements.txt
└── .env.example

frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home/redirect
│   │   ├── (auth)/
│   │   │   ├── signin/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   └── (protected)/
│   │       ├── layout.tsx   # Auth-gated layout
│   │       └── tasks/
│   │           └── page.tsx # Task list page
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── TaskForm.tsx
│   │   └── AuthForm.tsx
│   ├── lib/
│   │   ├── api.ts           # API client (single abstraction)
│   │   ├── auth.ts          # Better Auth client
│   │   └── types.ts         # TypeScript types
│   └── styles/
│       └── globals.css      # Tailwind imports
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.local.example
```

**Structure Decision**: Web application structure with separate frontend/ and backend/ directories. This enforces the constitution's layer separation requirement and allows independent deployment.

## Complexity Tracking

> No violations — design follows constitution principles.

| Principle | Compliance |
|-----------|------------|
| Layer separation | Frontend and backend in separate directories |
| Auth enforcement | JWT middleware on all task routes |
| Data isolation | user_id filter on every query |
| Stateless backend | No session storage, JWT-only |
