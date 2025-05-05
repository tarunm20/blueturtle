"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@kit/ui/button";
import { Textarea } from "@kit/ui/textarea";
import { Spinner } from "@kit/ui/spinner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@kit/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";
import { Badge } from "@kit/ui/badge";
import { AlertCircle, CheckCircle, MessageCircle, Zap, Info, Copy, ChevronDown, ChevronUp, Database } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@kit/ui/accordion";
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
  const [executing, setExecuting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dbStatus, setDbStatus] = useState<ConnectionStatus>(null);
  const [modelStatus, setModelStatus] = useState<ConnectionStatus>(null);
  const [dbSchema, setDbSchema] = useState<DBSchema | null>(null);
  const [fetchingSchema, setFetchingSchema] = useState<boolean>(false);
  const [isSchemaMinimized, setIsSchemaMinimized] = useState<boolean>(false);
  
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
  
  // Handle regeneration of queries
  const handleRegenerate = () => {
    // Get the last user message
    const lastUserMessage = messages.findLast(msg => msg.role === "user");
    if (lastUserMessage) {
      setUserPrompt(lastUserMessage.content);
      handleSubmit();
    }
  };

  // Chat handlers
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
      
      // Make API call
      const requestData: GenerateSqlRequest = {
        user_prompt: userPrompt,
        db_connection: dbConnectionRequest,
        llm_config: llmConfig
      };
      
      const res = await axios.post(`${API_BASE_URL}/generate_sql`, requestData);
      
      // Add response to chat
      const assistantMessage: AssistantMessage = { 
        role: "assistant", 
        content: "I've generated the following SQL query:", 
        sql: res.data.sql,
        executing: false
      };
      setMessages(prev => [...prev, assistantMessage]);
      
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

  const executeSQL = async (sql: string): Promise<void> => {
    if (!sql) return;
    
    // Find the message with this SQL and set its executing state
    setMessages(prev => 
      prev.map(msg => 
        'sql' in msg && msg.sql === sql ? { ...msg, executing: true } : msg
      )
    );
    
    setExecuting(true);
    
    try {
      // Add execution message to chat
      const executingMessage: SystemMessage = { 
        role: "system", 
        content: "Executing SQL query..." 
      };
      setMessages(prev => [...prev, executingMessage]);
      
      const requestData: ExecuteSqlRequest = {
        sql: sql,
        db_connection: createDbConnectionRequest()
      };
      
      const res = await axios.post<QueryResult>(`${API_BASE_URL}/execute_sql`, requestData);
      
      // Update original message
      setMessages(prev => 
        prev.map(msg => 
          'sql' in msg && msg.sql === sql ? { ...msg, executing: false } : msg
        )
      );
      
      // Add results to chat
      const resultsMessage: SystemMessage = { 
        role: "system", 
        content: "Query executed successfully", 
        results: res.data 
      };
      setMessages(prev => [...prev, resultsMessage]);
      
    } catch (error) {
      console.error("Error during SQL execution:", error);
      let errorMessage = "Failed to execute SQL. Please check your database connection.";
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'detail' in axiosError.response.data) {
          errorMessage = `SQL Execution Error: ${(axiosError.response.data as any).detail}`;
        }
      }
      
      setError(errorMessage);
      
      // Update original message
      setMessages(prev => 
        prev.map(msg => 
          'sql' in msg && msg.sql === sql ? { ...msg, executing: false } : msg
        )
      );
      
      // Add error message to chat
      const errorMessage2: SystemMessage = { 
        role: "system", 
        content: errorMessage
      };
      setMessages(prev => [...prev, errorMessage2]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl mb-1">Chat with Your Database</CardTitle>
        <CardDescription>
          Connect to your database, select a model, and ask questions about your data in natural language
        </CardDescription>
      </CardHeader>

        <div className="lg:grid lg:grid-cols-12 gap-6">
          {/* Sidebar for configuration */}
          <div className="lg:col-span-3">
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
            />
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-9 lg:flex lg:flex-col lg:gap-6">
            {/* Database Schema Viewer - Only shown when connected */}
            {dbStatus === "success" && dbSchema && (
              <DatabaseSchemaViewer 
                schema={dbSchema} 
                isMinimized={isSchemaMinimized}
                toggleMinimize={() => setIsSchemaMinimized(!isSchemaMinimized)}
              />
            )}
            
            {/* Chat area - now in a fixed layout */}
            <div className="lg:flex-grow lg:flex lg:flex-col lg:h-[600px]">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-lg flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Chat
                  </CardTitle>
                  <CardDescription>
                    Ask questions about your data in natural language
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-grow overflow-auto mb-4">
                  {/* Messages display area */}
                  <div className="space-y-4 h-[350px] overflow-y-auto p-1">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Database className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Connect to your database to get started</p>
                        <p className="text-sm max-w-md">
                          Then ask questions like: "Show me the top 5 customers by order quantity" or 
                          "What products were sold last month?"
                        </p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <ChatMessageComponent 
                          key={index} 
                          message={message} 
                          onExecuteSQL={executeSQL} 
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
                </CardContent>
                
                <CardFooter className="border-t p-4 flex-shrink-0">
                  <div className="flex w-full space-x-2">
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
                      {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                      Send
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ChatPage;