# Tasks: Phase III AI Chatbot

**Input**: Design documents from `/specs/002-phase-iii-ai-chatbot/`
**Prerequisites**: spec.md (user stories P1-P4), research.md (tech decisions), data-model.md (conversations, messages)

**Tests**: Not explicitly requested in the specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/` (FastAPI, Python)
- **Frontend**: `frontend/src/` (Next.js, TypeScript)
- **MCP Server**: `backend/mcp_server/` (standalone MCP process)
- **Migrations**: `backend/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Phase III dependencies and configure new environment variables

- [x] T001 Add Phase III Python dependencies (`openai-agents`, `mcp`) to `backend/requirements.txt`
- [x] T002 [P] Add Phase III frontend dependency (`@openai/chatkit-react`) to `frontend/package.json` and install
- [x] T003 [P] Add Phase III environment variables (OPENAI_API_KEY, MCP_SERVER_PORT, MCP_SERVER_URL, CHATKIT_WORKFLOW_ID, NEXT_PUBLIC_APP_URL, MAX_CONVERSATION_HISTORY) to `backend/app/config.py`
- [x] T004 [P] Create `.env.example` entries documenting all new Phase III environment variables at project root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, ORM models, and MCP server scaffold that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create database migration `backend/migrations/002_create_conversations_messages.sql` with conversations and messages tables, indexes, and triggers per data-model.md
- [x] T006 Create Conversation SQLAlchemy model in `backend/app/models/conversation.py` with id (UUID PK), user_id (FK), created_at, updated_at fields
- [x] T007 [P] Create Message SQLAlchemy model in `backend/app/models/message.py` with id (UUID PK), conversation_id (FK), user_id (FK), role (user/assistant), content (text), created_at fields
- [x] T008 Export new models from `backend/app/models/__init__.py`
- [x] T009 Create conversation service in `backend/app/services/conversation_service.py` with create_conversation, get_conversation, list_user_conversations, store_message, load_conversation_history functions (async, user-scoped)
- [x] T010 Create MCP server entry point in `backend/mcp_server/server.py` using FastMCP with stateless_http=True transport and lifespan manager for async database connection pool
- [x] T011 [P] Create MCP server configuration and startup script in `backend/mcp_server/run.py` to launch MCP server on MCP_SERVER_PORT

**Checkpoint**: Database tables exist, ORM models defined, conversation service operational, MCP server scaffold ready

---

## Phase 3: User Story 1 — Send a Message and Receive a Response (Priority: P1) MVP

**Goal**: Authenticated users can send a natural language message and receive an AI-generated text response via a chat endpoint. Conversations are created and continued.

**Independent Test**: Send POST to `/api/{user_id}/chat` with `{"message": "Hello"}` (no conversation_id) → receive JSON with conversation_id and assistant response text. Send again with the returned conversation_id → response continues the same thread.

### Implementation for User Story 1

- [x] T012 [US1] Create chat request/response Pydantic schemas in `backend/app/schemas/chat.py` — ChatRequest (message: str, conversation_id: optional UUID), ChatResponse (conversation_id: UUID, response: str, tool_calls: list)
- [x] T013 [US1] Create agent configuration module in `backend/app/services/agent.py` — configure OpenAI Agent with name, instructions (task management assistant), model_settings, and MCP server connection (MCPServerStreamableHttp pointing to MCP_SERVER_URL)
- [x] T014 [US1] Create chat service in `backend/app/services/chat_service.py` — orchestrates: load/create conversation, load bounded history, run agent via Runner.run with history as input, persist user + assistant messages, return response
- [x] T015 [US1] Create chat router in `backend/app/routers/chat.py` — POST `/api/{user_id}/chat` endpoint with JWT auth (get_current_user_id dependency), user_id path validation (must match JWT), delegates to chat_service
- [x] T016 [US1] Register chat router in `backend/app/main.py` — add `app.include_router(chat_router)`
- [x] T017 [US1] Add error handling to chat endpoint in `backend/app/routers/chat.py` — 401 for missing/invalid JWT, 403 for user_id mismatch and conversation ownership violations, 400 for empty message, 500 with user-friendly message for AI service failures

**Checkpoint**: Users can send messages, get AI responses, conversations are created/continued. US1 is fully functional and testable independently.

---

## Phase 4: User Story 2 — Manage Tasks Through Conversation (Priority: P2)

**Goal**: Users can create, list, update, complete, and delete tasks by chatting with the AI. The agent detects intent and invokes MCP tools.

**Independent Test**: Send "add a task called buy groceries" → task created and confirmed. Send "show my tasks" → task listed. Send "mark buy groceries as done" → task completed and confirmed.

### Implementation for User Story 2

- [x] T018 [P] [US2] Implement `add_task` MCP tool in `backend/mcp_server/tools/task_tools.py` — accepts user_id + title + optional description, creates task via SQLAlchemy, returns structured success/failure response
- [x] T019 [P] [US2] Implement `list_tasks` MCP tool in `backend/mcp_server/tools/task_tools.py` — accepts user_id + optional filter (completed/incomplete/all), queries user-scoped tasks, returns formatted task list
- [x] T020 [P] [US2] Implement `update_task` MCP tool in `backend/mcp_server/tools/task_tools.py` — accepts user_id + task identifier (title or id) + new title/description, validates ownership, updates task, returns confirmation
- [x] T021 [P] [US2] Implement `complete_task` MCP tool in `backend/mcp_server/tools/task_tools.py` — accepts user_id + task identifier, validates ownership, marks task completed, returns confirmation
- [x] T022 [P] [US2] Implement `delete_task` MCP tool in `backend/mcp_server/tools/task_tools.py` — accepts user_id + task identifier, validates ownership, deletes task, returns confirmation
- [x] T023 [US2] Register all task tools in `backend/mcp_server/server.py` — import and register add_task, list_tasks, update_task, complete_task, delete_task tools with the FastMCP server
- [x] T024 [US2] Update agent instructions in `backend/app/services/agent.py` — enhance system prompt to guide the agent on intent detection, tool selection, confirmation messages, clarifying questions for ambiguous requests, and task-not-found handling

**Checkpoint**: All five task operations work through natural language conversation. US2 is fully functional and testable independently.

---

## Phase 5: User Story 3 — Persistent Conversation History (Priority: P3)

**Goal**: Conversation history persists across sessions and server restarts. Users can resume previous conversations with full context.

**Independent Test**: Start a conversation (get conversation_id), send a few messages about tasks. Restart the server. Send a follow-up message with the same conversation_id → chatbot responds with awareness of prior context.

### Implementation for User Story 3

- [x] T025 [US3] Add list conversations endpoint in `backend/app/routers/chat.py` — GET `/api/{user_id}/conversations` returns user's conversations ordered by updated_at DESC, with JWT auth and user_id validation
- [x] T026 [US3] Add get conversation history endpoint in `backend/app/routers/chat.py` — GET `/api/{user_id}/conversations/{conversation_id}` returns conversation metadata and messages ordered by created_at ASC, with ownership validation
- [x] T027 [US3] Add conversation list/history Pydantic schemas in `backend/app/schemas/chat.py` — ConversationSummary (id, created_at, updated_at), ConversationDetail (id, messages list, created_at, updated_at), MessageResponse (id, role, content, created_at)
- [x] T028 [US3] Verify bounded history loading in `backend/app/services/chat_service.py` — ensure load_conversation_history respects MAX_CONVERSATION_HISTORY (default 50), uses `ORDER BY created_at DESC LIMIT N` then reverses in application code for chronological order

**Checkpoint**: Conversations survive server restarts, users can list and resume conversations. US3 is fully functional and testable independently.

---

## Phase 6: User Story 4 — Multi-Step Tool Chaining (Priority: P4)

**Goal**: Users can issue complex instructions requiring multiple tool operations in a single message, with clear per-step result reporting.

**Independent Test**: Send "add three tasks: buy milk, buy eggs, and buy bread" → three tasks created, chatbot confirms all three. Send "complete all my grocery tasks" → matching tasks completed with per-task confirmation.

### Implementation for User Story 4

- [x] T029 [US4] Verify agent handles multi-tool sequences in `backend/app/services/agent.py` — ensure the OpenAI Agent SDK's built-in tool execution loop processes multiple sequential tool calls from a single user message without custom orchestration
- [x] T030 [US4] Update agent instructions for multi-step reporting in `backend/app/services/agent.py` — add guidance for the agent to report results per-step, indicate which operations succeeded/failed, and handle partial failures gracefully
- [x] T031 [US4] Add tool_calls field population in `backend/app/services/chat_service.py` — extract tool call names/results from `result.new_items` and include in ChatResponse.tool_calls list so the frontend can see which tools were invoked

**Checkpoint**: Complex multi-tool requests execute correctly with per-step reporting. US4 is fully functional and testable independently.

---

## Phase 7: Frontend Chat Interface (Priority: P2)

**Goal**: Provide a ChatKit-powered conversational UI integrated with the backend chat endpoint

### Implementation for Frontend

- [x] T032 [P] Create ChatKit session endpoint in `backend/app/routers/chatkit.py` — POST `/api/chatkit/session` that returns a client secret for ChatKit authentication, secured with JWT
- [x] T033 [P] Create chat page in `frontend/src/app/(protected)/chat/page.tsx` — renders the ChatKit Thread and Composer components within the protected layout, calls `/api/chatkit/session` via `getClientSecret` pattern
- [x] T034 Add chat navigation link to protected layout in `frontend/src/app/(protected)/layout.tsx` — add "Chat" link in header nav alongside existing task navigation
- [x] T035 Create conversation sidebar component in `frontend/src/components/ConversationList.tsx` — fetches and displays user's conversations from GET `/api/{user_id}/conversations`, allows selecting a conversation to resume or starting a new one
- [x] T036 Add chat-related types to `frontend/src/lib/types.ts` — Conversation (id, created_at, updated_at), Message (id, role, content, created_at), ChatRequest, ChatResponse interfaces
- [x] T037 Add chat API methods to `frontend/src/lib/api.ts` — listConversations(), getConversation(id), sendMessage(userId, message, conversationId?), getChatkitSession() methods on ApiClient

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, security hardening, and configuration finalization

- [x] T038 [P] Add CORS configuration for MCP server in `backend/mcp_server/server.py` — ensure MCP server allows requests from the OpenAI-hosted agent service
- [x] T039 [P] Add graceful error handling for AI service unavailability in `backend/app/services/chat_service.py` — catch OpenAI API errors, return structured error with user-friendly message per edge case spec
- [x] T040 [P] Update `backend/app/database.py` to import and register new Conversation and Message models for `init_db()` table creation
- [x] T041 Validate all chat queries are user-scoped — audit conversation_service.py and MCP tools to confirm every query includes `WHERE user_id = ?` per constitution compliance
- [x] T042 Add input validation for empty/whitespace-only messages in `backend/app/schemas/chat.py` — ChatRequest.message must be non-empty after trimming, return 400 for violations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — core chat loop
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) and MCP server scaffold from Phase 2 — can run in parallel with US1 if MCP tools are built independently
- **US3 (Phase 5)**: Depends on US1 (needs working chat endpoint to test history persistence)
- **US4 (Phase 6)**: Depends on US2 (needs MCP tools registered to test multi-step chaining)
- **Frontend (Phase 7)**: Depends on US1 (needs working chat endpoint) — can start T032-T037 in parallel with US2-US4
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational → No dependencies on other stories
- **US2 (P2)**: Can start after Foundational → Independent of US1 (MCP tools are standalone), but full integration testing requires US1
- **US3 (P3)**: Depends on US1 → Conversation persistence needs a working chat endpoint
- **US4 (P4)**: Depends on US2 → Multi-step chaining needs MCP tools registered

### Within Each User Story

- Models/schemas before services
- Services before endpoints/routes
- Core implementation before error handling
- Route registration after route implementation

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can run in parallel (after T001)
- **Phase 2**: T006 + T007 can run in parallel (after T005); T010 + T011 in parallel
- **Phase 4**: T018, T019, T020, T021, T022 can ALL run in parallel (each is an independent MCP tool in the same file)
- **Phase 7**: T032 + T033 can run in parallel; T035 + T036 + T037 in parallel
- **Phase 8**: T038, T039, T040 can run in parallel

---

## Parallel Example: User Story 2 (MCP Tools)

```text
# All MCP tools can be developed in parallel (independent functions, same file):
Task T018: "Implement add_task MCP tool in backend/mcp_server/tools/task_tools.py"
Task T019: "Implement list_tasks MCP tool in backend/mcp_server/tools/task_tools.py"
Task T020: "Implement update_task MCP tool in backend/mcp_server/tools/task_tools.py"
Task T021: "Implement complete_task MCP tool in backend/mcp_server/tools/task_tools.py"
Task T022: "Implement delete_task MCP tool in backend/mcp_server/tools/task_tools.py"

# Then register all at once:
Task T023: "Register all task tools in backend/mcp_server/server.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T011)
3. Complete Phase 3: User Story 1 (T012-T017)
4. **STOP and VALIDATE**: Send a message to the chat endpoint, verify AI response returns
5. Deploy/demo if ready — users can chat with the AI

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (chat loop) → Test independently → **MVP!** Users can talk to the chatbot
3. Add US2 (MCP tools) → Test independently → Users can manage tasks via chat
4. Add US3 (history) → Test independently → Conversations persist across sessions
5. Add US4 (multi-step) → Test independently → Complex commands work
6. Add Frontend (chat UI) → Test independently → Full visual interface
7. Polish → Production-ready

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (US1)**: A working chat endpoint where authenticated users can send messages and receive AI responses with conversation creation and continuation. This validates the entire agent infrastructure (OpenAI Agents SDK, MCP server connection, database persistence) before adding tool complexity.

---

## Notes

- [P] tasks = different files or independent functions, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The plan.md is in template form; tasks derived from spec.md, research.md, and data-model.md
- MCP tools reuse existing Phase II SQLAlchemy patterns and Task model
- All new endpoints follow constitution: JWT required, user-scoped queries, structured error responses
