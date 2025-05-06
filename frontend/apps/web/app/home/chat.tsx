// frontend/apps/web/app/home/chat.tsx

"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@kit/ui/button";
import { Textarea } from "@kit/ui/textarea";
import { Spinner } from "@kit/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { MessageCircle, Database, Menu, X } from "lucide-react";
import axios, { AxiosError } from "axios";

// Import types and components
import { 
  DatabaseType, 
  ModelType, 
  ConnectionStatus, 
  ChatMessage, 
  UserMessage, 
  AssistantMessage, 
  SystemMessage, 
  DBSchema,
  QueryResult,
  LLMConfig,
  DbConnectionRequest,
  GenerateSqlRequest,
  ExecuteSqlRequest
} from "./types";

import { ConfigSidebar } from "./_components/ConfigSidebar";
import { DatabaseSchemaViewer } from "./_components/DatabaseSchemaViewer";
import { ChatMessageComponent } from "./_components/ChatMessageComponent";
import { ErrorHandling } from "./_components/ErrorHandling";
import { ConversationsList } from "./_components/ConversationsList";
import { useMediaQuery } from "../../lib/hooks/use-media-query";

// Base URL for API calls
const API_BASE_URL = "http://127.0.0.1:8000";

// Main chat interface component
const ChatPage: React.FC = () => {
  // State for database connection
  const [dbType, setDbType] = useState<DatabaseType>("postgres");
  const [dbHost, setDbHost] = useState<string>("localhost");
  const [dbPort, setDbPort] = useState<string>("5432");
  const [dbName, setDbName] = useState<string>("");
  const [dbUser, setDbUser] = useState<string>("");
  const [dbPassword, setDbPassword] = useState<string>("");
  
  // State for LLM
  const [modelType, setModelType] = useState<ModelType>("ollama");
  const [modelUrl, setModelUrl] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [customModel, setCustomModel] = useState<string>("llama3.2");
  
  // State for user input
  const [userPrompt, setUserPrompt] = useState<string>("");
  
  // State for operations
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dbStatus, setDbStatus] = useState<ConnectionStatus>(null);
  const [modelStatus, setModelStatus] = useState<ConnectionStatus>(null);
  const [dbSchema, setDbSchema] = useState<DBSchema | null>(null);
  const [fetchingSchema, setFetchingSchema] = useState<boolean>(false);
  const [isSchemaMinimized, setIsSchemaMinimized] = useState<boolean>(false);
  
  // New state for UI control
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [conversations, setConversations] = useState<{id: string, title: string}[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [executingQuery, setExecutingQuery] = useState<boolean>(false);
  
  // Check if we're on desktop
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  
  // Reference for auto-scrolling messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages when they update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Helper to create database connection request
  const createDbConnectionRequest = (): DbConnectionRequest => {
    const request: DbConnectionRequest = {
      db_type: dbType,
      db_name: dbName
    };
    
    // Add optional fields if they're provided and relevant
    if (dbType !== "sqlite") {
      request.db_host = dbHost;
      if (dbPort) request.db_port = dbPort;
      if (dbUser) request.db_user = dbUser;
      if (dbPassword) request.db_password = dbPassword;
    }
    
    return request;
  };
  
  // Helper to create LLM configuration
  const createLLMConfig = (): LLMConfig => {
    const config: LLMConfig = {
      provider: modelType,
      model: undefined,
      url: undefined,
      apiKey: undefined
    };
    
    if (modelType === "ollama") {
      config.model = customModel;
    } else if (modelType === "openai") {
      config.apiKey = apiKey;
    } else if (modelType === "custom") {
      config.url = modelUrl;
    }
    
    return config;
  };

  // Connection test handlers
  const testDbConnection = async (): Promise<void> => {
    if (!dbName || (dbType !== "sqlite" && (!dbHost || !dbUser))) {
      setDbStatus("error");
      setError("Please provide all required database information");
      return;
    }
    
    setDbStatus("loading");
    setFetchingSchema(true);
    setError(null);
    
    try {
      // Create connection request
      const dbConnectionRequest = createDbConnectionRequest();
      
      // Test connection
      const res = await axios.post(`${API_BASE_URL}/test_db_connection`, dbConnectionRequest);
      
      if (res.data.success) {
        setDbStatus("success");
        
        // Fetch the database schema
        try {
          const schemaRes = await axios.post(`${API_BASE_URL}/get_db_schema`, dbConnectionRequest);
          if (schemaRes.data.success && schemaRes.data.schema) {
            setDbSchema(schemaRes.data.schema);
          } else {
            setError("Connected to database but failed to retrieve schema");
          }
        } catch (schemaError) {
          console.error("Failed to fetch schema:", schemaError);
          setError("Connected to database but failed to retrieve schema");
        }
      } else {
        setDbStatus("error");
        setError(`Database connection failed: ${res.data.message}`);
      }
    } catch (error) {
      console.error("Connection test error:", error);
      setDbStatus("error");
      
      let errorMessage = "Failed to connect to database. Please check your connection details.";
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'detail' in axiosError.response.data) {
          errorMessage = `Error: ${(axiosError.response.data as any).detail}`;
        } else if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data) {
          errorMessage = `Error: ${(axiosError.response.data as any).message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setFetchingSchema(false);
    }
  };
  
  const testModelConnection = async (): Promise<void> => {
    if ((modelType === "custom" && !modelUrl) || 
        (modelType === "openai" && !apiKey)) {
      setModelStatus("error");
      setError("Please provide all required model connection details");
      return;
    }
    
    setModelStatus("loading");
    setError(null);
    
    try {
      // In a real implementation, this would test the actual LLM connection
      if (modelType === "ollama") {
        // For local Ollama, we could ping the Ollama server
        await axios.post(`${API_BASE_URL}/probe_llm`, {
          provider: "ollama",
          url: "http://localhost:11434"
        });
        setModelStatus("success");
      } else {
        // Just simulate success for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        setModelStatus("success");
      }
    } catch (error) {
      console.error("Model connection test error:", error);
      setModelStatus("error");
      setError("Failed to connect to model service. Please check your details.");
    }
  };
  
  // Conversation handlers
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setUserPrompt("");
    
    // Close mobile sidebar if open
    if (!isDesktop) {
      setIsMobileSidebarOpen(false);
    }
  };
  
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    // In a real implementation, load the conversation messages here
    
    // Close mobile sidebar if open
    if (!isDesktop) {
      setIsMobileSidebarOpen(false);
    }
  };
  
  // Handle regeneration of queries
  const handleRegenerate = () => {
    // Get the last user message
    const lastUserMessage = messages.findLast(msg => msg.role === "user");
    if (lastUserMessage) {
      setUserPrompt(lastUserMessage.content);
      handleSubmit();
    }
  };

  // Execute SQL and return results
  const executeSQL = async (sql: string): Promise<QueryResult | null> => {
    if (!sql) return null;
    
    setExecutingQuery(true);
    
    try {
      const requestData: ExecuteSqlRequest = {
        sql: sql,
        db_connection: createDbConnectionRequest()
      };
      
      const res = await axios.post<QueryResult>(`${API_BASE_URL}/execute_sql`, requestData);
      return res.data;
    } catch (error) {
      console.error("Error during SQL execution:", error);
      let errorMessage = "Failed to execute SQL. Please check your database connection.";
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'detail' in axiosError.response.data) {
          errorMessage = `SQL Execution Error: ${(axiosError.response.data as any).detail}`;
        }
      }
      
      // Add error message to chat
      const errorMessage2: SystemMessage = { 
        role: "system", 
        content: errorMessage
      };
      setMessages(prev => [...prev, errorMessage2]);
      
      setError(errorMessage);
      return null;
    } finally {
      setExecutingQuery(false);
    }
  };
  // Chat handlers with automatic SQL execution
  const handleSubmit = async (): Promise<void> => {
    if (!userPrompt || dbStatus !== "success") {
      setError("Please enter a prompt and connect to a database");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Add user message to chat
      const userMessage: UserMessage = { role: "user", content: userPrompt };
      setMessages(prev => [...prev, userMessage]);
      
      // Configure the request
      const dbConnectionRequest = createDbConnectionRequest();
      const llmConfig = createLLMConfig();
      
      // Make API call to generate SQL
      const requestData: GenerateSqlRequest = {
        user_prompt: userPrompt,
        db_connection: dbConnectionRequest,
        llm_config: llmConfig
      };
      
      const res = await axios.post(`${API_BASE_URL}/generate_sql`, requestData);
      const sql = res.data.sql;
      
      // Add assistant message with SQL
      const assistantMessage: AssistantMessage = { 
        role: "assistant", 
        content: "Based on your question, I've generated and executed the following SQL query:", 
        sql: sql,
        executing: true
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Automatically execute the SQL
      const results = await executeSQL(sql);
      
      // Update assistant message to show it's done executing
      setMessages(prev => 
        prev.map(msg => 
          'sql' in msg && msg.sql === sql ? { ...msg, executing: false } : msg
        )
      );
      
      // Add results to chat if we have them
      if (results) {
        const resultsMessage: SystemMessage = { 
          role: "system", 
          content: "Here are the results:", 
          results: results 
        };
        setMessages(prev => [...prev, resultsMessage]);
      }
      
    } catch (error) {
      console.error("Error during request:", error);
      let errorMessage = "Failed to generate SQL. Please check your connections and try again.";
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'detail' in axiosError.response.data) {
          errorMessage = `Error: ${(axiosError.response.data as any).detail}`;
        }
      }
      
      setError(errorMessage);
      
      // Add error message to chat
      const errorSystemMessage: SystemMessage = { 
        role: "system", 
        content: errorMessage
      };
      setMessages(prev => [...prev, errorSystemMessage]);
    } finally {
      setLoading(false);
      setUserPrompt(""); // Clear the input field
    }
  };

  return (
    <div className="container mx-auto p-0 max-w-none h-[calc(100vh-4rem)]">
      <div className="flex h-full">
        {/* Conversations sidebar - shown on desktop or when opened on mobile */}
        {(isDesktop || isMobileSidebarOpen) && (
          <div className={`${isDesktop ? 'w-80' : 'w-full absolute inset-0 z-50 bg-background'} border-r border-border h-full`}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Conversations</h3>
              {!isDesktop && (
                <Button variant="ghost" size="sm" onClick={() => setIsMobileSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
            <ConversationsList 
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
            />
          </div>
        )}
        
        {/* Main chat area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center justify-between p-4 border-b">
            {!isDesktop && (
              <Button variant="ghost" size="sm" onClick={() => setIsMobileSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h2 className="font-semibold flex-1 text-center">
              {activeConversationId ? "Conversation" : "New Chat"}
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
            >
              <Database className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
          
          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {dbStatus === "success" && dbSchema && (
              <DatabaseSchemaViewer 
                schema={dbSchema} 
                isMinimized={isSchemaMinimized}
                toggleMinimize={() => setIsSchemaMinimized(!isSchemaMinimized)}
              />
            )}
            
            <div className="space-y-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Start a conversation</p>
                  <p className="text-sm max-w-md">
                    Connect to your database and ask questions about your data
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <ChatMessageComponent 
                    key={index} 
                    message={message} 
                    previousMessage={index > 0 ? messages[index-1] : undefined}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {error && (
              <ErrorHandling 
                error={error} 
                onRegenerate={handleRegenerate}
                showRegenerate={messages.length > 0 && messages[messages.length - 2]?.role === "user"}
              />
            )}
          </div>
          
          {/* Input area */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder={dbStatus === "success" 
                  ? "Ask a question about your data..." 
                  : "Connect to your database first..."}
                className="flex-grow resize-none"
                disabled={dbStatus !== "success"}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button 
                onClick={handleSubmit}
                disabled={loading || dbStatus !== "success"}
                className="self-end"
              >
                {loading || executingQuery ? (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="flex flex-col items-center space-y-4">
                      <Spinner className="h-10 w-10" />
                      <p className="text-sm font-medium">
                        {loading ? "Generating SQL..." : "Executing query..."}
                      </p>
                    </div>
                  </div>
                ) : null}
                Send
              </Button>
            </div>
          </div>
        </div>
        
        {/* Config sidebar - shown when opened */}
        {isConfigOpen && (
          <div className={`${isDesktop ? 'w-80' : 'w-full absolute inset-0 z-50 bg-background'} border-l border-border h-full`}>
            <ConfigSidebar 
              dbType={dbType}
              setDbType={setDbType}
              dbHost={dbHost}
              setDbHost={setDbHost}
              dbPort={dbPort}
              setDbPort={setDbPort}
              dbName={dbName}
              setDbName={setDbName}
              dbUser={dbUser}
              setDbUser={setDbUser}
              dbPassword={dbPassword}
              setDbPassword={setDbPassword}
              modelType={modelType}
              setModelType={setModelType}
              modelUrl={modelUrl}
              setModelUrl={setModelUrl}
              apiKey={apiKey}
              setApiKey={setApiKey}
              customModel={customModel}
              setCustomModel={setCustomModel}
              dbStatus={dbStatus}
              modelStatus={modelStatus}
              testDbConnection={testDbConnection}
              testModelConnection={testModelConnection}
              fetchingSchema={fetchingSchema}
              onClose={() => setIsConfigOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;