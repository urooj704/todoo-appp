# Research: Phase III AI Chatbot

**Branch**: `002-phase-iii-ai-chatbot` | **Date**: 2026-02-06

## Technology Decisions

### 1. Agent Framework: OpenAI Agents SDK

- **Decision**: Use `openai-agents` (pip) for agent orchestration
- **Rationale**: First-party OpenAI SDK with native MCP integration, built-in tool execution loop, conversation history via `to_input_list()`, and structured output support. Eliminates need for custom agent loop.
- **Alternatives considered**:
  - LangChain: Heavier, more abstraction layers, not needed for this scope
  - Raw OpenAI API + manual tool loop: More control but reinvents what the SDK provides
  - Claude API: Different provider ecosystem, no native MCP SDK integration with OpenAI ChatKit

**Key patterns**:
- `Agent(name, instructions, tools, mcp_servers, model_settings)` — Configure agent
- `Runner.run(agent, input)` — Execute agent with input
- `result.to_input_list()` — Convert result to input for next turn (manual history)
- `result.new_items` — Access tool calls, messages, and outputs
- `result.final_output` — Get final text response
- `MCPServerStreamableHttp(name, params)` — Connect to MCP server over HTTP

### 2. MCP Server: Official MCP Python SDK

- **Decision**: Use `mcp` (pip) with `FastMCP` framework for tool server
- **Rationale**: Official SDK with automatic schema generation from type hints, async support, lifespan management for database connections, and stateless HTTP transport for production.
- **Alternatives considered**:
  - Custom function tools via `@function_tool`: Simpler but loses MCP protocol benefits (tool discovery, schema standardization)
  - Third-party MCP frameworks: Less mature, less documentation

**Key patterns**:
- `FastMCP(name, stateless_http=True)` — Create stateless server
- `@mcp.tool()` — Decorator for tool definition with auto-generated schemas
- `ToolError` — Raise for user-facing errors
- `Context` — Access logging, app context (database connections)
- Lifespan manager for database connection pooling
- Transport: `streamable-http` for production (single endpoint, bidirectional)

### 3. Frontend Chat UI: OpenAI ChatKit

- **Decision**: Use `@openai/chatkit-react` (npm) for chat interface
- **Rationale**: Pre-built chat UI components from OpenAI with message rendering, loading states, input composer, and theming. User-specified requirement.
- **Alternatives considered**:
  - Custom chat component: Full control but more development time
  - ai/vercel SDK: Good React integration but different ecosystem

**Integration approach**: ChatKit with `getClientSecret` pattern:
1. Frontend calls our backend (`POST /api/chatkit/session`) to get a session token
2. ChatKit communicates with OpenAI's hosted agent service
3. The OpenAI-hosted agent connects to our MCP server (streamable-http) for tool execution
4. MCP tools operate on our Neon PostgreSQL database
5. Our backend separately stores conversation history for persistence

### 4. MCP Server Architecture

- **Decision**: Run MCP server as a standalone process alongside FastAPI, using streamable-http transport
- **Rationale**: Stateless HTTP transport allows the OpenAI-hosted agent to call our MCP tools remotely. Separation from FastAPI allows independent scaling.
- **Alternatives considered**:
  - Embed MCP tools as `@function_tool` in the agent: Loses MCP protocol, tools only callable locally
  - MCP via stdio: Only works for local subprocess, not for remote/hosted agent execution
  - Embed in FastAPI via mount: Possible but couples MCP lifecycle to FastAPI

### 5. Database: Neon PostgreSQL (existing)

- **Decision**: Extend existing Neon PostgreSQL with new tables (conversations, messages)
- **Rationale**: Reuse existing infrastructure, connection configuration, and SQLAlchemy async setup from Phase II
- **Alternatives considered**: None — existing infrastructure is appropriate

### 6. Chat Endpoint Architecture

- **Decision**: `POST /api/{user_id}/chat` on FastAPI backend for conversation management
- **Rationale**: Handles conversation creation, message persistence, and user authentication. The actual AI agent execution happens via OpenAI's hosted service connected to our MCP server.
- **Key responsibilities**:
  - Validate JWT and user_id match
  - Create/load conversations
  - Persist user and assistant messages
  - Return conversation_id and metadata

### 7. Conversation History Strategy

- **Decision**: Store all messages in PostgreSQL; load bounded recent history for agent context
- **Rationale**: Full history in DB for persistence (FR-007/FR-008), bounded window for agent context to manage cost and latency (spec assumption)
- **Window size**: Last 50 messages (configurable via environment variable)

## Constitution Compliance Notes

The Phase II constitution states "Anything not explicitly allowed in this constitution is disallowed." Phase III features (chatbot, conversations, MCP tools) are not listed in Phase II scope. A constitution amendment is recommended before merging Phase III to add:
- AI chatbot capability to Scope section
- Conversation/Message entities to Data Rules
- MCP integration to Architecture section

This is flagged as an ADR candidate.

## Environment Variables (New)

| Variable | Purpose | Required |
|----------|---------|----------|
| `OPENAI_API_KEY` | OpenAI API key for Agents SDK | Yes |
| `MCP_SERVER_PORT` | Port for MCP streamable-http server | Yes (default: 8001) |
| `MCP_SERVER_URL` | URL for MCP server (used by agent) | Yes |
| `CHATKIT_WORKFLOW_ID` | OpenAI Agent Builder workflow ID | Yes |
| `NEXT_PUBLIC_APP_URL` | Frontend URL for ChatKit domain allowlist | Yes |
| `MAX_CONVERSATION_HISTORY` | Max messages to load for context | No (default: 50) |
