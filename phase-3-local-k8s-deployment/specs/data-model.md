# Data Model: Local Kubernetes Deployment (Phase IV)

**Feature**: 003-local-k8s-deployment
**Date**: 2026-02-07

---

## Overview

Phase IV is an infrastructure/deployment phase. It does not introduce new application-level data models. The existing Phase II/III data models (Task, Conversation, Message, User) remain unchanged.

This document describes the **infrastructure entities** — the Kubernetes resources and Docker artifacts that constitute the deployment model.

---

## Infrastructure Entities

### Docker Image

| Attribute | Description |
|-----------|-------------|
| name | Image name (e.g., `todo-frontend`, `todo-backend`) |
| tag | Version tag (e.g., `phase4`) |
| registry | Local only (no remote registry) |
| build_context | Relative path to build directory (`frontend/` or `backend/`) |
| dockerfile | Path to Dockerfile within build context |

**Instances**:
- `todo-frontend:phase4` — Next.js production application
- `todo-backend:phase4` — FastAPI + MCP server application

---

### Kubernetes Namespace

| Attribute | Description |
|-----------|-------------|
| name | `todo-local` |
| purpose | Isolate all Phase IV resources from other Minikube workloads |

---

### Kubernetes Deployment (x3)

| Attribute | Frontend | Backend | MCP Server |
|-----------|----------|---------|------------|
| name | `todo-frontend` | `todo-backend` | `todo-mcp` |
| image | `todo-frontend:phase4` | `todo-backend:phase4` | `todo-backend:phase4` |
| replicas | 1 (scalable) | 1 (scalable) | 1 (scalable) |
| port | 3000 | 8000 | 8001 |
| command | (default entrypoint) | `uvicorn app.main:app` | `python -m mcp_server.run` |
| cpu_request | 100m | 100m | 50m |
| cpu_limit | 500m | 500m | 250m |
| mem_request | 128Mi | 128Mi | 64Mi |
| mem_limit | 512Mi | 512Mi | 256Mi |
| imagePullPolicy | Never | Never | Never |

---

### Kubernetes Service (x3)

| Attribute | Frontend | Backend | MCP Server |
|-----------|----------|---------|------------|
| name | `todo-frontend` | `todo-backend` | `todo-mcp` |
| type | NodePort | NodePort | ClusterIP |
| port | 3000 | 8000 | 8001 |
| targetPort | 3000 | 8000 | 8001 |
| nodePort | 30080 (configurable) | 30081 (configurable) | N/A |

---

### Kubernetes ConfigMap

| Key | Value | Used By |
|-----|-------|---------|
| `CORS_ORIGINS` | Frontend URL (Minikube IP + frontend NodePort) | Backend |
| `BETTER_AUTH_URL` | Frontend URL | Backend |
| `MCP_SERVER_URL` | `http://todo-mcp:8001` | Backend |
| `MCP_SERVER_PORT` | `8001` | MCP Server |
| `NEXT_PUBLIC_API_URL` | Backend URL (Minikube IP + backend NodePort) | Frontend (build-time) |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | Frontend |

---

### Kubernetes Secret

| Key | Description | Used By |
|-----|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Backend, MCP Server |
| `BETTER_AUTH_SECRET` | JWT signing secret (min 32 chars) | Backend |
| `OPENAI_API_KEY` | OpenAI API key for agent | Backend |
| `CHATKIT_WORKFLOW_ID` | ChatKit workflow identifier | Backend |

---

### Helm Chart

| Attribute | Value |
|-----------|-------|
| name | `todo-chatbot` |
| version | `0.1.0` |
| appVersion | `phase4` |
| release_name | `todo-chatbot` |
| namespace | `todo-local` |

---

## Entity Relationships

```
Helm Chart (todo-chatbot)
├── Namespace (todo-local)
├── ConfigMap (todo-chatbot-config)
├── Secret (todo-chatbot-secrets)
├── Frontend
│   ├── Deployment (todo-frontend) → uses todo-frontend:phase4 image
│   └── Service (todo-frontend) → NodePort 30080 → pod:3000
├── Backend
│   ├── Deployment (todo-backend) → uses todo-backend:phase4 image
│   └── Service (todo-backend) → NodePort 30081 → pod:8000
└── MCP Server
    ├── Deployment (todo-mcp) → uses todo-backend:phase4 image
    └── Service (todo-mcp) → ClusterIP → pod:8001
```

**Communication Flow**:
```
Browser → NodePort:30080 → Frontend pod:3000
Browser → NodePort:30081 → Backend pod:8000
Backend pod → ClusterIP:8001 → MCP Server pod:8001
Backend pod → External → Neon DB
MCP Server pod → External → Neon DB
```
