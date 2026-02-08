"""Pydantic schemas for chat endpoints."""

from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    """Schema for incoming chat messages."""

    message: str = Field(
        ...,
        min_length=1,
        description="The user's message text",
        examples=["Add a task called buy groceries"],
    )
    conversation_id: str | None = Field(
        default=None,
        description="Existing conversation ID to continue, or null to start new",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be empty or whitespace only")
        return v.strip()


class ToolCallInfo(BaseModel):
    """Schema for tool call information in the response."""

    name: str = Field(..., description="Tool name that was invoked")
    result: str | None = Field(default=None, description="Tool result summary")


class ChatResponse(BaseModel):
    """Schema for chat endpoint responses."""

    conversation_id: str = Field(
        ...,
        description="The conversation ID (new or existing)",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )
    response: str = Field(
        ...,
        description="The assistant's response text",
        examples=["I've created a task called 'buy groceries' for you."],
    )
    tool_calls: list[ToolCallInfo] = Field(
        default_factory=list,
        description="List of tool calls invoked during this exchange",
    )


class MessageResponse(BaseModel):
    """Schema for individual message in conversation history."""

    id: str
    role: str
    content: str
    created_at: datetime


class ConversationSummary(BaseModel):
    """Schema for conversation list items."""

    id: str
    created_at: datetime
    updated_at: datetime


class ConversationDetail(BaseModel):
    """Schema for full conversation with messages."""

    id: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse]
