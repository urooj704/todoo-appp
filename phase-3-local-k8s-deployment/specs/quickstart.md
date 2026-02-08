# Quickstart: Local Kubernetes Deployment

## Prerequisites

Ensure the following tools are installed:
- Docker Desktop (or Docker Engine)
- Minikube (`minikube version` >= 1.30)
- kubectl (`kubectl version --client` >= 1.28)
- Helm (`helm version` >= 3.12)

## Quick Deploy (5 commands)

```bash
# 1. Start Minikube
minikube start --cpus=2 --memory=4096

# 2. Get Minikube IP
export MINIKUBE_IP=$(minikube ip)

# 3. Build & load images
docker build -t todo-backend:phase4 backend/
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://${MINIKUBE_IP}:30081/api \
  --build-arg NEXT_PUBLIC_APP_URL=http://${MINIKUBE_IP}:30080 \
  -t todo-frontend:phase4 frontend/
minikube image load todo-backend:phase4
minikube image load todo-frontend:phase4

# 4. Deploy with Helm (replace <PLACEHOLDERS> with real values)
helm install todo-chatbot helm/todo-chatbot \
  --namespace todo-local --create-namespace \
  --set secrets.databaseUrl="<DATABASE_URL>" \
  --set secrets.betterAuthSecret="<AUTH_SECRET>" \
  --set secrets.openaiApiKey="<OPENAI_KEY>" \
  --set secrets.chatkitWorkflowId="<CHATKIT_ID>" \
  --set frontend.env.NEXT_PUBLIC_API_URL="http://${MINIKUBE_IP}:30081/api" \
  --set frontend.env.NEXT_PUBLIC_APP_URL="http://${MINIKUBE_IP}:30080" \
  --set backend.env.CORS_ORIGINS="http://${MINIKUBE_IP}:30080" \
  --set backend.env.BETTER_AUTH_URL="http://${MINIKUBE_IP}:30080"

# 5. Verify
kubectl get pods -n todo-local
```

## Access the Application

- **Frontend**: `http://<MINIKUBE_IP>:30080`
- **Backend API**: `http://<MINIKUBE_IP>:30081/health`

## Scaling

```bash
kubectl scale deployment todo-frontend --replicas=3 -n todo-local
```

## Teardown

```bash
helm uninstall todo-chatbot -n todo-local
minikube stop
```
