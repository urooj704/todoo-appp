# Deployment Flow Contract

## Prerequisites

| Tool | Minimum Version | Verification Command |
|------|----------------|---------------------|
| Docker | 20.x+ | `docker --version` |
| Minikube | 1.30+ | `minikube version` |
| kubectl | 1.28+ | `kubectl version --client` |
| Helm | 3.12+ | `helm version` |

## Step-by-Step Deployment Flow

### Step 1: Start Minikube
```bash
minikube start --cpus=2 --memory=4096
```
**Success**: `minikube status` shows Running

### Step 2: Get Minikube IP
```bash
MINIKUBE_IP=$(minikube ip)
```

### Step 3: Build Docker Images
```bash
# Backend (used for both API and MCP server)
docker build -t todo-backend:phase4 backend/

# Frontend (requires Minikube IP for API URL)
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://${MINIKUBE_IP}:30081/api \
  --build-arg NEXT_PUBLIC_APP_URL=http://${MINIKUBE_IP}:30080 \
  -t todo-frontend:phase4 \
  frontend/
```
**Success**: `docker images | grep todo-` shows both images

### Step 4: Load Images into Minikube
```bash
minikube image load todo-backend:phase4
minikube image load todo-frontend:phase4
```
**Success**: `minikube image ls | grep todo-` shows both images

### Step 5: Deploy with Helm
```bash
helm install todo-chatbot helm/todo-chatbot \
  --namespace todo-local \
  --create-namespace \
  --set secrets.databaseUrl="<YOUR_DATABASE_URL>" \
  --set secrets.betterAuthSecret="<YOUR_AUTH_SECRET>" \
  --set secrets.openaiApiKey="<YOUR_OPENAI_KEY>" \
  --set secrets.chatkitWorkflowId="<YOUR_CHATKIT_ID>" \
  --set frontend.env.NEXT_PUBLIC_API_URL="http://${MINIKUBE_IP}:30081/api" \
  --set frontend.env.NEXT_PUBLIC_APP_URL="http://${MINIKUBE_IP}:30080" \
  --set backend.env.CORS_ORIGINS="http://${MINIKUBE_IP}:30080" \
  --set backend.env.BETTER_AUTH_URL="http://${MINIKUBE_IP}:30080"
```
**Success**: `helm status todo-chatbot -n todo-local` shows deployed

### Step 6: Verify Pods
```bash
kubectl get pods -n todo-local
```
**Success**: All pods show `Running` status, `READY 1/1`

### Step 7: Test Services
```bash
# Frontend
curl -s http://${MINIKUBE_IP}:30080 | head -20

# Backend health check
curl -s http://${MINIKUBE_IP}:30081/health
```
**Success**: Frontend returns HTML, backend returns `{"status":"ok"}`

### Step 8: Scale Frontend
```bash
kubectl scale deployment todo-frontend --replicas=3 -n todo-local
kubectl get pods -n todo-local -l app=todo-frontend
```
**Success**: 3 frontend pods in Running state

### Step 9: Validate Scaling
```bash
kubectl get pods -n todo-local -l app=todo-frontend --field-selector=status.phase=Running | wc -l
```
**Success**: Returns 4 (header + 3 pods)

## Teardown
```bash
helm uninstall todo-chatbot -n todo-local
kubectl delete namespace todo-local
minikube stop
```

## Reproducibility Test
```bash
# After teardown, re-run Steps 5-7
# Should produce identical working state
```
