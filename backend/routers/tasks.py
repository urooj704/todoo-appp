"""Task CRUD endpoints."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.task import Task as TaskModel
from app.schemas.task import Task, TaskCreate, TaskUpdate, ErrorResponse
from app.auth.dependencies import get_current_user_id

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
    },
)


@router.get("", response_model=list[Task])
async def list_tasks(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> list[Task]:
    """List all tasks for the authenticated user."""
    result = await db.execute(
        select(TaskModel)
        .where(TaskModel.user_id == user_id)
        .order_by(TaskModel.created_at.desc())
    )
    tasks = result.scalars().all()
    return [Task.model_validate(task) for task in tasks]


@router.post("", response_model=Task, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Task:
    """Create a new task for the authenticated user."""
    task = TaskModel(
        user_id=user_id,
        title=task_data.title.strip(),
        description=task_data.description.strip() if task_data.description else None,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return Task.model_validate(task)


@router.get(
    "/{task_id}",
    response_model=Task,
    responses={
        403: {"model": ErrorResponse, "description": "Forbidden"},
        404: {"model": ErrorResponse, "description": "Not found"},
    },
)
async def get_task(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Task:
    """Get a specific task with ownership check."""
    result = await db.execute(
        select(TaskModel).where(TaskModel.id == str(task_id))
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task",
        )

    return Task.model_validate(task)


@router.put(
    "/{task_id}",
    response_model=Task,
    responses={
        403: {"model": ErrorResponse, "description": "Forbidden"},
        404: {"model": ErrorResponse, "description": "Not found"},
    },
)
async def update_task(
    task_id: UUID,
    task_data: TaskUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Task:
    """Update a task with ownership check."""
    result = await db.execute(
        select(TaskModel).where(TaskModel.id == str(task_id))
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task",
        )

    # Update fields if provided
    if task_data.title is not None:
        task.title = task_data.title.strip()
    if task_data.description is not None:
        task.description = task_data.description.strip() if task_data.description else None

    await db.commit()
    await db.refresh(task)
    return Task.model_validate(task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        403: {"model": ErrorResponse, "description": "Forbidden"},
        404: {"model": ErrorResponse, "description": "Not found"},
    },
)
async def delete_task(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a task with ownership check."""
    result = await db.execute(
        select(TaskModel).where(TaskModel.id == str(task_id))
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task",
        )

    await db.delete(task)
    await db.commit()


@router.patch(
    "/{task_id}/complete",
    response_model=Task,
    responses={
        403: {"model": ErrorResponse, "description": "Forbidden"},
        404: {"model": ErrorResponse, "description": "Not found"},
    },
)
async def toggle_task_complete(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> Task:
    """Toggle task completion status with ownership check."""
    result = await db.execute(
        select(TaskModel).where(TaskModel.id == str(task_id))
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task",
        )

    task.completed = not task.completed
    await db.commit()
    await db.refresh(task)
    return Task.model_validate(task)
