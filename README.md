# Todoo App

A full-stack Todo application built with **FastAPI** (backend) and **Next.js** (frontend), featuring AI chatbot integration, Kubernetes deployment, and cloud event-driven architecture.

## Project Phases

### Phase 2 - Todo App (`phase-2-todo-app/`)
Core full-stack todo application with:
- **Backend**: FastAPI with async PostgreSQL (Neon), JWT authentication, CRUD operations
- **Frontend**: Next.js 14 with Tailwind CSS, authentication pages, task management UI
- **Specs**: Feature specification, architecture plan, data model, and tasks

### Phase 3 - AI Chatbot (`phase-3-ai-chatbot/`)
AI-powered chatbot integration:
- OpenAI-based conversational agent for task management
- MCP (Model Context Protocol) server for tool-based interactions
- Conversation history and context management
- **Specs**: Chatbot specification, data model, and implementation tasks

### Phase 3 - Local K8s Deployment (`phase-3-local-k8s-deployment/`)
Kubernetes containerization and local deployment:
- **Helm Charts**: Complete Helm chart for backend, frontend, and MCP server
- Kubernetes manifests (deployments, services, configmaps, secrets)
- Docker configurations for all services
- **Specs**: Deployment specification, contracts, and quickstart guide

### Phase 4 - Cloud Event-Driven (`phase-4-cloud-event-driven/`)
Cloud-native event-driven architecture (planning stage):
- **Specs**: Cloud deployment specification and architecture plan

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
2. **Set Root Directory** to `phase-2-todo-app/frontend`
3. Framework Preset: **Next.js** (auto-detected)
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g. `https://your-backend.onrender.com/api`)
   - `NEXT_PUBLIC_APP_URL` - Your Vercel app URL
5. Click **Deploy**

## Getting Started (Local)

See `phase-2-todo-app/specs/quickstart.md` for setup instructions.
