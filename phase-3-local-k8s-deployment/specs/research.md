# Research: Local Kubernetes Deployment (Phase IV)

**Feature**: 003-local-k8s-deployment
**Date**: 2026-02-07
**Status**: Complete

---

## R1. Frontend Dockerfile Strategy

**Decision**: Multi-stage build with Node 20 Alpine for build stage, Node 20 Alpine for runner stage, using Next.js standalone output mode.

**Rationale**: Next.js standalone output mode (`output: 'standalone'` in `next.config.js`) produces a self-contained server with only necessary dependencies, reducing image size from ~1GB to ~100-200MB. Alpine images are the smallest available Node base. The standalone server includes a built-in HTTP server, eliminating the need for a separate Node installation in the runner.

**Alternatives considered**:
- **Debian-slim runner**: Larger image (~300MB vs ~150MB), but more compatible with native modules. Rejected because the frontend has no native dependencies.
- **Nginx serving static export**: Requires `next export` which doesn't support API routes or server-side rendering. Rejected since the app uses Next.js app router features.
- **Non-standalone build**: Requires copying entire `node_modules` (~500MB+) into the image. Rejected for size.

---

## R2. Backend Dockerfile Strategy

**Decision**: Use `python:3.11-slim` as base image with pip install from `requirements.txt`. Run uvicorn as the production ASGI server.

**Rationale**: `python:3.11-slim` is based on Debian slim (~150MB) and supports all Python packages without compilation issues. The backend uses `asyncpg` which requires compiled C extensions that are problematic on Alpine. Uvicorn with `--host 0.0.0.0 --port 8000` is the standard production server for FastAPI.

**Alternatives considered**:
- **python:3.11-alpine**: Smaller base (~50MB) but requires building C extensions from source for `asyncpg`, `cryptography`, and other packages — significantly increases build time and final image size. Rejected.
- **Gunicorn + Uvicorn workers**: Adds process management complexity. For a local K8s deployment with 1 replica, single-worker uvicorn is sufficient. Kubernetes handles scaling via replica count. Rejected for unnecessary complexity.

---

## R3. MCP Server Deployment Strategy

**Decision**: Deploy the MCP server as a separate Kubernetes Deployment with its own ClusterIP Service, accessible at `http://todo-mcp:8001` within the cluster.

**Rationale**: The backend agent connects to the MCP server via HTTP (`MCP_SERVER_URL` setting, default `http://localhost:8001/mcp`). In Kubernetes, each pod has its own network namespace, so `localhost` won't work between containers in different pods. A separate Deployment with a ClusterIP Service provides:
1. Independent scaling (MCP server can scale separately from the API)
2. Independent lifecycle management (restart MCP without affecting API)
3. Clean service discovery via Kubernetes DNS (`todo-mcp.todo-local.svc.cluster.local`)

The MCP server shares the same codebase as the backend (it imports from `app` and `mcp_server` packages), so it uses the same Docker image (`todo-backend:phase4`) with a different entrypoint command (`python -m mcp_server.run`).

**Alternatives considered**:
- **Sidecar container in backend pod**: Simpler networking (localhost works) but couples MCP lifecycle to backend, prevents independent scaling, and complicates health checks. Rejected.
- **Same container with process supervisor**: Running both uvicorn and MCP server in one container using supervisord violates the "one process per container" principle and makes logging/monitoring harder. Rejected.

---

## R4. Minikube Image Loading Strategy

**Decision**: Use `minikube image load <image>` to load locally-built Docker images into Minikube's container runtime.

**Rationale**: This is the simplest approach that works regardless of Minikube's configured driver (Docker, VirtualBox, Hyperkit). It copies the image from the host Docker daemon into Minikube's internal image store. Combined with `imagePullPolicy: Never` in Kubernetes manifests, this prevents Kubernetes from attempting to pull from a remote registry.

**Alternatives considered**:
- **`eval $(minikube docker-env)`**: Configures the current shell to use Minikube's Docker daemon, allowing direct builds inside Minikube. Requires all builds to happen in the same shell session, which is error-prone and doesn't work across terminals. Rejected for complexity.
- **Local registry**: Running a Docker registry inside Minikube and pushing images to it. Significantly more infrastructure overhead for a local dev setup. Rejected.

---

## R5. Helm Chart Structure

**Decision**: Single Helm chart named `todo-chatbot` at `helm/todo-chatbot/` with sub-templates for each service (frontend, backend, mcp-server). All services share a single `values.yaml`.

**Rationale**: A single chart simplifies deployment to a single `helm install` command, matching FR-012. Sub-templates organize resources cleanly while keeping all configuration in one `values.yaml`. The `_helpers.tpl` file provides reusable template functions for labels, selectors, and names.

**Chart structure**:
```
helm/todo-chatbot/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── namespace.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── mcp-deployment.yaml
│   ├── mcp-service.yaml
│   ├── configmap.yaml
│   └── secret.yaml
```

**Alternatives considered**:
- **Separate charts per service (umbrella chart)**: Adds complexity with Chart dependencies, subcharts, and inter-chart values passing. Overkill for 3 services in a local deployment. Rejected.
- **Kustomize instead of Helm**: Doesn't support parameterized values natively (uses overlays/patches). Less flexible for the one-command deployment requirement. Rejected.

---

## R6. Kubernetes Resource Limits

**Decision**: Conservative resource limits appropriate for local development on Minikube.

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| Frontend | 100m | 500m | 128Mi | 512Mi |
| Backend | 100m | 500m | 128Mi | 512Mi |
| MCP Server | 50m | 250m | 64Mi | 256Mi |

**Rationale**: These values are tuned for local development where Minikube typically has 2-4 CPUs and 4-8GB RAM. Requests are low to ensure pods can be scheduled even on resource-constrained machines. Limits are generous enough to handle normal operation without OOMKills or CPU throttling. The MCP server has lower limits since it handles less traffic.

**Alternatives considered**:
- **Higher limits (1 CPU, 1Gi)**: Would consume too much of a typical Minikube cluster's resources, preventing scaling tests (3 replicas would need 3 CPUs). Rejected.
- **No requests, only limits**: Kubernetes scheduling works poorly without requests — pods may be scheduled on nodes that can't support them. Rejected.

---

## R7. Frontend-to-Backend Communication in Kubernetes

**Decision**: The frontend browser cannot access backend via ClusterIP. Use two NodePort services: frontend on a NodePort for browser access, backend also on a NodePort so the browser can reach the API. Set `NEXT_PUBLIC_API_URL` to the Minikube backend NodePort URL.

**Rationale**: The Next.js frontend runs in the browser (client-side), not on the server. When the browser makes API calls via `fetch()`, it needs a URL reachable from the host machine, not a Kubernetes-internal ClusterIP. Both services need NodePort exposure:
- Frontend NodePort: for the user to load the web app
- Backend NodePort: for the browser's JavaScript to call the API

The `NEXT_PUBLIC_API_URL` environment variable must be set to the Minikube IP + backend NodePort at build time (or injected at runtime).

**Alternatives considered**:
- **Ingress controller**: Could route `/api/*` to backend and `/*` to frontend on a single host. Cleaner but requires an ingress controller (nginx-ingress addon), adding complexity. Documented as optional enhancement in the Helm chart.
- **Backend ClusterIP only**: The browser cannot reach ClusterIP addresses. Would break all API calls. Rejected.

---

## R8. Secrets Management in Helm

**Decision**: Secrets are defined in `values.yaml` with placeholder defaults. Actual values are passed via `--set` flags during `helm install` or via a local `values-secrets.yaml` file (gitignored).

**Rationale**: This approach:
1. Keeps secrets out of version control (placeholder values in committed `values.yaml`)
2. Allows easy override per environment via `--set` or `-f values-secrets.yaml`
3. Kubernetes Secrets are created from Helm values, base64-encoded automatically
4. The `.gitignore` entry for `values-secrets.yaml` prevents accidental commits

**Alternatives considered**:
- **External secrets operator**: Enterprise-grade solution using Vault or cloud KMS. Overkill for local Minikube deployment. Rejected.
- **kubectl create secret manually**: Breaks the one-command deployment requirement (FR-012). Rejected.
- **Sealed Secrets**: Requires a controller running in the cluster. Unnecessary for local dev. Rejected.
