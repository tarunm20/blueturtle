// frontend/apps/web/app/home/ChatSessionManager.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { ChatInterface } from './ChatInterface';
import { DatabaseType, ModelType } from './types';
import { ConfirmDialog } from './_components/ConfirmDialog';

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
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

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

  // Handle opening delete confirmation dialog
  const openDeleteConfirmation = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  // Perform deletion with optimistic UI update
  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    
    try {
      // Immediately update the UI (optimistic update)
      const updatedSessions = sessions?.filter(session => session?.id !== sessionToDelete) || [];
      setSessions(updatedSessions);
      
      // Handle the case when active session is being deleted
      if (sessionToDelete === activeSessionId) {
        if (updatedSessions.length > 0) {
          setActiveSessionId(updatedSessions[0]?.id || '');
        } else {
          setActiveSessionId('');
          // We'll create a new session after the deletion is complete
        }
      }
      
      // Close dialog immediately to improve perceived performance
      setDeleteDialogOpen(false);
      
      // Process backend deletion in the background
      const deleteBackend = async () => {
        try {
          // Delete query results first
          const { data: messages } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('session_id', sessionToDelete);
            
          if (messages && messages.length > 0) {
            const messageIds = messages.map(m => m.id);
            
            // Delete query results for these messages
            for (const messageId of messageIds) {
              await supabase
                .from('query_results')
                .delete()
                .eq('message_id', messageId);
            }
          }
          
          // Delete all messages
          await supabase
            .from('chat_messages')
            .delete()
            .eq('session_id', sessionToDelete);
          
          // Finally delete the session
          await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', sessionToDelete);
          
        } catch (err) {
          console.error('Error in background deletion:', err);
          // Note: We don't undo the UI updates even if deletion fails
          // as that would be confusing for the user
        }
      };
      
      // Start background deletion
      deleteBackend();
      
      // Create a new session if needed (we deleted the last one)
      if (updatedSessions.length === 0) {
        createSession();
      }
      
    } finally {
      // Clear session to delete
      setSessionToDelete(null);
    }
  };

  // Cancel delete operation
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
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
                    e.stopPropagation();
                    openDeleteConfirmation(session?.id || '');
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={sessions?.length <= 1}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Chat"
        description="Are you sure you want to delete this chat? This will permanently remove the chat and all of its messages. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
}