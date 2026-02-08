"""Chat service orchestrating conversation flow with the AI agent."""

from agents import Runner, ItemHelpers

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.services.agent import create_agent
from app.services.conversation_service import (
    create_conversation,
    get_conversation,
    store_message,
    load_conversation_history,
)
from app.schemas.chat import ChatResponse, ToolCallInfo


class ChatServiceError(Exception):
    """Raised when the chat service encounters an error."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def process_chat_message(
    db: AsyncSession,
    user_id: str,
    message: str,
    conversation_id: str | None = None,
) -> ChatResponse:
    """Process a user chat message and return an AI response.

    1. Load or create conversation
    2. Load bounded history
    3. Run agent with history + new message
    4. Persist user and assistant messages
    5. Return response
    """
    settings = get_settings()

    # Load or create conversation
    if conversation_id:
        conversation = await get_conversation(db, conversation_id, user_id)
        if not conversation:
            raise ChatServiceError(
                "Conversation not found or access denied", status_code=403
            )
    else:
        conversation = await create_conversation(db, user_id)

    # Load bounded conversation history
    history_messages = await load_conversation_history(
        db, conversation.id, user_id, limit=settings.max_conversation_history
    )

    # Build input for the agent: history + new user message
    agent_input = []
    for msg in history_messages:
        agent_input.append({
            "role": msg.role,
            "content": msg.content,
        })
    agent_input.append({
        "role": "user",
        "content": message,
    })

    # Run the agent
    agent, mcp_server = create_agent(user_id)
    try:
        async with mcp_server:
            result = await Runner.run(agent, input=agent_input)
    except Exception as e:
        raise ChatServiceError(
            "The AI service is temporarily unavailable. Please try again in a moment.",
            status_code=502,
        ) from e

    # Extract final response text
    response_text = result.final_output or "I'm sorry, I wasn't able to generate a response."

    # Extract tool calls from result
    tool_calls = []
    for item in result.new_items:
        if hasattr(item, "type") and item.type == "tool_call_item":
            tool_name = getattr(item, "name", None) or "unknown"
            tool_result_text = None
            if hasattr(item, "output"):
                tool_result_text = str(item.output)[:200]
            tool_calls.append(ToolCallInfo(name=tool_name, result=tool_result_text))

    # Persist user message
    await store_message(db, conversation.id, user_id, "user", message)

    # Persist assistant response
    await store_message(db, conversation.id, user_id, "assistant", response_text)

    return ChatResponse(
        conversation_id=conversation.id,
        response=response_text,
        tool_calls=tool_calls,
    )
