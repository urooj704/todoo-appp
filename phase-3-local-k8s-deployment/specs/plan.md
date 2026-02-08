# Implementation Plan: Local Kubernetes Deployment (Phase IV)

**Branch**: `003-local-k8s-deployment` | **Date**: 2026-02-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-local-k8s-deployment/spec.md`

## Summary

Deploy the Phase III Todo AI Chatbot (Next.js frontend, FastAPI backend, MCP server) to a local Minikube Kubernetes cluster. The deployment is fully containerized with Docker, managed by a single Helm chart (`todo-chatbot`), and supports horizontal scaling. Three services are deployed: frontend (NodePort), backend API (NodePort), and MCP server (ClusterIP). The external Neon PostgreSQL database is not containerized. Research determined: multi-stage Alpine builds for frontend, python:3.11-slim for backend, MCP server as a separate Deployment sharing the backend image, and `minikube image load` for local image delivery.

## Technical Context

**Language/Version**: Python 3.11 (backend), Node.js 20 (frontend), Go templates (Helm)
**Primary Dependencies**: FastAPI, uvicorn, Next.js 14, Helm 3, Minikube, Docker
**Storage**: External Neon PostgreSQL (not containerized)
**Testing**: Manual validation via kubectl, curl, and browser. AI-assisted diagnostics via Docker AI, kubectl-ai, Kagent.
**Target Platform**: Local Minikube cluster (Windows host)
**Project Type**: Web application (frontend + backend + MCP server)
**Performance Goals**: Pods Running within 60s, single-command deploy under 2 minutes
**Constraints**: Local-only deployment, no cloud, no CI/CD, no container registry
**Scale/Scope**: 3 services, 1 namespace, scalable replicas, single Helm chart

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| No hardcoded IDs or user identifiers | PASS | No application code changes; Docker/Helm use env vars |
| No hardcoded secrets or tokens | PASS | Secrets passed via `--set` flags or `values-secrets.yaml` (gitignored); stored in K8s Secrets |
| No hidden state that bypasses authentication | PASS | No auth changes; existing JWT flow preserved |
| No behavior outside constitution | PASS | Phase IV is infrastructure-only; no application behavior changes |
| All API endpoints return correct status codes | PASS | No API changes; existing endpoints preserved as-is |
| All queries are user-scoped | PASS | No database or query changes |
| JWT validation on every protected endpoint | PASS | No backend code changes |
| Frontend MUST NOT access database directly | PASS | Frontend connects to backend API via `NEXT_PUBLIC_API_URL` |
| Backend MUST NOT render UI | PASS | Backend serves JSON API only |
| Each layer MUST be independently deployable | PASS | Each service is a separate Kubernetes Deployment |
| Cross-layer communication MUST use defined APIs only | PASS | Frontend→Backend via REST, Backend→MCP via HTTP |

**Post-design re-check**: PASS. All constitution gates satisfied. Phase IV makes zero application code changes — only adds infrastructure files (Dockerfiles, Helm chart, .dockerignore). The existing `next.config.js` requires a one-line change to enable `output: 'standalone'` for containerization, which is configuration (not behavior).

## Project Structure

### Documentation (this feature)

```text
specs/003-local-k8s-deployment/
├── plan.md              # This file
├── research.md          # Phase 0 output — technology decisions
├── data-model.md        # Phase 1 output — infrastructure entity model
├── quickstart.md        # Phase 1 output — deployment quick-reference
├── contracts/           # Phase 1 output
│   ├── helm-values-contract.yaml    # Helm values structure
│   ├── docker-build-contract.md     # Docker build specifications
│   └── deployment-flow-contract.md  # Step-by-step deployment flow
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /sp.tasks)
```

### Source Code (repository root)

```text
# New files for Phase IV (infrastructure only)
frontend/
├── Dockerfile           # Multi-stage Next.js build
└── .dockerignore        # Exclude node_modules, .next, etc.

backend/
├── Dockerfile           # Python slim + uvicorn
└── .dockerignore        # Exclude __pycache__, .venv, etc.

helm/
└── todo-chatbot/
    ├── Chart.yaml       # Chart metadata
    ├── values.yaml      # Default configuration values
    └── templates/
        ├── _helpers.tpl              # Template helper functions
        ├── namespace.yaml            # todo-local namespace
        ├── configmap.yaml            # Non-sensitive config
        ├── secret.yaml               # Sensitive credentials
        ├── backend-deployment.yaml   # FastAPI deployment
        ├── backend-service.yaml      # Backend NodePort service
        ├── frontend-deployment.yaml  # Next.js deployment
        ├── frontend-service.yaml     # Frontend NodePort service
        ├── mcp-deployment.yaml       # MCP server deployment
        └── mcp-service.yaml          # MCP ClusterIP service

# Modified existing files
frontend/
└── next.config.js       # Add output: 'standalone' for containerization
```

**Structure Decision**: Web application with existing `frontend/` and `backend/` directories. New `helm/todo-chatbot/` directory at repo root contains all Kubernetes infrastructure. Dockerfiles are co-located with their respective service directories. No changes to existing application source code.

## Implementation Phases

### Phase A — Containerization

#### A1. Backend Dockerfile

Create `backend/Dockerfile` using `python:3.11-slim`:

1. Set working directory to `/app`
2. Copy `requirements.txt` and install dependencies (pip, no cache)
3. Copy application source (`app/` and `mcp_server/`)
4. Expose port 8000
5. Set default command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

Create `backend/.dockerignore`:
- `__pycache__`, `*.pyc`, `.venv`, `.env`, `.git`, `tests/`, `*.md`

**Verification**: `docker build -t todo-backend:phase4 backend/` succeeds. `docker run --rm -e DATABASE_URL=x -e BETTER_AUTH_SECRET=x todo-backend:phase4 python -c "print('ok')"` runs without error.

#### A2. Frontend Dockerfile

Update `frontend/next.config.js` to add `output: 'standalone'`.

Create `frontend/Dockerfile` using multi-stage build:

**Stage 1 — deps** (`node:20-alpine`):
1. Copy `package.json` and `package-lock.json`
2. Run `npm ci` (clean install)

**Stage 2 — builder** (`node:20-alpine`):
1. Copy deps from Stage 1
2. Copy source code
3. Accept `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL` as build args
4. Set them as environment variables
5. Run `npm run build`

**Stage 3 — runner** (`node:20-alpine`):
1. Set `NODE_ENV=production`
2. Create non-root user
3. Copy standalone output from builder
4. Copy `public/` and `.next/static/` assets
5. Expose port 3000
6. Run `node server.js`

Create `frontend/.dockerignore`:
- `node_modules`, `.next`, `.git`, `*.md`

**Verification**: `docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000/api --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 -t todo-frontend:phase4 frontend/` succeeds.

### Phase B — Helm Chart Development

#### B1. Chart Structure

Create `helm/todo-chatbot/Chart.yaml`:
```yaml
apiVersion: v2
name: todo-chatbot
description: Todo AI Chatbot - Helm chart for local Kubernetes deployment
type: application
version: 0.1.0
appVersion: "phase4"
```

Create `helm/todo-chatbot/values.yaml` per the Helm values contract (`contracts/helm-values-contract.yaml`).

#### B2. Template Helpers

Create `helm/todo-chatbot/templates/_helpers.tpl`:
- `todo-chatbot.fullname` — chart full name
- `todo-chatbot.labels` — common labels (app.kubernetes.io/name, instance, version, managed-by)
- `todo-chatbot.selectorLabels` — selector labels for deployments/services

#### B3. Namespace

Create `helm/todo-chatbot/templates/namespace.yaml`:
- Creates `todo-local` namespace (parameterized from values)

#### B4. ConfigMap

Create `helm/todo-chatbot/templates/configmap.yaml`:
- Non-sensitive environment variables for backend and frontend
- Keys: `CORS_ORIGINS`, `BETTER_AUTH_URL`, `MCP_SERVER_URL`, `MCP_SERVER_PORT`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `MAX_CONVERSATION_HISTORY`

#### B5. Secret

Create `helm/todo-chatbot/templates/secret.yaml`:
- Kubernetes Secret with values base64-encoded via Helm's `b64enc` function
- Keys: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `OPENAI_API_KEY`, `CHATKIT_WORKFLOW_ID`

#### B6. Backend Deployment & Service

Create `helm/todo-chatbot/templates/backend-deployment.yaml`:
- Deployment in `todo-local` namespace
- Image: `{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}`
- Replicas: `{{ .Values.backend.replicaCount }}`
- Container port: 8000
- Command: `["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`
- Environment from ConfigMap (filtered) + Secret
- Resource limits from values
- Liveness probe: GET `/health` port 8000
- Readiness probe: GET `/health` port 8000

Create `helm/todo-chatbot/templates/backend-service.yaml`:
- NodePort service targeting port 8000
- NodePort: `{{ .Values.backend.service.nodePort }}`

#### B7. Frontend Deployment & Service

Create `helm/todo-chatbot/templates/frontend-deployment.yaml`:
- Deployment in `todo-local` namespace
- Image: `{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}`
- Replicas: `{{ .Values.frontend.replicaCount }}`
- Container port: 3000
- Environment from ConfigMap (filtered)
- Resource limits from values
- Liveness probe: GET `/` port 3000
- Readiness probe: GET `/` port 3000

Create `helm/todo-chatbot/templates/frontend-service.yaml`:
- NodePort service targeting port 3000
- NodePort: `{{ .Values.frontend.service.nodePort }}`

#### B8. MCP Server Deployment & Service

Create `helm/todo-chatbot/templates/mcp-deployment.yaml`:
- Deployment in `todo-local` namespace
- Image: `{{ .Values.mcp.image.repository }}:{{ .Values.mcp.image.tag }}` (same as backend)
- Replicas: `{{ .Values.mcp.replicaCount }}`
- Container port: 8001
- Command: `["python", "-m", "mcp_server.run"]`
- Environment from ConfigMap + Secret (needs DATABASE_URL, MCP_SERVER_PORT)
- Resource limits from values
- Readiness probe: TCP port 8001

Create `helm/todo-chatbot/templates/mcp-service.yaml`:
- ClusterIP service targeting port 8001

### Phase C — Local Deployment & Validation

#### C1. Minikube Setup
1. Start Minikube: `minikube start --cpus=2 --memory=4096`
2. Capture Minikube IP: `minikube ip`
3. Verify: `kubectl cluster-info`

#### C2. Build & Load Images
1. Build backend image: `docker build -t todo-backend:phase4 backend/`
2. Build frontend image with build args (Minikube IP + NodePorts)
3. Load both into Minikube: `minikube image load <image>`

#### C3. Helm Install
1. Single `helm install` command with all `--set` overrides for secrets and URLs
2. Verify: `kubectl get pods -n todo-local` — all Running
3. Verify: `kubectl get svc -n todo-local` — NodePorts assigned

#### C4. Service Validation
1. Frontend: Browser access at `http://<MINIKUBE_IP>:30080`
2. Backend: `curl http://<MINIKUBE_IP>:30081/health` returns `{"status":"ok"}`
3. End-to-end: Sign in and create a task via the UI

### Phase D — Scaling & Hardening

#### D1. Scaling Test
1. Scale frontend: `kubectl scale deployment todo-frontend --replicas=3 -n todo-local`
2. Verify 3 pods Running within 90 seconds
3. Scale backend: `kubectl scale deployment todo-backend --replicas=2 -n todo-local`
4. Verify 2 pods Running

#### D2. Restart Resilience Test
1. Stop Minikube: `minikube stop`
2. Start Minikube: `minikube start`
3. Verify all pods recover to Running within 120 seconds

#### D3. Reproducibility Test
1. `helm uninstall todo-chatbot -n todo-local`
2. `helm install todo-chatbot helm/todo-chatbot --namespace todo-local --create-namespace --set ...`
3. Verify identical working state

### Phase E — AI DevOps Integration

#### E1. Docker AI (Gordon)
- Validate Dockerfiles for optimization suggestions
- Review image sizes and layer efficiency

#### E2. kubectl-ai
- Demonstrate pod diagnostics
- Demonstrate scaling commands
- Document failure investigation workflow

#### E3. Kagent
- Run cluster health analysis
- Document resource optimization suggestions

## Complexity Tracking

No constitution violations to justify. Phase IV is infrastructure-only and does not modify application behavior.

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Minikube resource exhaustion during scaling | Medium | Medium | Conservative resource limits (50-500m CPU, 64-512Mi memory); document minimum system requirements |
| Frontend NEXT_PUBLIC_API_URL baked at build time | High | High | Document that frontend image must be rebuilt if Minikube IP changes; add build-arg to Dockerfile |
| Neon DB connectivity from Minikube pods | Low | High | Minikube uses host networking by default; test connectivity early in validation |
| MCP server startup race condition with backend | Medium | Low | Kubernetes readiness probes prevent traffic routing until MCP server is ready; backend retries MCP connections |

## Decisions Summary

| # | Decision | Rationale | See |
|---|----------|-----------|-----|
| D1 | Multi-stage Alpine build for frontend | Smallest image, standalone Next.js output eliminates need for full node_modules | research.md R1 |
| D2 | python:3.11-slim for backend | Supports asyncpg/cryptography natively, no Alpine compilation issues | research.md R2 |
| D3 | MCP server as separate Deployment | Independent lifecycle, clean service discovery, shared image | research.md R3 |
| D4 | `minikube image load` for image delivery | Simplest approach, works with any Minikube driver | research.md R4 |
| D5 | Single Helm chart for all services | One-command deploy, unified values.yaml | research.md R5 |
| D6 | Both frontend and backend on NodePort | Browser needs direct access to both (client-side rendering) | research.md R7 |
| D7 | Secrets via `--set` overrides | No secrets in version control, supports local values file | research.md R8 |
