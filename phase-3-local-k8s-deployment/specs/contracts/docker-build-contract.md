# Docker Build Contracts

## Frontend Image: todo-frontend:phase4

**Build context**: `frontend/`
**Dockerfile**: `frontend/Dockerfile`

### Build Stages

| Stage | Base Image | Purpose |
|-------|-----------|---------|
| deps | node:20-alpine | Install npm dependencies |
| builder | node:20-alpine | Run `next build` with standalone output |
| runner | node:20-alpine | Run the standalone Next.js server |

### Required Build Args

| Arg | Description | Example |
|-----|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (Minikube IP + NodePort) | `http://192.168.49.2:30081/api` |
| `NEXT_PUBLIC_APP_URL` | Frontend app URL | `http://192.168.49.2:30080` |

### Exposed Port
- **3000** (Next.js standalone server default)

### Build Command
```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://<MINIKUBE_IP>:30081/api \
  --build-arg NEXT_PUBLIC_APP_URL=http://<MINIKUBE_IP>:30080 \
  -t todo-frontend:phase4 \
  frontend/
```

### Load into Minikube
```bash
minikube image load todo-frontend:phase4
```

---

## Backend Image: todo-backend:phase4

**Build context**: `backend/`
**Dockerfile**: `backend/Dockerfile`

### Build Stages

| Stage | Base Image | Purpose |
|-------|-----------|---------|
| (single) | python:3.11-slim | Install deps, copy app, run uvicorn |

### Environment Variables (runtime, not build-time)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | JWT signing secret |
| `BETTER_AUTH_URL` | Yes | Frontend URL for auth |
| `CORS_ORIGINS` | Yes | Allowed CORS origins |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `MCP_SERVER_URL` | Yes | MCP server URL (K8s service) |
| `MCP_SERVER_PORT` | No | MCP server port (default 8001) |
| `CHATKIT_WORKFLOW_ID` | No | ChatKit workflow ID |

### Exposed Port
- **8000** (uvicorn)

### Default Entrypoint
```
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Alternate Entrypoint (MCP Server)
```
python -m mcp_server.run
```

### Build Command
```bash
docker build -t todo-backend:phase4 backend/
```

### Load into Minikube
```bash
minikube image load todo-backend:phase4
```
