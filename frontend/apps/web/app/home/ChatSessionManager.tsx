// frontend/apps/web/app/home/ChatSessionManager.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { PlusCircle } from 'lucide-react';
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

  // Load chat sessions from Supabase
  useEffect(() => {
    async function loadSessions() {
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
        if (sessions?.length > 0) {
          setActiveSessionId(sessions[0]?.id || '');
        }
      } catch (err) {
        console.error('Error in loadSessions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSessions();
  }, [supabase]);

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

  // Delete a session
  const deleteSession = async (id: string) => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting session:', error);
        return;
      }
      
      // Update local state
      const updatedSessions = sessions?.filter(session => session?.id !== id) || [];
      setSessions(updatedSessions);
      
      // If we deleted the active session, select another one
      if (id === activeSessionId && updatedSessions.length > 0) {
        setActiveSessionId(updatedSessions[0]?.id || '');
      } else if (updatedSessions.length === 0) {
        // Create a new session if we deleted the last one
        createSession();
      }
    } catch (err) {
      console.error('Error in deleteSession:', err);
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
                className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                  session?.id === activeSessionId ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
                onClick={() => setActiveSessionId(session?.id || '')}
              >
                <div className="truncate">{session?.title || 'Untitled'}</div>
                
                {sessions?.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e?.stopPropagation?.();
                      deleteSession(session?.id || '');
                    }}
                  >
                    ✕
                  </Button>
                )}
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