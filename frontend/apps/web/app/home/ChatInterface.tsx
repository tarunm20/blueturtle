// frontend/apps/web/app/home/ChatInterface.tsx

'use client';
import { useState, useRef, useEffect, JSXElementConstructor, ReactElement, ReactNode, ReactPortal } from 'react';
import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useChatSessions } from '../hooks/use-chat-sessions';
import { DatabaseType, ModelType, ChatMessage } from './types';
import { QueryResultsTable } from './_components/QueryResultsTable';

interface ChatInterfaceProps {
  sessionId: string;
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
  
export function ChatInterface({ 
  sessionId, 
  dbConfig, 
  llmConfig 
}: ChatInterfaceProps) {
  // Validate sessionId
  if (!sessionId) {
    return <div className="p-4">Invalid session ID</div>;
  }
  
  const { getMessages, addMessage, addQueryResults } = useChatSessions();
  const messagesQuery = getMessages(sessionId);
  
  const [input, setInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [executingQueries, setExecutingQueries] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView?.({ behavior: 'smooth' });
    }
  }, [messagesQuery.data]);

  // Auto-execute SQL queries when they appear in message data
  useEffect(() => {
    const messages = messagesQuery.data || [];
    // Look for assistant messages with SQL that haven't been executed
    const pendingQueries = messages.filter((msg: ChatMessage) => 
      msg.role === 'assistant' && 
      msg.sql && 
      !executingQueries[msg.id || ''] && 
      !messages.some((m: ChatMessage) => 
        m.role === 'system' && 
        m.content.includes('Query returned') && 
        m.sql === msg.sql
      )
    );

    // Execute pending queries
    pendingQueries.forEach((message: ChatMessage) => {
      if (message.id && message.sql) {
        executeSQL(message.sql, message.id);
      }
    });
  }, [messagesQuery.data]);

  // Handle message submission
  const handleSubmit = async () => {
    const trimmedInput = input?.trim?.() || '';
    if (!trimmedInput || isGenerating) return;
    
    setIsGenerating(true);
    setInput(''); // Clear input right away for better UX
    
    try {
      // Add user message to database
      await addMessage.mutateAsync({
        sessionId,
        role: 'user',
        content: trimmedInput
      });
      
      // Get recent message history from current data
      const recentMessages = messagesQuery.data?.slice?.(-5) || [];
      
      // Call API to generate SQL
      const response = await fetch('http://localhost:8000/generate_sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: trimmedInput,
          message_history: recentMessages.map((msg: { role: any; content: any; }) => ({
            role: msg?.role || 'user',
            content: msg?.content || ''
          })),
          db_connection: dbConfig,
          llm_config: llmConfig
        })
      });
      
      if (!response?.ok) {
        throw new Error(`API error: ${response?.status || 'Unknown'}`);
      }
      
      const data = await response.json?.();
      
      if (!data || typeof data?.sql !== 'string') {
        throw new Error('Invalid response data');
      }
      
      // Add assistant response to database
      await addMessage.mutateAsync({
        sessionId,
        role: 'assistant',
        content: 'I\'m executing the following SQL query:',
        sql: data.sql
      });
      
      // The SQL execution will happen automatically in the useEffect hook
      
    } catch (error) {
      console.error('Error:', error);
      
      // Add error message to database
      await addMessage.mutateAsync({
        sessionId,
        role: 'system',
        content: `Error: ${error instanceof Error ? error?.message || 'Unknown error' : 'Unknown error'}`
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const executeSQL = async (sql: string, messageId: string) => {
    if (!sql || !messageId || executingQueries[messageId]) return;
    
    // Mark this query as executing
    setExecutingQueries(prev => ({ ...prev, [messageId]: true }));
    
    try {
      // Add executing message
      await addMessage.mutateAsync({
        sessionId,
        role: 'system',
        content: 'Executing SQL query...'
      });
      
      // Execute the SQL
      const response = await fetch('http://localhost:8000/execute_sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: sql,
          db_connection: dbConfig
        })
      });
      
      if (!response?.ok) {
        throw new Error(`SQL execution error: ${response?.status || 'Unknown'}`);
      }
      
      const data = await response.json?.();
      
      if (!data || !Array.isArray(data?.columns) || !Array.isArray(data?.rows)) {
        throw new Error('Invalid results data');
      }
      
      // Add results message
      const resultsMsg = await addMessage.mutateAsync({
        sessionId,
        role: 'system',
        content: `Query returned ${data.rows?.length || 0} rows.`,
        sql: sql  // Include the SQL for reference
      });
      
      // Store query results
      if (resultsMsg?.id) {
        await addQueryResults.mutateAsync({
          messageId: resultsMsg.id,
          columns: data.columns,
          rows: data.rows
        });
      }
      
    } catch (error) {
      console.error('Error executing SQL:', error);
      
      // Add error message
      await addMessage.mutateAsync({
        sessionId,
        role: 'system',
        content: `SQL execution error: ${error instanceof Error ? error?.message || 'Unknown error' : 'Unknown error'}`
      });
    } finally {
      // Mark this query as no longer executing
      setExecutingQueries(prev => ({ ...prev, [messageId]: false }));
    }
  };

  // Format to display the chat messages
  const renderMessages = () => {
    if (messagesQuery.isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }
    
    if (messagesQuery.isError) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          Error loading messages
        </div>
      );
    }
    
    if (!messagesQuery.data?.length) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Start a new conversation
        </div>
      );
    }
    
    return messagesQuery.data.map((message, index) => {
      const messageId = message.id || index.toString();
      
      return (
        <div 
          key={messageId}
          className={`p-3 rounded-lg ${
            message.role === 'user' 
              ? 'bg-primary/10 ml-10' 
              : message.role === 'assistant' 
                ? 'bg-secondary/10 mr-10' 
                : 'bg-muted'
          }`}
        >
          <div className="font-medium mb-1">
            {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Assistant' : 'System'}
          </div>
          <div>{message.content || ''}</div>
          
          {message.sql && (
            <div className="mt-2 p-2 bg-muted rounded font-mono text-sm overflow-auto">
              <div className="text-xs text-muted-foreground mb-1">SQL Query:</div>
              <div>{message.sql}</div>
              {executingQueries[messageId] && (
                <div className="mt-2 flex items-center text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" /> 
                  Executing query...
                </div>
              )}
            </div>
          )}
          
          {message.results && (
            <div className="mt-2">
              <QueryResultsTable 
                columns={message.results.columns} 
                rows={message.results.rows} 
              />
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t p-4 flex">
        <Textarea
          value={input || ''}
          onChange={(e) => setInput(e?.target?.value || '')}
          placeholder="Ask a question..."
          className="flex-1 resize-none"
          onKeyDown={(e) => {
            if (e?.key === 'Enter' && !e?.shiftKey && !isGenerating) {
              e.preventDefault?.();
              handleSubmit();
            }
          }}
        />
        <Button 
          onClick={handleSubmit}
          disabled={isGenerating || !(input?.trim?.())}
          className="ml-2 self-end"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Send'
          )}
        </Button>
      </div>
    </div>
  );
}