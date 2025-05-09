// frontend/apps/web/app/hooks/use-chat-sessions.ts
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatMessage, QueryResult } from '../home/types';
import { Database } from '~/lib/database.types';

export function useChatSessions() {
  const supabase = useSupabase<Database>();
  const queryClient = useQueryClient();

  // Get all sessions for the current user
  const getSessions = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Get messages for a specific session
  const getMessages = (sessionId: string) => useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      // First, get messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      
      // Then, get query results separately
      const { data: results, error: resultsError } = await supabase
        .from('query_results')
        .select('*')
        .in('message_id', messages?.map(m => m.id) || []);
      
      if (resultsError) throw resultsError;
      
      // Transform the database format to our frontend format
      return (messages || []).map(message => {
        const result: ChatMessage = {
          id: message.id,
          role: message.role as "user" | "assistant" | "system",
          content: message.content
        };
        
        if (message.sql) {
          result.sql = message.sql;
        }
        
        // Find associated query results
        const queryResult = results?.find(r => r.message_id === message.id);
        if (queryResult) {
          result.results = {
            columns: queryResult.columns as string[] || [],
            rows: queryResult.rows as any[][] || []
          };
        }
        
        return result;
      });
    },
    enabled: !!sessionId
  });

  // Create a new session
  const createSession = useMutation({
    mutationFn: async (title: string) => {
      // First, get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!userData?.user?.id) throw new Error("User not authenticated");
      
      // Then create the session with the user_id
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          title,
          user_id: userData.user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    }
  });

  // Delete a session
  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    }
  });

  // Add a message to a session
  const addMessage = useMutation({
    mutationFn: async ({ 
      sessionId, 
      role, 
      content, 
      sql 
    }: { 
      sessionId: string; 
      role: "user" | "assistant" | "system"; 
      content: string; 
      sql?: string; 
    }) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          sql
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update session's updated_at timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    }
  });

  // Add query results to a message
  const addQueryResults = useMutation({
    mutationFn: async ({ 
      messageId, 
      columns, 
      rows 
    }: { 
      messageId: string; 
      columns: string[]; 
      rows: any[][]; 
    }) => {
      const { data, error } = await supabase
        .from('query_results')
        .insert({
          message_id: messageId,
          columns,
          rows
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (_, variables) => {
      // We need to find which session this message belongs to
      const { data: message } = await supabase
        .from('chat_messages')
        .select('session_id')
        .eq('id', variables.messageId)
        .single();
      
      if (message?.session_id) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', message.session_id] });
      }
    }
  });

  return {
    getSessions,
    getMessages,
    createSession,
    deleteSession,
    addMessage,
    addQueryResults
  };
}