"""Chat and conversation endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_user_id
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationSummary,
    ConversationDetail,
    MessageResponse,
)
from app.schemas.task import ErrorResponse
from app.services.chat_service import process_chat_message, ChatServiceError
from app.services.conversation_service import (
    list_user_conversations,
    get_conversation,
    load_conversation_history,
)

router = APIRouter(
    tags=["Chat"],
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
    },
)


@router.post(
    "/{user_id}/chat",
    response_model=ChatResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        403: {"model": ErrorResponse, "description": "Forbidden"},
        502: {"model": ErrorResponse, "description": "AI service unavailable"},
    },
)
async def send_chat_message(
    user_id: str,
    request: ChatRequest,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Send a message to the AI chatbot and receive a response.

    Creates a new conversation if no conversation_id is provided,
    or continues an existing conversation.
    """
    # Verify the authenticated user matches the path user_id
    if current_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this resource",
        )

    try:
        return await process_chat_message(
            db=db,
            user_id=user_id,
            message=request.message,
            conversation_id=request.conversation_id,
        )
    except ChatServiceError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
        )


@router.get(
    "/{user_id}/conversations",
    response_model=list[ConversationSummary],
    responses={
        403: {"model": ErrorResponse, "description": "Forbidden"},
    },
)
async def list_conversations(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> list[ConversationSummary]:
    """List all conversations for the authenticated user."""
    if current_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this resource",
        )

    conversations = await list_user_conversations(db, user_id)
    return [
        ConversationSummary(
            id=c.id,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in conversations
    ]


@router.get(
    "/{user_id}/conversations/{conversation_id}",
    response_model=ConversationDetail,
    responses={
        403: {"model": ErrorResponse, "description": "Forbidden"},
        404: {"model": ErrorResponse, "description": "Not found"},
    },
)
async def get_conversation_detail(
    user_id: str,
    conversation_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> ConversationDetail:
    """Get a conversation with its full message history."""
    if current_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this resource",
        )

    conversation = await get_conversation(db, conversation_id, user_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    messages = await load_conversation_history(
        db, conversation_id, user_id, limit=1000
    )

    return ConversationDetail(
        id=conversation.id,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )
