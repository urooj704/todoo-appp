# Tasks: Local Kubernetes Deployment (Phase IV)

**Input**: Design documents from `/specs/003-local-k8s-deployment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Branch**: `003-local-k8s-deployment`

**Tests**: No automated tests requested. Validation is manual via kubectl, curl, and browser per spec.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/` (Next.js application)
- **Backend**: `backend/` (FastAPI application)
- **Helm chart**: `helm/todo-chatbot/` (Kubernetes infrastructure)
- **Specs**: `specs/003-local-k8s-deployment/` (documentation)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create supporting files (.dockerignore) and modify existing config for containerization readiness

- [x] T001 [P] Create backend Docker ignore file in backend/.dockerignore excluding __pycache__, *.pyc, .venv, .env, .git, tests/, *.md
- [x] T002 [P] Create frontend Docker ignore file in frontend/.dockerignore excluding node_modules, .next, .git, *.md
- [x] T003 Add output: 'standalone' to frontend/next.config.js for containerized Next.js builds

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create Dockerfiles for both services — MUST be complete before Helm chart or Kubernetes deployment

**CRITICAL**: No Kubernetes deployment can begin until Docker images can be built successfully

- [x] T004 Create backend Dockerfile in backend/Dockerfile using python:3.11-slim base — set WORKDIR /app, copy requirements.txt, pip install --no-cache-dir, copy app/ and mcp_server/ directories, expose port 8000, CMD uvicorn app.main:app --host 0.0.0.0 --port 8000
- [x] T005 [P] Create frontend Dockerfile in frontend/Dockerfile with three-stage build — Stage 1 (deps): node:20-alpine, copy package.json and package-lock.json, npm ci; Stage 2 (builder): copy deps, copy source, accept NEXT_PUBLIC_API_URL and NEXT_PUBLIC_APP_URL as ARG, set as ENV, run npm run build; Stage 3 (runner): node:20-alpine, NODE_ENV=production, create non-root user, copy standalone output and public/ and .next/static/, expose 3000, run node server.js

**Checkpoint**: PASSED — Both Docker images build successfully. `todo-backend:phase4` (375MB), `todo-frontend:phase4` (222MB).

---

## Phase 3: User Story 1 - Containerize Application Services (Priority: P1)

**Goal**: Package frontend and backend as Docker containers that are portable, versioned, and deployable to any container runtime

**Independent Test**: Build both Docker images, run them locally with `docker run` providing required env vars, verify each service starts and responds to requests

**Depends on**: Phase 2 (Dockerfiles exist)

**Note**: User Story 1 is primarily satisfied by Phase 2 Dockerfiles. This phase covers the Helm chart infrastructure needed to manage those containers in Kubernetes, which also serves as the foundation for User Story 2.

### Implementation for User Story 1 + User Story 2 (Helm Chart)

#### Chart Scaffolding

- [x] T006 [P] [US1] Create Helm chart metadata in helm/todo-chatbot/Chart.yaml with apiVersion: v2, name: todo-chatbot, version: 0.1.0, appVersion: phase4
- [x] T007 [P] [US1] Create Helm values file in helm/todo-chatbot/values.yaml per contracts/helm-values-contract.yaml — define namespace, frontend (image, replicas, service, resources, env), backend (image, replicas, service, resources, env), mcp (image, replicas, service, resources, env), and secrets sections with placeholder defaults
- [x] T008 [P] [US1] Create Helm template helpers in helm/todo-chatbot/templates/_helpers.tpl — define todo-chatbot.fullname, todo-chatbot.labels (app.kubernetes.io/name, instance, version, managed-by), and todo-chatbot.selectorLabels

#### Namespace & Configuration

- [x] T009 [P] [US1] Create namespace template in helm/todo-chatbot/templates/namespace.yaml — create namespace from .Values.namespace (default: todo-local)
- [x] T010 [P] [US1] Create ConfigMap template in helm/todo-chatbot/templates/configmap.yaml — non-sensitive env vars: CORS_ORIGINS, BETTER_AUTH_URL, MCP_SERVER_URL, MCP_SERVER_PORT, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL, MAX_CONVERSATION_HISTORY
- [x] T011 [P] [US1] Create Secret template in helm/todo-chatbot/templates/secret.yaml — sensitive values base64-encoded via b64enc: DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, CHATKIT_WORKFLOW_ID

#### Backend Resources

- [x] T012 [P] [US1] Create backend Deployment template in helm/todo-chatbot/templates/backend-deployment.yaml — namespace from values, image from .Values.backend.image, replicas from values, container port 8000, command uvicorn, envFrom ConfigMap (CORS_ORIGINS, BETTER_AUTH_URL, MCP_SERVER_URL, MAX_CONVERSATION_HISTORY) + Secret (DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, CHATKIT_WORKFLOW_ID), resource limits from values, liveness/readiness probes GET /health port 8000, imagePullPolicy Never
- [x] T013 [P] [US1] Create backend Service template in helm/todo-chatbot/templates/backend-service.yaml — NodePort type, port 8000, targetPort 8000, nodePort from .Values.backend.service.nodePort (30081)

#### Frontend Resources

- [x] T014 [P] [US1] Create frontend Deployment template in helm/todo-chatbot/templates/frontend-deployment.yaml — namespace from values, image from .Values.frontend.image, replicas from values, container port 3000, envFrom ConfigMap (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL), resource limits from values, liveness/readiness probes GET / port 3000, imagePullPolicy Never
- [x] T015 [P] [US1] Create frontend Service template in helm/todo-chatbot/templates/frontend-service.yaml — NodePort type, port 3000, targetPort 3000, nodePort from .Values.frontend.service.nodePort (30080)

#### MCP Server Resources

- [x] T016 [P] [US1] Create MCP server Deployment template in helm/todo-chatbot/templates/mcp-deployment.yaml — namespace from values, image from .Values.mcp.image (same as backend), replicas from values, container port 8001, command python -m mcp_server.run, envFrom ConfigMap (MCP_SERVER_PORT) + Secret (DATABASE_URL), resource limits from values, readiness probe TCP port 8001, imagePullPolicy Never
- [x] T017 [P] [US1] Create MCP server Service template in helm/todo-chatbot/templates/mcp-service.yaml — ClusterIP type, port 8001, targetPort 8001

**Checkpoint**: Helm chart should template successfully — verify with `helm template todo-chatbot helm/todo-chatbot` producing valid YAML for all resources (namespace, configmap, secret, 3 deployments, 3 services)

---

## Phase 4: User Story 2 - Deploy to Local Kubernetes Cluster (Priority: P1)

**Goal**: Deploy the containerized application to Minikube using a single Helm install command with all pods reaching Running status

**Independent Test**: Start Minikube, build and load images, run `helm install`, verify all pods Running via `kubectl get pods -n todo-local`, access frontend at `http://<MINIKUBE_IP>:30080`, hit backend health check at `http://<MINIKUBE_IP>:30081/health`

**Depends on**: Phase 3 (Helm chart complete), Phase 2 (Docker images buildable)

### Implementation for User Story 2

- [ ] T018 [US2] Validate full deployment flow — start Minikube (`minikube start --cpus=2 --memory=4096`), build backend image (`docker build -t todo-backend:phase4 backend/`), build frontend image with build args for Minikube IP, load both images into Minikube (`minikube image load`), run `helm install todo-chatbot helm/todo-chatbot --namespace todo-local --create-namespace` with all --set overrides per contracts/deployment-flow-contract.md
- [ ] T019 [US2] Verify pod health — all pods in Running status via `kubectl get pods -n todo-local`, frontend accessible via browser at `http://<MINIKUBE_IP>:30080`, backend health check returns OK via `curl http://<MINIKUBE_IP>:30081/health`
- [ ] T020 [US2] Verify restart resilience — stop Minikube (`minikube stop`), start Minikube (`minikube start`), confirm all pods recover to Running within 120 seconds
- [ ] T021 [US2] Verify reproducibility — `helm uninstall todo-chatbot -n todo-local`, re-run `helm install` with same parameters, verify identical working state

**Checkpoint**: Full application stack running in Minikube, accessible from browser, surviving restarts, and reproducibly deployable

---

## Phase 5: User Story 3 - Scale Application Services (Priority: P2)

**Goal**: Verify horizontal scaling works — scale frontend and backend replicas independently and confirm all pods serve traffic

**Independent Test**: Scale frontend from 1 to 3 replicas via `kubectl scale`, verify all 3 pods Running within 90 seconds. Scale backend to 2 replicas, verify both Running.

**Depends on**: Phase 4 (deployment running in Minikube)

### Implementation for User Story 3

- [ ] T022 [US3] Test frontend scaling — run `kubectl scale deployment todo-frontend --replicas=3 -n todo-local`, verify 3 pods reach Running within 90 seconds via `kubectl get pods -n todo-local -l app=todo-frontend`
- [ ] T023 [US3] Test backend scaling — run `kubectl scale deployment todo-backend --replicas=2 -n todo-local`, verify 2 pods reach Running via `kubectl get pods -n todo-local -l app=todo-backend`
- [ ] T024 [US3] Test pod self-healing — terminate one frontend pod via `kubectl delete pod <pod-name> -n todo-local`, verify Kubernetes automatically restarts it to maintain desired replica count

**Checkpoint**: Scaling validated — both frontend and backend scale horizontally, pods self-heal after termination

---

## Phase 6: User Story 4 - Manage Deployment via Helm Values (Priority: P2)

**Goal**: All deployment parameters are configurable through Helm values — replica counts, resource limits, image tags, environment variables can be changed via `--set` or values file without modifying templates

**Independent Test**: Change `frontend.replicaCount` to 2 via `--set`, run `helm upgrade`, verify 2 frontend pods. Change image tag, verify pods recreated with new image.

**Depends on**: Phase 4 (deployment running in Minikube)

### Implementation for User Story 4

- [ ] T025 [US4] Test replica count override — run `helm upgrade todo-chatbot helm/todo-chatbot --reuse-values --set frontend.replicaCount=2`, verify 2 frontend pods created
- [ ] T026 [US4] Test resource limit override — run `helm upgrade todo-chatbot helm/todo-chatbot --reuse-values --set backend.resources.limits.memory=1Gi`, verify pod restarts with new limits via `kubectl describe pod -n todo-local -l app=todo-backend`
- [ ] T027 [US4] Test environment variable override — run `helm upgrade` with `--set backend.env.MAX_CONVERSATION_HISTORY=100`, verify ConfigMap updated and pods pick up new value

**Checkpoint**: Helm values parameterization validated — deployments are reproducible and customizable without template modification

---

## Phase 7: User Story 5 - AI-Assisted DevOps Operations (Priority: P3)

**Goal**: Use AI DevOps tools (Docker AI/Gordon, kubectl-ai, Kagent) to optimize images, troubleshoot deployments, and analyze cluster health

**Independent Test**: Run Docker AI against Dockerfiles for optimization suggestions, use kubectl-ai for pod diagnostics, run Kagent for cluster health analysis

**Depends on**: Phase 4 (deployment running in Minikube)

### Implementation for User Story 5

- [ ] T028 [US5] Run Docker AI (Gordon) validation — use `docker ai` to analyze backend/Dockerfile and frontend/Dockerfile for optimization suggestions, review image sizes and layer efficiency
- [ ] T029 [P] [US5] Run kubectl-ai diagnostics — use kubectl-ai to demonstrate pod diagnostics, scaling commands, and failure investigation workflow against the running deployment
- [ ] T030 [P] [US5] Run Kagent cluster analysis — use Kagent for cluster health analysis and resource optimization suggestions against the Minikube cluster

**Checkpoint**: AI-assisted DevOps tools validated — optimization suggestions captured, diagnostic workflows documented

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation updates

- [ ] T031 Run full deployment flow end-to-end per specs/003-local-k8s-deployment/quickstart.md — verify all 5 commands work from clean state
- [ ] T032 Verify no secrets exposed in Docker image layers (`docker history`), Helm chart source, or ConfigMaps — only Kubernetes Secrets contain sensitive values
- [ ] T033 Validate all success criteria from spec.md SC-001 through SC-010 are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001, T002, T003) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 — creates Helm chart infrastructure
- **User Story 2 (Phase 4)**: Depends on Phase 2 + Phase 3 — requires Docker images and Helm chart
- **User Story 3 (Phase 5)**: Depends on Phase 4 — requires running deployment
- **User Story 4 (Phase 6)**: Depends on Phase 4 — requires running deployment (can run parallel with Phase 5)
- **User Story 5 (Phase 7)**: Depends on Phase 4 — requires running deployment (can run parallel with Phases 5/6)
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1) — Containerize**: Can start after Foundational phase. No dependencies on other stories.
- **US2 (P1) — Deploy to K8s**: Depends on US1 (needs Helm chart and Docker images). Sequential after US1.
- **US3 (P2) — Scaling**: Depends on US2 (needs running cluster). Independent of US4/US5.
- **US4 (P2) — Helm Values**: Depends on US2 (needs running cluster). Independent of US3/US5. Can run parallel with US3.
- **US5 (P3) — AI DevOps**: Depends on US2 (needs running cluster). Independent of US3/US4. Can run parallel with US3/US4.

### Within Each User Story

- Infrastructure templates (Deployments, Services) before deployment validation
- Core deployment before scaling/override testing
- All Helm templates marked [P] can be created in parallel (different files)

### Parallel Opportunities

- **Phase 1**: All 3 setup tasks (T001, T002 parallelizable; T003 independent)
- **Phase 2**: T004 and T005 can run in parallel (different directories)
- **Phase 3**: All Helm templates (T006-T017) can run in parallel — each is a different file
- **Phase 5-7**: User Stories 3, 4, and 5 can run in parallel once US2 deployment is running

---

## Parallel Example: Phase 3 (Helm Chart)

```bash
# Launch all Helm chart templates in parallel (all different files):
Task: "Create Chart.yaml in helm/todo-chatbot/Chart.yaml"
Task: "Create values.yaml in helm/todo-chatbot/values.yaml"
Task: "Create _helpers.tpl in helm/todo-chatbot/templates/_helpers.tpl"
Task: "Create namespace.yaml in helm/todo-chatbot/templates/namespace.yaml"
Task: "Create configmap.yaml in helm/todo-chatbot/templates/configmap.yaml"
Task: "Create secret.yaml in helm/todo-chatbot/templates/secret.yaml"
Task: "Create backend-deployment.yaml in helm/todo-chatbot/templates/backend-deployment.yaml"
Task: "Create backend-service.yaml in helm/todo-chatbot/templates/backend-service.yaml"
Task: "Create frontend-deployment.yaml in helm/todo-chatbot/templates/frontend-deployment.yaml"
Task: "Create frontend-service.yaml in helm/todo-chatbot/templates/frontend-service.yaml"
Task: "Create mcp-deployment.yaml in helm/todo-chatbot/templates/mcp-deployment.yaml"
Task: "Create mcp-service.yaml in helm/todo-chatbot/templates/mcp-service.yaml"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (.dockerignore, next.config.js)
2. Complete Phase 2: Foundational (Dockerfiles)
3. Complete Phase 3: Helm chart (US1)
4. Complete Phase 4: Deploy to Minikube (US2)
5. **STOP and VALIDATE**: Full application running in Kubernetes, accessible via browser
6. This is the MVP — a working local K8s deployment

### Incremental Delivery

1. Setup + Foundational → Docker images buildable
2. Add Helm Chart (US1) → `helm template` validates
3. Add Deployment (US2) → **MVP!** Application running in Minikube
4. Add Scaling (US3) → Horizontal scaling validated
5. Add Helm Values (US4) → Parameterized deployments
6. Add AI DevOps (US5) → Enhanced operator experience

### Suggested MVP Scope

- **Phase 1** (Setup): T001-T003
- **Phase 2** (Foundational): T004-T005
- **Phase 3** (US1 — Helm Chart): T006-T017
- **Phase 4** (US2 — Deploy): T018-T021
- Total MVP tasks: **21 tasks**
