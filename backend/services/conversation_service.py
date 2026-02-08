"""Conversation and message persistence service."""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message


async def create_conversation(db: AsyncSession, user_id: str) -> Conversation:
    """Create a new conversation for the user."""
    conversation = Conversation(
        id=str(uuid4()),
        user_id=user_id,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def get_conversation(
    db: AsyncSession, conversation_id: str, user_id: str
) -> Conversation | None:
    """Get a conversation with ownership check."""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def list_user_conversations(
    db: AsyncSession, user_id: str
) -> list[Conversation]:
    """List all conversations for a user, ordered by most recent."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())


async def store_message(
    db: AsyncSession,
    conversation_id: str,
    user_id: str,
    role: str,
    content: str,
) -> Message:
    """Store a message in a conversation."""
    message = Message(
        id=str(uuid4()),
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        content=content,
    )
    db.add(message)

    # Update conversation's updated_at timestamp
    await db.execute(
        update(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        .values(updated_at=datetime.utcnow())
    )

    await db.commit()
    await db.refresh(message)
    return message


async def load_conversation_history(
    db: AsyncSession,
    conversation_id: str,
    user_id: str,
    limit: int = 50,
) -> list[Message]:
    """Load recent conversation history in chronological order.

    Loads the most recent `limit` messages, then reverses to chronological order.
    """
    result = await db.execute(
        select(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.user_id == user_id,
        )
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    messages = list(result.scalars().all())
    messages.reverse()  # Restore chronological order
    return messages
