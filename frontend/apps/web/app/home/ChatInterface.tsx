// frontend/apps/web/app/home/ChatInterface.tsx

'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Textarea } from '@kit/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useChatSessions } from '../hooks/use-chat-sessions';
import { DatabaseType, ModelType, ChatMessage } from './types';
import { QueryResultsTable } from './_components/QueryResultsTable';
import { useQueryClient } from '@tanstack/react-query';

// Maximum number of regeneration attempts
const MAX_REGENERATION_ATTEMPTS = 3;

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

interface RegenerationState {
  originalPrompt: string;
  currentAttempt: number;
  userMessageId: string | null;
  assistantMessageId: string | null;
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
  const queryClient = useQueryClient();
  
  const [input, setInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [executingQueries, setExecutingQueries] = useState<Record<string, boolean>>({});
  
  // Track current processing user message
  const [processingUserMessage, setProcessingUserMessage] = useState<string | null>(null);
  
  // State for tracking regeneration attempts
  const [regenerationState, setRegenerationState] = useState<RegenerationState | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView?.({ behavior: 'smooth' });
    }
  }, [messagesQuery.data, processingUserMessage]);

  // Function to handle SQL generation (initial or regeneration)
  const generateSQL = async (
    prompt: string, 
    isRegeneration = false, 
    attemptNumber = 1
  ) => {
    try {
      // Get recent message history from current data
      const recentMessages = messagesQuery.data?.slice?.(-5) || [];
      
      // Call API to generate SQL
      const response = await fetch('http://localhost:8000/generate_sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: prompt,
          message_history: recentMessages
            .filter(msg => msg.role === 'user') // Only include user messages for context
            .map((msg: { role: any; content: any; }) => ({
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
      
      // Only display a user message for initial query (not regenerations)
      let userMessageId = regenerationState?.userMessageId || null;
      
      if (!isRegeneration) {
        const userMessage = await addMessage.mutateAsync({
          sessionId,
          role: 'user',
          content: prompt
        });
        userMessageId = userMessage.id || null;
        
        // Clear the processing user message since it's now saved to the database
        setProcessingUserMessage(null);
      }
      
      // Add assistant response to database
      const assistantMessage = await addMessage.mutateAsync({
        sessionId,
        role: 'assistant',
        content: 'I\'m executing the following SQL query:',
        sql: data.sql
      });
      
      // Update regeneration state
      setRegenerationState({
        originalPrompt: prompt,
        currentAttempt: attemptNumber,
        userMessageId,
        assistantMessageId: assistantMessage.id || null
      });
      
      // Try to execute the SQL query
      if (assistantMessage.id) {
        await executeSQL(data.sql, assistantMessage.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error:', error);
      
      // If we're below the max attempts, try regenerating
      if (attemptNumber < MAX_REGENERATION_ATTEMPTS) {
        console.log(`Regenerating SQL (attempt ${attemptNumber + 1}/${MAX_REGENERATION_ATTEMPTS})`);
        return generateSQL(prompt, true, attemptNumber + 1);
      } else {
        console.log(`Max regeneration attempts (${MAX_REGENERATION_ATTEMPTS}) reached`);
        
        // After max attempts, add a generic response instead of an error message
        await addMessage.mutateAsync({
          sessionId,
          role: 'assistant',
          content: "I couldn't find any relevant data for your query. Could you rephrase your question or provide more specific details about what you're looking for?"
        });
        
        // Clear the processing user message if it's still there
        setProcessingUserMessage(null);
        
        return false;
      }
    }
  };
  
  // Handle message submission
  const handleSubmit = async () => {
    const trimmedInput = input?.trim?.() || '';
    if (!trimmedInput || isGenerating) return;
    
    setIsGenerating(true);
    setInput(''); // Clear input right away for better UX
    
    // Immediately show the user message in the UI
    setProcessingUserMessage(trimmedInput);
    
    // Reset regeneration state for new queries
    setRegenerationState(null);
    
    try {
      await generateSQL(trimmedInput);
    } finally {
      setIsGenerating(false);
      
      // In case of an error that bypasses our handling, clear the processing message
      if (processingUserMessage === trimmedInput) {
        setProcessingUserMessage(null);
      }
    }
  };
  
  const executeSQL = async (sql: string, messageId: string) => {
    if (!sql || !messageId || executingQueries[messageId]) return;
    
    // Mark this query as executing
    setExecutingQueries(prev => ({ ...prev, [messageId]: true }));
    
    try {
      // Execute the SQL (don't add a "Executing..." message to keep the chat clean)
      const response = await fetch('http://localhost:8000/execute_sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: sql,
          db_connection: dbConfig
        })
      });
      
      // Check for 422 error (SQL syntax error)
      if (response.status === 422) {
        // Handle SQL syntax error by regenerating
        if (regenerationState && regenerationState.currentAttempt < MAX_REGENERATION_ATTEMPTS) {
          // Invalidate query to refresh messages (effectively removing the failed attempt visually)
          queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
          
          // Increment attempt count and try again
          const nextAttempt = regenerationState.currentAttempt + 1;
          console.log(`SQL error detected. Regenerating (attempt ${nextAttempt}/${MAX_REGENERATION_ATTEMPTS})`);
          
          // Allow some time for visual changes
          setTimeout(() => {
            generateSQL(regenerationState.originalPrompt, true, nextAttempt);
          }, 300);
          
          return;
        } else {
          // Max attempts reached, add a generic response instead of an error
          await addMessage.mutateAsync({
            sessionId,
            role: 'assistant',
            content: "I couldn't find any relevant data for your query. Could you rephrase your question or provide more specific details about what you're looking for?"
          });
          return;
        }
      }
      
      if (!response?.ok) {
        throw new Error(`SQL execution error: ${response?.status || 'Unknown'}`);
      }
      
      const data = await response.json?.();
      
      if (!data || !Array.isArray(data?.columns) || !Array.isArray(data?.rows)) {
        throw new Error('Invalid results data');
      }
      
      // Add success message with results
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
      
      // If we're within regeneration attempts, try again with a different query
      if (regenerationState && regenerationState.currentAttempt < MAX_REGENERATION_ATTEMPTS) {
        // Invalidate query to refresh messages
        queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
        
        // Increment attempt count and try again
        const nextAttempt = regenerationState.currentAttempt + 1;
        console.log(`SQL execution failed. Regenerating (attempt ${nextAttempt}/${MAX_REGENERATION_ATTEMPTS})`);
        
        // Allow some time for visual changes
        setTimeout(() => {
          generateSQL(regenerationState.originalPrompt, true, nextAttempt);
        }, 300);
      } else {
        // Max attempts reached, add a generic response
        await addMessage.mutateAsync({
          sessionId,
          role: 'assistant',
          content: "I couldn't find any relevant data for your query. Could you rephrase your question or provide more specific details about what you're looking for?"
        });
      }
    } finally {
      // Mark this query as no longer executing
      setExecutingQueries(prev => ({ ...prev, [messageId]: false }));
    }
  };

  // Format to display the chat messages - only show messages we want users to see
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
    
    // Filter messages to only show successful ones or user messages
    // This hides error messages and failed attempts
    const filteredMessages = messagesQuery.data?.filter(message => {
      // Always show user messages
      if (message.role === 'user') return true;
      
      // For assistant and system messages, don't show ones with errors
      return !message.content.includes('Error') && 
            !message.content.includes('Executing SQL query...') &&
            !message.content.includes('Regenerating query');
    }) || [];
    
    // Build the rendered messages
    const renderedMessages = filteredMessages.map((message, index) => {
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
    
    // If there's a processing user message, add it to the list
    if (processingUserMessage) {
      renderedMessages.push(
        <div 
          key="processing-user-message"
          className="p-3 rounded-lg bg-primary/10 ml-10"
        >
          <div className="font-medium mb-1">You</div>
          <div>{processingUserMessage}</div>
        </div>
      );
      
      // Also add a loading message
      renderedMessages.push(
        <div 
          key="loading-message"
          className="p-3 rounded-lg bg-secondary/10 mr-10"
        >
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Generating response...</span>
          </div>
        </div>
      );
    }
    
    if (renderedMessages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Start a new conversation
        </div>
      );
    }
    
    return renderedMessages;
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