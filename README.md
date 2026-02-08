# Todoo App

A full-stack Todo application built with **FastAPI** (backend) and **Next.js** (frontend), featuring AI chatbot integration, Kubernetes deployment, and cloud event-driven architecture.

## Project Structure

```
todoo-appp/
├── src/                              # Next.js frontend (root - deploys to Vercel)
├── package.json
├── next.config.js
├── phase-2-todo-app/
│   ├── backend/                      # FastAPI backend
│   └── specs/                        # Phase 2 specs & docs
├── phase-3-ai-chatbot/
│   └── specs/                        # Phase 3 AI chatbot specs
├── phase-3-local-k8s-deployment/
│   ├── helm/                         # Helm charts for K8s
│   └── specs/                        # Phase 3 K8s specs
└── phase-4-cloud-event-driven/
    └── specs/                        # Phase 4 cloud specs
```

## Project Phases

### Phase 2 - Todo App
Core full-stack todo application with:
- **Backend** (`phase-2-todo-app/backend/`): FastAPI with async PostgreSQL (Neon), JWT authentication, CRUD operations
- **Frontend** (repo root `src/`): Next.js 14 with Tailwind CSS, authentication pages, task management UI
- **Specs** (`phase-2-todo-app/specs/`): Feature specification, architecture plan, data model, and tasks

### Phase 3 - AI Chatbot (`phase-3-ai-chatbot/`)
AI-powered chatbot integration:
- OpenAI-based conversational agent for task management
- MCP (Model Context Protocol) server for tool-based interactions
- Conversation history and context management

### Phase 3 - Local K8s Deployment (`phase-3-local-k8s-deployment/`)
Kubernetes containerization and local deployment:
- **Helm Charts**: Complete Helm chart for backend, frontend, and MCP server
- Kubernetes manifests (deployments, services, configmaps, secrets)

### Phase 4 - Cloud Event-Driven (`phase-4-cloud-event-driven/`)
Cloud-native event-driven architecture (planning stage)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python, SQLAlchemy, Alembic |
| Database | PostgreSQL (Neon) |
| AI | OpenAI API, MCP Protocol |
| Auth | JWT (Better Auth) |
| Deployment | Docker, Kubernetes, Helm |

## Deploy on Vercel

1. Import this repo on [Vercel](https://vercel.com/new)
2. Framework Preset: **Next.js** (auto-detected)
3. Click **Deploy**

## Getting Started (Local)

```bash
npm install
npm run dev
```

See `phase-2-todo-app/specs/quickstart.md` for full setup instructions.
