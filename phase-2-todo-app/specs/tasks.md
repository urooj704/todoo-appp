# Tasks: Phase II Todo Web App

**Input**: Design documents from `/specs/001-phase-ii-todo-app/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/api.yaml, research.md, quickstart.md

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/` for source, `backend/tests/` for tests
- **Frontend**: `frontend/src/` for source

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create backend directory structure per plan.md at backend/
- [X] T002 Create frontend directory structure per plan.md at frontend/
- [X] T003 [P] Initialize Python project with requirements.txt at backend/requirements.txt
- [X] T004 [P] Initialize Next.js 14 project with package.json at frontend/package.json
- [X] T005 [P] Configure Tailwind CSS at frontend/tailwind.config.ts
- [X] T006 [P] Create backend environment template at backend/.env.example
- [X] T007 [P] Create frontend environment template at frontend/.env.local.example
- [X] T008 [P] Create TypeScript types file at frontend/src/lib/types.ts

**Checkpoint**: Project structure ready — backend and frontend initialized ✓

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Create database connection module at backend/app/database.py
- [X] T010 Create environment configuration at backend/app/config.py
- [X] T011 [P] Create SQL migration for tasks table at backend/migrations/001_create_tasks.sql
- [X] T012 [P] Create Task SQLAlchemy model at backend/app/models/task.py
- [X] T013 [P] Create Task Pydantic schemas (TaskCreate, TaskUpdate, Task) at backend/app/schemas/task.py
- [X] T014 Create FastAPI application entry point at backend/app/main.py
- [X] T015 [P] Create API client abstraction at frontend/src/lib/api.ts
- [X] T016 [P] Create global styles with Tailwind at frontend/src/styles/globals.css
- [X] T017 Create root layout at frontend/src/app/layout.tsx

**Checkpoint**: Foundation ready — database, models, and base app configured ✓

---

## Phase 3: User Story 1 - User Registration and Authentication (Priority: P1)

**Goal**: Enable users to create accounts, sign in, sign out, and access protected routes

**Independent Test**: Create account, sign in, verify session exists, sign out, verify redirect to signin

### Implementation for User Story 1

- [X] T018 [US1] Configure Better Auth server at frontend/src/lib/auth.ts
- [X] T019 [US1] Create JWT verification dependency at backend/app/auth/dependencies.py
- [X] T020 [P] [US1] Create token utilities at backend/app/auth/utils.py
- [X] T021 [US1] Create AuthForm component (signin/signup modes) at frontend/src/components/AuthForm.tsx
- [X] T022 [P] [US1] Create signin page at frontend/src/app/(auth)/signin/page.tsx
- [X] T023 [P] [US1] Create signup page at frontend/src/app/(auth)/signup/page.tsx
- [X] T024 [US1] Create protected layout with auth check at frontend/src/app/(protected)/layout.tsx
- [X] T025 [US1] Add signout functionality to protected layout at frontend/src/app/(protected)/layout.tsx
- [X] T026 [US1] Configure auth middleware for API routes at backend/app/main.py

**Checkpoint**: User Story 1 complete — users can register, sign in, sign out, and protected routes redirect unauthenticated users ✓

---

## Phase 4: User Story 2 - Create and View Tasks (Priority: P2)

**Goal**: Enable authenticated users to create tasks and view their own task list

**Independent Test**: Sign in, create multiple tasks, verify all appear in list, verify empty state when no tasks

### Implementation for User Story 2

- [X] T027 [US2] Implement GET /api/tasks endpoint (list user's tasks) at backend/app/routers/tasks.py
- [X] T028 [US2] Implement POST /api/tasks endpoint (create task) at backend/app/routers/tasks.py
- [X] T029 [US2] Register tasks router in FastAPI app at backend/app/main.py
- [X] T030 [P] [US2] Create TaskForm component at frontend/src/components/TaskForm.tsx
- [X] T031 [P] [US2] Create TaskItem component at frontend/src/components/TaskItem.tsx
- [X] T032 [US2] Create TaskList component at frontend/src/components/TaskList.tsx
- [X] T033 [US2] Create tasks page with list and create form at frontend/src/app/(protected)/tasks/page.tsx
- [X] T034 [US2] Add empty state UI to TaskList component at frontend/src/components/TaskList.tsx
- [X] T035 [US2] Add loading and error states to tasks page at frontend/src/app/(protected)/tasks/page.tsx

**Checkpoint**: User Story 2 complete — users can create tasks and view their list with proper states ✓

---

## Phase 5: User Story 3 - Update Tasks (Priority: P3)

**Goal**: Enable authenticated users to edit task title and description

**Independent Test**: Create task, edit title and description, verify changes persist after refresh

### Implementation for User Story 3

- [X] T036 [US3] Implement GET /api/tasks/{id} endpoint at backend/app/routers/tasks.py
- [X] T037 [US3] Implement PUT /api/tasks/{id} endpoint with ownership check at backend/app/routers/tasks.py
- [X] T038 [US3] Add edit mode to TaskItem component at frontend/src/components/TaskItem.tsx
- [X] T039 [US3] Add inline edit form to TaskItem at frontend/src/components/TaskItem.tsx
- [X] T040 [US3] Add validation error display for empty title at frontend/src/components/TaskItem.tsx
- [X] T041 [US3] Handle 403 Forbidden response in API client at frontend/src/lib/api.ts

**Checkpoint**: User Story 3 complete — users can edit their tasks with validation ✓

---

## Phase 6: User Story 4 - Complete and Incomplete Tasks (Priority: P4)

**Goal**: Enable authenticated users to toggle task completion status

**Independent Test**: Create task, mark complete, verify visual state, mark incomplete, verify state reverts

### Implementation for User Story 4

- [X] T042 [US4] Implement PATCH /api/tasks/{id}/complete endpoint at backend/app/routers/tasks.py
- [X] T043 [US4] Add completion toggle UI to TaskItem at frontend/src/components/TaskItem.tsx
- [X] T044 [US4] Add completed visual styling (strikethrough, checkbox) at frontend/src/components/TaskItem.tsx
- [X] T045 [US4] Wire toggle to API endpoint at frontend/src/components/TaskItem.tsx

**Checkpoint**: User Story 4 complete — users can toggle task completion with visual feedback ✓

---

## Phase 7: User Story 5 - Delete Tasks (Priority: P5)

**Goal**: Enable authenticated users to delete their tasks

**Independent Test**: Create task, delete it, verify removed from list, verify stays removed after refresh

### Implementation for User Story 5

- [X] T046 [US5] Implement DELETE /api/tasks/{id} endpoint with ownership check at backend/app/routers/tasks.py
- [X] T047 [US5] Add delete button to TaskItem at frontend/src/components/TaskItem.tsx
- [X] T048 [US5] Add delete confirmation (optional) at frontend/src/components/TaskItem.tsx
- [X] T049 [US5] Wire delete to API endpoint and update list at frontend/src/components/TaskItem.tsx

**Checkpoint**: User Story 5 complete — users can delete tasks ✓

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T050 [P] Add responsive breakpoints to all components at frontend/src/components/*.tsx
- [X] T051 [P] Add mobile navigation/header at frontend/src/app/(protected)/layout.tsx
- [X] T052 [P] Add consistent error handling across all API calls at frontend/src/lib/api.ts
- [X] T053 [P] Add security headers to FastAPI responses at backend/app/main.py
- [X] T054 [P] Add CORS configuration at backend/app/main.py
- [X] T055 Add health check endpoint at backend/app/main.py
- [X] T056 Create home page with redirect logic at frontend/src/app/page.tsx
- [X] T057 [P] Validate all API responses match contracts/api.yaml at backend/app/routers/tasks.py

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — authentication foundation
- **User Story 2 (Phase 4)**: Depends on User Story 1 — requires auth to create/view tasks
- **User Story 3 (Phase 5)**: Depends on User Story 2 — requires tasks to exist for editing
- **User Story 4 (Phase 6)**: Depends on User Story 2 — requires tasks to exist for completion
- **User Story 5 (Phase 7)**: Depends on User Story 2 — requires tasks to exist for deletion
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

```text
                    ┌─────────────────┐
                    │  Foundational   │
                    │    (Phase 2)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  User Story 1   │
                    │ Authentication  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  User Story 2   │
                    │ Create & View   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼─────────┐ ┌──────▼──────┐ ┌─────────▼─────────┐
│  User Story 3     │ │ User Story 4│ │  User Story 5     │
│  Update Tasks     │ │  Complete   │ │  Delete Tasks     │
└───────────────────┘ └─────────────┘ └───────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │     Polish      │
                    │   (Phase 8)     │
                    └─────────────────┘
```

### Parallel Opportunities

**Within Phase 1 (Setup)**:
```text
T003, T004, T005, T006, T007, T008 — All parallelizable after T001, T002
```

**Within Phase 2 (Foundational)**:
```text
T011, T012, T013 — Parallelizable (different files)
T015, T016 — Parallelizable (different directories)
```

**Within Phase 3 (US1)**:
```text
T020, T022, T023 — Parallelizable after T018, T019
```

**Within Phase 4 (US2)**:
```text
T030, T031 — Parallelizable (different components)
```

**User Stories 3, 4, 5 can run in parallel** after User Story 2 completes (if team capacity allows)

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (Create & View Tasks)
5. **STOP and VALIDATE**: Test independently
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test auth independently → Demo
3. Add User Story 2 → Test create/view → Demo (MVP!)
4. Add User Story 3 → Test edit → Demo
5. Add User Story 4 → Test completion → Demo
6. Add User Story 5 → Test delete → Demo
7. Add Polish → Final validation

### Parallel Team Strategy

With multiple developers after Phase 2:

- **Developer A**: User Story 1 → User Story 3
- **Developer B**: (waits for US1) → User Story 2 → User Story 4
- **Developer C**: (waits for US2) → User Story 5 → Polish

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after its dependencies
- Verify each checkpoint before proceeding to next phase
- Commit after each task or logical group
- Total: 57 tasks across 8 phases
