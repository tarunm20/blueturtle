# app/db/chat_repository.py
import logging
from app.db.connection import get_connection, get_dict_cursor
from app.models.chat import Message, Conversation

logger = logging.getLogger(__name__)

def create_conversation(user_id: str, title: str = None) -> int:
    """Create a new conversation and return its ID"""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO conversations (user_id, title) 
                VALUES (%s, %s)
                RETURNING id
                """,
                (user_id, title)
            )
            return cur.fetchone()[0]

def add_message(conversation_id: int, role: str, content: str, sql: str = None) -> int:
    """Add a message to a conversation and return its ID"""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO messages (conversation_id, role, content, sql) 
                VALUES (%s, %s, %s, %s)
                RETURNING id
                """,
                (conversation_id, role, content, sql)
            )
            message_id = cur.fetchone()[0]
            
            # Update conversation's updated_at timestamp
            cur.execute(
                """
                UPDATE conversations
                SET updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (conversation_id,)
            )
            conn.commit()
            
            return message_id

def get_messages(conversation_id: int) -> list:
    """Get all messages for a conversation"""
    with get_dict_cursor() as cur:
        cur.execute(
            """
            SELECT id, role, content, sql, created_at 
            FROM messages 
            WHERE conversation_id = %s
            ORDER BY created_at ASC
            """,
            (conversation_id,)
        )
        return cur.fetchall()

def get_user_conversations(user_id: str) -> list:
    """Get all conversations for a user"""
    with get_dict_cursor() as cur:
        cur.execute(
            """
            SELECT id, title, created_at, updated_at
            FROM conversations
            WHERE user_id = %s
            ORDER BY updated_at DESC
            """,
            (user_id,)
        )
        return cur.fetchall()

def get_conversation(conversation_id: int) -> dict:
    """Get conversation details including messages"""
    with get_dict_cursor() as cur:
        # Get conversation details
        cur.execute(
            """
            SELECT id, user_id, title, created_at, updated_at
            FROM conversations
            WHERE id = %s
            """,
            (conversation_id,)
        )
        conversation = cur.fetchone()
        
        if not conversation:
            return None
    
    # Get messages for the conversation
    conversation["messages"] = get_messages(conversation_id)
    return conversation

def delete_conversation(conversation_id: int) -> bool:
    """Delete a conversation"""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM conversations
                WHERE id = %s
                RETURNING id
                """,
                (conversation_id,)
            )
            result = cur.fetchone()
            conn.commit()
            return result is not None