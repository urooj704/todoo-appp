# Quickstart: Phase II Todo Web App

**Branch**: `001-phase-ii-todo-app`
**Date**: 2026-02-05

## Prerequisites

- Node.js 18+ (frontend)
- Python 3.11+ (backend)
- Neon PostgreSQL account
- Git

## Environment Setup

### 1. Clone and checkout branch

```bash
git clone <repository-url>
cd todoo-app
git checkout 001-phase-ii-todo-app
```

### 2. Configure environment variables

**Backend** (`backend/.env`):

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-min-32-characters
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
BETTER_AUTH_SECRET=your-secret-key-min-32-characters
BETTER_AUTH_URL=http://localhost:3000
```

> **Important**: Use the same `BETTER_AUTH_SECRET` in both frontend and backend.

### 3. Database setup

```bash
# Apply migrations (from backend directory)
cd backend
python -m alembic upgrade head
```

### 4. Install dependencies

**Backend**:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend**:

```bash
cd frontend
npm install
```

## Running the Application

### Start backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Start frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: http://localhost:3000

## Verification Steps

### 1. Health check

```bash
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

### 2. Create account

1. Open http://localhost:3000
2. Click "Sign Up"
3. Enter email and password
4. Verify redirect to task list

### 3. Create task

1. On task list page, enter "Test task" in title field
2. Click "Add Task"
3. Verify task appears in list

### 4. Complete task

1. Click checkbox next to task
2. Verify task shows completed state

### 5. Delete task

1. Click delete button on task
2. Verify task is removed from list

### 6. Test isolation

1. Sign out
2. Create new account with different email
3. Verify no tasks visible (previous user's tasks not shown)

## API Quick Reference

All endpoints require JWT in Authorization header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | List your tasks |
| POST | /api/tasks | Create task |
| GET | /api/tasks/{id} | Get task |
| PUT | /api/tasks/{id} | Update task |
| DELETE | /api/tasks/{id} | Delete task |
| PATCH | /api/tasks/{id}/complete | Toggle completion |

## Troubleshooting

### "Unauthorized" on API calls

- Check JWT is being attached to requests
- Verify BETTER_AUTH_SECRET matches in frontend and backend
- Check token hasn't expired

### Database connection errors

- Verify DATABASE_URL is correct
- Check Neon database is accessible
- Ensure SSL mode is enabled (`?sslmode=require`)

### CORS errors

- Verify CORS_ORIGINS includes frontend URL
- Check frontend is running on expected port

### Tasks not persisting

- Check database connection
- Verify migrations have been applied
- Check backend logs for errors

## Project Structure

```text
todoo-app/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── routers/tasks.py # Task endpoints
│   │   └── auth/            # JWT verification
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # React components
│   │   └── lib/             # API client, auth
│   └── package.json
└── specs/
    └── 001-phase-ii-todo-app/
        ├── spec.md
        ├── plan.md
        ├── research.md
        ├── data-model.md
        ├── quickstart.md    # This file
        └── contracts/
            └── api.yaml
```

## Next Steps

After basic verification:

1. Run full test suite: `pytest` (backend), `npm test` (frontend)
2. Review API documentation at http://localhost:8000/docs
3. Check mobile responsiveness at various screen sizes
