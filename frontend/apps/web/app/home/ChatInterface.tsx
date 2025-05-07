// frontend/apps/web/app/home/ChatInterface.tsx

'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useChatSessions } from '../hooks/use-chat-sessions';
import { DatabaseType, ModelType, ChatMessage } from './types';
import { ChatMessageComponent } from './_components/ChatMessageComponent';

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
  const [failedQueries, setFailedQueries] = useState<Record<string, boolean>>({});
  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView?.({ behavior: 'smooth' });
    }
  }, [messagesQuery.data]);

  useEffect(() => {
    const messages = messagesQuery.data || [];
    // Look for assistant messages with SQL that haven't been executed or failed
    const pendingQueries = messages.filter((msg: ChatMessage) => 
      msg.role === 'assistant' && 
      msg.sql && 
      !executingQueries[msg.id || ''] && 
      !failedQueries[msg.id || ''] &&
      !messages.some((m: ChatMessage) => 
        m.role === 'system' && 
        (m.content.includes('Query returned') || m.content.includes('SQL execution error')) && 
        m.sql === msg.sql
      )
    );
  
    // Execute pending queries
    pendingQueries.forEach((message: ChatMessage) => {
      if (message.id && message.sql) {
        executeSQL(message.sql, message.id);
      }
    });
  }, [messagesQuery.data, executingQueries, failedQueries]);

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

  // Handle visualization request
  const handleRequestVisualization = async (message: ChatMessage) => {
    if (!message.results) return;
    
    try {
      // Call the visualization recommendation API
      const response = await fetch('http://localhost:8000/recommend_visualization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: messagesQuery.data?.find(msg => msg.role === 'user')?.content || '',
          columns: message.results.columns,
          rows: message.results.rows,
          llm_config: llmConfig
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const visualization = await response.json();
      
      // Update the message with visualization recommendation
      if (message.id) {
        await addQueryResults.mutateAsync({
          messageId: message.id,
          columns: message.results.columns,
          rows: message.results.rows,
          visualization
        });
      }
      
      // If visualization is appropriate, add a system message with explanation
      if (visualization.visualization) {
        await addMessage.mutateAsync({
          sessionId,
          role: 'system',
          content: `Based on this data, I recommend a ${visualization.chartType} chart with "${visualization.xAxis}" on the X-axis and "${visualization.yAxis}" on the Y-axis. ${visualization.explanation || ''}`
        });
      } else {
        await addMessage.mutateAsync({
          sessionId,
          role: 'system',
          content: `This data doesn't seem suitable for visualization. ${visualization.explanation || ''}`
        });
      }
    } catch (error) {
      console.error('Error getting visualization recommendation:', error);
      
      // Add error message
      await addMessage.mutateAsync({
        sessionId,
        role: 'system',
        content: `Could not generate visualization: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };
  
  const executeSQL = async (sql: string, messageId: string): Promise<void> => {
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
      
      if (!response.ok) {
        // Mark this query as failed to prevent infinite retry
        setFailedQueries(prev => ({ ...prev, [messageId]: true }));
        
        // Parse error response
        const errorData = await response.json();
        const errorMessage = errorData.detail?.error || 'SQL syntax error';
        
        console.log('SQL execution failed:', errorMessage);
        
        // Find the last user message for context
        const lastUserMessage = messagesQuery.data?.findLast(msg => msg.role === 'user');
        
        if (lastUserMessage) {
          // Get recent message history for context
          const recentMessages = messagesQuery.data?.slice(-5) || [];
          
          try {
            // Replace the execution message with a more user-friendly one
            await addMessage.mutateAsync({
              sessionId,
              role: 'system',
              content: 'Let me try a different approach...'
            });
            
            // Call regenerate_sql endpoint
            const regenerateResponse = await fetch('http://localhost:8000/regenerate_sql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_prompt: lastUserMessage.content,
                message_history: recentMessages.map(msg => ({
                  role: msg.role,
                  content: msg.content
                })),
                db_connection: dbConfig,
                llm_config: llmConfig,
                failed_sql: sql,
                error_message: errorMessage
              })
            });
            
            if (!regenerateResponse.ok) {
              throw new Error(`Failed to regenerate SQL: ${regenerateResponse.statusText}`);
            }
            
            const regenerateData = await regenerateResponse.json();
            
            // Add a new message with the corrected SQL
            await addMessage.mutateAsync({
              sessionId,
              role: 'assistant',
              content: 'I\'ve generated this SQL query:',
              sql: regenerateData.sql
            });
            
            // We don't need to manually execute the new SQL - it will be picked up by the useEffect hook
            return;
          } catch (regenerateError) {
            console.error('Error during SQL regeneration:', regenerateError);
            // If regeneration fails, we'll show a generic message
            await addMessage.mutateAsync({
              sessionId,
              role: 'system',
              content: 'I couldn\'t process that question properly. Let\'s try a different approach.'
            });
          }
        }
        
        return;
      }
      
      const data = await response.json();
      
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
      
      // Mark this query as failed to prevent infinite retry
      setFailedQueries(prev => ({ ...prev, [messageId]: true }));
      
      // Add error message
      await addMessage.mutateAsync({
        sessionId,
        role: 'system',
        content: 'I encountered an issue executing that query. Let me know if you\'d like to try a different question.'
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
      <ChatMessageComponent 
        key={messageId}
        message={message}
        onExecuteSQL={(sql: string) => executeSQL(sql, messageId)}
        onRequestVisualization={handleRequestVisualization}
      />
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