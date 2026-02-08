"""MCP tools for task management operations."""

import json
from uuid import uuid4
from datetime import datetime

from mcp.server.fastmcp import FastMCP, Context
from mcp.types import TextContent
from mcp.server.fastmcp.exceptions import ToolError

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

# Import will be done relative to backend/ root
from app.models.task import Task


async def _get_db_session(ctx: Context) -> AsyncSession:
    """Get a database session from the MCP server's lifespan context."""
    session_maker = ctx.request_context.lifespan_context["db_session_maker"]
    return session_maker()


def register_task_tools(mcp: FastMCP) -> None:
    """Register all task management tools with the MCP server."""

    @mcp.tool()
    async def add_task(
        user_id: str,
        title: str,
        description: str = "",
        ctx: Context = None,
    ) -> str:
        """Add a new task for the user.

        Args:
            user_id: The ID of the user who owns the task
            title: The title of the task (required, max 200 characters)
            description: Optional description of the task
        """
        if not title or not title.strip():
            raise ToolError("Task title cannot be empty")

        if len(title) > 200:
            raise ToolError("Task title must be 200 characters or fewer")

        session = await _get_db_session(ctx)
        try:
            task = Task(
                id=str(uuid4()),
                user_id=user_id,
                title=title.strip(),
                description=description.strip() if description else None,
            )
            session.add(task)
            await session.commit()
            await session.refresh(task)

            return json.dumps({
                "success": True,
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "completed": task.completed,
                },
            })
        except Exception as e:
            await session.rollback()
            raise ToolError(f"Failed to create task: {str(e)}")
        finally:
            await session.close()

    @mcp.tool()
    async def list_tasks(
        user_id: str,
        filter: str = "all",
        ctx: Context = None,
    ) -> str:
        """List the user's tasks.

        Args:
            user_id: The ID of the user whose tasks to list
            filter: Filter by status - "all", "completed", or "incomplete"
        """
        session = await _get_db_session(ctx)
        try:
            query = select(Task).where(Task.user_id == user_id)

            if filter == "completed":
                query = query.where(Task.completed == True)  # noqa: E712
            elif filter == "incomplete":
                query = query.where(Task.completed == False)  # noqa: E712

            query = query.order_by(Task.created_at.desc())
            result = await session.execute(query)
            tasks = result.scalars().all()

            task_list = []
            for t in tasks:
                task_list.append({
                    "id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "completed": t.completed,
                })

            return json.dumps({
                "success": True,
                "count": len(task_list),
                "filter": filter,
                "tasks": task_list,
            })
        finally:
            await session.close()

    @mcp.tool()
    async def update_task(
        user_id: str,
        task_title: str,
        new_title: str = "",
        new_description: str = "",
        ctx: Context = None,
    ) -> str:
        """Update an existing task's title or description.

        Args:
            user_id: The ID of the user who owns the task
            task_title: The current title of the task to find and update
            new_title: The new title for the task (leave empty to keep current)
            new_description: The new description (leave empty to keep current)
        """
        session = await _get_db_session(ctx)
        try:
            # Find the task by title (case-insensitive match)
            result = await session.execute(
                select(Task).where(
                    Task.user_id == user_id,
                    Task.title.ilike(task_title.strip()),
                )
            )
            task = result.scalar_one_or_none()

            if not task:
                return json.dumps({
                    "success": False,
                    "error": f"Task with title '{task_title}' not found",
                })

            if new_title and new_title.strip():
                task.title = new_title.strip()
            if new_description is not None and new_description != "":
                task.description = new_description.strip() if new_description.strip() else None

            await session.commit()
            await session.refresh(task)

            return json.dumps({
                "success": True,
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "completed": task.completed,
                },
            })
        except Exception as e:
            await session.rollback()
            raise ToolError(f"Failed to update task: {str(e)}")
        finally:
            await session.close()

    @mcp.tool()
    async def complete_task(
        user_id: str,
        task_title: str,
        ctx: Context = None,
    ) -> str:
        """Mark a task as completed.

        Args:
            user_id: The ID of the user who owns the task
            task_title: The title of the task to mark as complete
        """
        session = await _get_db_session(ctx)
        try:
            result = await session.execute(
                select(Task).where(
                    Task.user_id == user_id,
                    Task.title.ilike(task_title.strip()),
                )
            )
            task = result.scalar_one_or_none()

            if not task:
                return json.dumps({
                    "success": False,
                    "error": f"Task with title '{task_title}' not found",
                })

            task.completed = True
            await session.commit()
            await session.refresh(task)

            return json.dumps({
                "success": True,
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "completed": task.completed,
                },
            })
        except Exception as e:
            await session.rollback()
            raise ToolError(f"Failed to complete task: {str(e)}")
        finally:
            await session.close()

    @mcp.tool()
    async def delete_task(
        user_id: str,
        task_title: str,
        ctx: Context = None,
    ) -> str:
        """Delete a task permanently.

        Args:
            user_id: The ID of the user who owns the task
            task_title: The title of the task to delete
        """
        session = await _get_db_session(ctx)
        try:
            result = await session.execute(
                select(Task).where(
                    Task.user_id == user_id,
                    Task.title.ilike(task_title.strip()),
                )
            )
            task = result.scalar_one_or_none()

            if not task:
                return json.dumps({
                    "success": False,
                    "error": f"Task with title '{task_title}' not found",
                })

            task_title_deleted = task.title
            await session.delete(task)
            await session.commit()

            return json.dumps({
                "success": True,
                "deleted_task": task_title_deleted,
            })
        except Exception as e:
            await session.rollback()
            raise ToolError(f"Failed to delete task: {str(e)}")
        finally:
            await session.close()
