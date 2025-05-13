// frontend/apps/web/app/home/ChatSessionManager.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { ChatInterface } from './ChatInterface';
import { DatabaseType, ModelType } from './types';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSessionManagerProps {
  dbConfig: {
    db_type: DatabaseType;
    db_host?: string;
    db_port?: string;
    db_name: string;
    db_user?: string;
    db_password?: string;
  };
  llmConfig: {
    provider: ModelType;
    model?: string;
    url?: string;
    apiKey?: string;
  };
}

export function ChatSessionManager({ dbConfig, llmConfig }: ChatSessionManagerProps) {
  const supabase = useSupabase();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load chat sessions from Supabase
  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }
      
      setSessions(
        (sessions || []).map(session => ({
          ...session,
          created_at: session.created_at || '',
        }))
      );
      
      // Set active session to the first one if we have sessions
      if (sessions?.length > 0 && !activeSessionId) {
        setActiveSessionId(sessions[0]?.id || '');
      }
    } catch (err) {
      console.error('Error in loadSessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Create a new chat session
  const createSession = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Error fetching user:', authError);
        return;
      }
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const newSession = {
        title: `New Chat ${(sessions?.length || 0) + 1}`,
        user_id: user.id,
      };
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert(newSession)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating session:', error);
        return;
      }
      
      if (data) {
        setSessions(prev => [
          { ...data, created_at: data.created_at || '' },
          ...(prev || []),
        ]);
        setActiveSessionId(data.id);
      }
    } catch (err) {
      console.error('Error in createSession:', err);
    }
  };

  // Delete session implementation
  const handleDeleteSession = async (id: string) => {
    if (isDeleting) return; // Prevent multiple clicks
    
    console.log('Delete requested for session:', id);
    setIsDeleting(true);
    
    try {
      // Optimistic UI update
      const updatedSessions = sessions.filter(s => s.id !== id);
      setSessions(updatedSessions);
      
      // Update active session if needed
      if (id === activeSessionId) {
        if (updatedSessions.length > 0 && updatedSessions[0]?.id) {
          setActiveSessionId(updatedSessions[0].id);
        } else {
          setActiveSessionId('');
        }
      }
      
      // Execute database operations
      try {
        // 1. First get messages associated with this session
        console.log('Fetching messages for session:', id);
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('session_id', id);
          
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          throw messagesError;
        }
        
        console.log(`Found ${messages?.length || 0} messages`);
        
        // 2. Delete query results for these messages
        if (messages && messages.length > 0) {
          const messageIds = messages.map(m => m.id);
          
          for (const messageId of messageIds) {
            console.log(`Deleting query results for message: ${messageId}`);
            const { error: resultsError } = await supabase
              .from('query_results')
              .delete()
              .eq('message_id', messageId);
              
            if (resultsError) {
              console.error(`Error deleting results for message ${messageId}:`, resultsError);
              // Continue with other messages even if one fails
            }
          }
          
          // 3. Delete all messages for this session
          console.log('Deleting all messages for session:', id);
          const { error: messagesDeleteError } = await supabase
            .from('chat_messages')
            .delete()
            .eq('session_id', id);
            
          if (messagesDeleteError) {
            console.error('Error deleting messages:', messagesDeleteError);
            throw messagesDeleteError;
          }
        }
        
        // 4. Finally delete the session
        console.log('Deleting session:', id);
        const { error: sessionDeleteError } = await supabase
          .from('chat_sessions')
          .delete()
          .eq('id', id);
          
        if (sessionDeleteError) {
          console.error('Error deleting session:', sessionDeleteError);
          throw sessionDeleteError;
        }
        
        console.log('Session deletion complete');
        
        // Create a new session if we deleted the last one
        if (updatedSessions.length === 0) {
          await createSession();
        }
        
      } catch (dbError) {
        console.error('Database error during deletion:', dbError);
        // Refresh sessions to ensure UI is consistent with database
        await loadSessions();
      }
      
    } catch (err) {
      console.error('Error in handleDeleteSession:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Create a session if none exist
  useEffect(() => {
    if (!isLoading && sessions?.length === 0) {
      createSession();
    }
  }, [isLoading, sessions?.length]);

  return (
    <div className="flex h-full border rounded-md">
      {/* Sidebar */}
      <div className="w-60 border-r p-4">
        <Button 
          variant="outline" 
          className="w-full mb-4"
          onClick={createSession}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        
        <div className="space-y-1 overflow-y-auto">
          {isLoading ? (
            <div className="text-sm text-muted-foreground p-2 text-center">
              Loading sessions...
            </div>
          ) : (
            (sessions || []).map(session => (
              <div 
                key={session?.id || 'unknown'}
                className={`p-2 rounded cursor-pointer flex justify-between items-center group ${
                  session?.id === activeSessionId ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
                onClick={() => setActiveSessionId(session?.id || '')}
              >
                <div className="truncate">{session?.title || 'Untitled'}</div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteSession(session?.id || '');
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={sessions?.length <= 1 || isDeleting}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1">
        {activeSessionId ? (
          <ChatInterface 
            sessionId={activeSessionId} 
            dbConfig={dbConfig}
            llmConfig={llmConfig}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            {isLoading ? 'Loading...' : 'Select or create a chat session'}
          </div>
        )}
      </div>
    </div>
  );
}