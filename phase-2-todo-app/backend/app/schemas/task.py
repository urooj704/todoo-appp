"""Pydantic schemas for task validation and serialization."""

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class TaskCreate(BaseModel):
    """Schema for creating a new task."""

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Task title (required)",
        examples=["Buy groceries"],
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
        description="Optional task description",
        examples=["Milk, eggs, bread"],
    )


class TaskUpdate(BaseModel):
    """Schema for updating an existing task."""

    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
        description="Updated task title",
        examples=["Buy groceries and snacks"],
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
        description="Updated task description",
        examples=["Milk, eggs, bread, chips"],
    )


class Task(BaseModel):
    """Schema for task responses."""

    model_config = ConfigDict(from_attributes=True)

    id: str = Field(
        ...,
        description="Unique task identifier",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )
    title: str = Field(
        ...,
        description="Task title",
        examples=["Buy groceries"],
    )
    description: str | None = Field(
        default=None,
        description="Optional task description",
        examples=["Milk, eggs, bread"],
    )
    completed: bool = Field(
        ...,
        description="Whether task is completed",
        examples=[False],
    )
    created_at: datetime = Field(
        ...,
        description="Task creation timestamp",
    )
    updated_at: datetime = Field(
        ...,
        description="Last update timestamp",
    )


class ErrorResponse(BaseModel):
    """Schema for error responses."""

    error: str = Field(
        ...,
        description="Error message",
        examples=["Task not found"],
    )
    detail: str | None = Field(
        default=None,
        description="Additional error details",
        examples=["No task with ID 550e8400-e29b-41d4-a716-446655440000"],
    )
