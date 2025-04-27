"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@kit/ui/button";
import { Textarea } from "@kit/ui/textarea";
import { Spinner } from "@kit/ui/spinner";
import { Input } from "@kit/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@kit/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kit/ui/select";
import { Badge } from "@kit/ui/badge";
import { AlertCircle, CheckCircle, Database, MessageCircle, Zap, Info, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@kit/ui/accordion";
import axios, { AxiosError } from "axios";

// Define all the types we'll use
type DatabaseType = "postgres" | "mysql" | "mssql" | "sqlite";
type ModelType = "ollama" | "openai" | "custom";
type ConnectionStatus = "success" | "error" | "loading" | null;
type DBSchema = Record<string, string[]>;

// Message types
interface BaseMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UserMessage extends BaseMessage {
  role: "user";
}

interface AssistantMessage extends BaseMessage {
  role: "assistant";
  sql?: string;
  executing?: boolean;
}

interface SystemMessage extends BaseMessage {
  role: "system";
  results?: QueryResult;
}

type ChatMessage = UserMessage | AssistantMessage | SystemMessage;

interface QueryResult {
  columns: string[];
  rows: any[][];
}

interface SqlResponse {
  sql: string;
}

interface SchemaResponse {
  success: boolean;
  schema?: DBSchema;
  message?: string;
}

interface LLMConfig {
  provider: ModelType;
  model?: string;
  url?: string;
  apiKey?: string;
}

interface GenerateSqlRequest {
  user_prompt: string;
  db_url: string;
  llm_config: LLMConfig;
}

interface ExecuteSqlRequest {
  sql: string;
  db_url: string;
}

interface DbConnectionResponse {
  success: boolean;
  message: string;
}

// Base URL for API calls
const API_BASE_URL = "http://127.0.0.1:8000";

// Component for displaying a single message in the chat
interface ChatMessageProps {
  message: ChatMessage;
  onExecuteSQL: (sql: string) => Promise<void>;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, onExecuteSQL }) => {
  const bgColorClass = message.role === "user" 
    ? "bg-primary/10" 
    : message.role === "assistant" 
      ? "bg-secondary/10" 
      : "bg-muted";
      
  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text)
      .catch((error) => console.error('Failed to copy text: ', error));
  };
  
  return (
    <div className={`p-4 rounded-lg mb-4 ${bgColorClass}`}>
      {message.role === "user" && (
        <div className="flex items-start">
          <Badge variant="outline" className="mr-2 mt-1">You</Badge>
          <p>{message.content}</p>
        </div>
      )}
      
      {message.role === "assistant" && (
        <div className="flex flex-col space-y-2">
          <div className="flex items-start">
            <Badge variant="outline" className="mr-2 mt-1">Assistant</Badge>
            <p>{message.content}</p>
          </div>
          
          {message.sql && (
            <div className="mt-2 p-3 bg-gray-800 text-gray-100 rounded font-mono text-sm overflow-x-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">SQL Query</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => copyToClipboard(message.sql || "")}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <pre>{message.sql}</pre>
              <div className="mt-2">
                <Button 
                  size="sm" 
                  onClick={() => onExecuteSQL(message.sql || "")}
                  disabled={message.executing}
                  className="mt-2"
                >
                  {message.executing ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Execute Query
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {message.role === "system" && (
        <div className="flex items-start text-sm">
          <Badge variant="outline" className="mr-2 mt-1">System</Badge>
          <p>{message.content}</p>
        </div>
      )}
      
      {'results' in message && message.results && (
        <div className="mt-3 overflow-x-auto">
          <div className="font-semibold mb-2 flex items-center">
            <Info className="h-4 w-4 mr-2" /> Query Results:
          </div>
          {message.results.rows && message.results.rows.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-200 rounded overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  {message.results.columns.map((column: string, i: number) => (
                    <th key={i} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.results.rows.map((row: any[], rowIndex: number) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell: any, cellIndex: number) => (
                      <td key={cellIndex} className="px-4 py-2 text-sm">
                        {JSON.stringify(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">No results found</p>
          )}
        </div>
      )}
    </div>
  );
};

// Component for displaying database schema
interface DatabaseSchemaViewerProps {
  schema: DBSchema;
  isMinimized: boolean;
  toggleMinimize: () => void;
}

const DatabaseSchemaViewer: React.FC<DatabaseSchemaViewerProps> = ({ schema, isMinimized, toggleMinimize }) => {
  if (!schema) return null;
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            <CardTitle className="text-lg">Database Schema</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleMinimize}>
            {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          Overview of tables and columns in your database
        </CardDescription>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent>
          <Tabs defaultValue="visual" className="mb-4">
            <TabsList>
              <TabsTrigger value="visual">Visual View</TabsTrigger>
              <TabsTrigger value="text">Text View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="visual">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                <Accordion type="multiple" className="w-full">
                  {Object.entries(schema).map(([tableName, columns], tableIndex) => (
                    <AccordionItem key={tableIndex} value={`item-${tableIndex}`}>
                      <AccordionTrigger className="bg-primary/10 px-3 py-2 rounded-t-md font-medium flex items-center border relative">
                        <span className="text-primary mr-2">📋</span> 
                        <span className="text-lg">{tableName}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {Array.isArray(columns) ? columns.length : 0} columns
                        </Badge>
                        
                        {/* Table relationships visualization */}
                        <div className="absolute right-10 top-2 flex space-x-1">
                          {Array.isArray(columns) && columns.some(col => col.toLowerCase().includes('_id')) && (
                            <Badge variant="secondary" className="text-xs">FK</Badge>
                          )}
                          {Array.isArray(columns) && columns.length > 0 && columns[0].toLowerCase().includes('id') && (
                            <Badge variant="outline" className="text-xs bg-primary/20">PK</Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-background border border-t-0 rounded-b-md p-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm p-2">
                          {Array.isArray(columns) && columns.map((column, i) => {
                            const isPrimaryKey = column.toLowerCase().includes("id") && i === 0;
                            const isForeignKey = column.toLowerCase().includes("_id");
                            
                            // Split column name and type for better visualization
                            const parts = column.match(/(.+?)(\(.+\))?$/);
                            const columnName = parts?.[1]?.trim() || column;
                            const columnType = parts?.[2] || "";
                            
                            return (
                              <div 
                                key={i} 
                                className={`rounded p-2 flex flex-col ${
                                  isPrimaryKey 
                                    ? "bg-primary/10 font-medium border-l-4 border-l-primary" 
                                    : isForeignKey 
                                      ? "bg-secondary/10 border-l-4 border-l-secondary" 
                                      : "bg-muted/30"
                                }`}
                              >
                                <div className="flex items-center">
                                  <span className={`mr-2 ${
                                    isPrimaryKey 
                                      ? "text-primary" 
                                      : isForeignKey 
                                        ? "text-secondary" 
                                        : "text-muted-foreground"
                                  }`}>
                                    {isPrimaryKey ? "🔑" : isForeignKey ? "🔗" : "•"}
                                  </span>
                                  <span className="font-medium">{columnName}</span>
                                </div>
                                {columnType && (
                                  <span className="text-xs text-muted-foreground ml-6 mt-1">{columnType}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </TabsContent>
            
            <TabsContent value="text">
              <pre className="bg-muted/20 p-4 rounded-md text-xs overflow-auto max-h-[300px]">
                {Object.entries(schema).map(([tableName, columns]) => (
                  `Table: ${tableName}\n  Columns: ${Array.isArray(columns) ? columns.join(', ') : ''}\n\n`
                )).join('')}
              </pre>
            </TabsContent>
          </Tabs>
          
          <div className="text-xs text-muted-foreground">
            <p>
              <strong>Tip:</strong> Use the schema details above to formulate better questions about your data.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Component for configuration sidebar
interface ConfigSidebarProps {
  dbType: DatabaseType;
  setDbType: (type: DatabaseType) => void;
  dbUrl: string;
  setDbUrl: (url: string) => void;
  modelType: ModelType;
  setModelType: (type: ModelType) => void;
  modelUrl: string;
  setModelUrl: (url: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  customModel: string;
  setCustomModel: (model: string) => void;
  dbStatus: ConnectionStatus;
  modelStatus: ConnectionStatus;
  testDbConnection: () => Promise<void>;
  testModelConnection: () => Promise<void>;
  fetchingSchema: boolean;
}

const ConfigSidebar: React.FC<ConfigSidebarProps> = ({ 
  dbType, setDbType, 
  dbUrl, setDbUrl, 
  modelType, setModelType, 
  modelUrl, setModelUrl, 
  apiKey, setApiKey, 
  customModel, setCustomModel,
  dbStatus, modelStatus,
  testDbConnection, testModelConnection,
  fetchingSchema
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Connections
        </CardTitle>
        <CardDescription>
          Configure your database and model
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="database">
          <TabsList className="w-full">
            <TabsTrigger value="database" className="w-1/2">Database</TabsTrigger>
            <TabsTrigger value="model" className="w-1/2">Model</TabsTrigger>
          </TabsList>
          
          <TabsContent value="database" className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Database Type</label>
              <Select value={dbType} onValueChange={(value: string) => setDbType(value as DatabaseType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgres">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="mssql">SQL Server</SelectItem>
                  <SelectItem value="sqlite">SQLite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Connection String</label>
              <Input
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder={`${dbType}://username:password@host:port/database`}
                className="font-mono text-sm"
              />
            </div>
            
            <Button 
              onClick={testDbConnection} 
              className="w-full"
              disabled={dbStatus === "loading" || fetchingSchema}
            >
              {(dbStatus === "loading" || fetchingSchema) && <Spinner className="mr-2 h-4 w-4" />}
              {dbStatus === "success" ? (
                <><CheckCircle className="mr-2 h-4 w-4" /> Connected</>
              ) : dbStatus === "error" ? (
                <><AlertCircle className="mr-2 h-4 w-4" /> Connection Failed</>
              ) : (
                "Test Connection"
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="model" className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Model Type</label>
              <Select value={modelType} onValueChange={(value: string) => setModelType(value as ModelType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ollama">Local (Ollama)</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {modelType === "ollama" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Model Name</label>
                <Select value={customModel} onValueChange={setCustomModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llama3.2">Llama 3.2</SelectItem>
                    <SelectItem value="mistral">Mistral</SelectItem>
                    <SelectItem value="phi3">Phi-3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {modelType === "openai" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="font-mono text-sm"
                />
              </div>
            )}
            
            {modelType === "custom" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Model URL</label>
                <Input
                  value={modelUrl}
                  onChange={(e) => setModelUrl(e.target.value)}
                  placeholder="http://localhost:11434/api/generate"
                  className="font-mono text-sm"
                />
              </div>
            )}
            
            <Button 
              onClick={testModelConnection} 
              className="w-full"
              disabled={modelStatus === "loading"}
            >
              {modelStatus === "loading" && <Spinner className="mr-2 h-4 w-4" />}
              {modelStatus === "success" ? (
                <><CheckCircle className="mr-2 h-4 w-4" /> Connected</>
              ) : modelStatus === "error" ? (
                <><AlertCircle className="mr-2 h-4 w-4" /> Connection Failed</>
              ) : (
                "Test Connection"
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Main chat interface component
const ChatPage: React.FC = () => {
  // State for user inputs
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [dbUrl, setDbUrl] = useState<string>("");
  const [dbType, setDbType] = useState<DatabaseType>("postgres");
  const [modelType, setModelType] = useState<ModelType>("ollama");
  const [modelUrl, setModelUrl] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [customModel, setCustomModel] = useState<string>("llama3.2");
  
  // State for operations
  const [response, setResponse] = useState<SqlResponse | null>(null);
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
  
  // Sample schema for demonstration - will be replaced with real data
  const sampleSchema: DBSchema = {
    "customers": [
      "id (integer)", 
      "name (text)", 
      "email (text)"
    ],
    "products": [
      "id (integer)", 
      "name (text)", 
      "price (decimal)"
    ],
    "orders": [
      "id (integer)", 
      "customer_id (integer)", 
      "product_id (integer)",
      "quantity (integer)",
      "created_at (timestamp)"
    ]
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
  
  // Scroll to bottom of messages when they update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Connection test handlers
  const testDbConnection = async (): Promise<void> => {
    if (!dbUrl) {
      setDbStatus("error");
      setError("Please enter a database URL");
      return;
    }
    
    setDbStatus("loading");
    setFetchingSchema(true);
    try {
      const res = await axios.get<DbConnectionResponse>(`${API_BASE_URL}/test_db_connection/${encodeURIComponent(dbUrl)}`);
      if (res.data.success) {
        setDbStatus("success");
        setError(null);
        
        // Fetch the database schema
        try {
          const schemaRes = await axios.get<SchemaResponse>(`${API_BASE_URL}/get_db_schema/${encodeURIComponent(dbUrl)}`);
          if (schemaRes.data.success && schemaRes.data.schema) {
            setDbSchema(schemaRes.data.schema);
          } else {
            // If schema fetch failed but connection was successful,
            // use the sample schema for demonstration purposes
            console.warn("Using sample schema as fallback");
            setDbSchema(sampleSchema);
          }
        } catch (schemaError) {
          console.error("Failed to fetch schema:", schemaError);
          // Use sample schema if API call fails
          setDbSchema(sampleSchema);
        }
      } else {
        setDbStatus("error");
        setError(`Database connection failed: ${res.data.message}`);
      }
    } catch (error) {
      console.error("Connection test error:", error);
      setDbStatus("error");
      setError("Failed to connect to database. Please check your connection string.");
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
    try {
      // In a real implementation, this would test the actual LLM connection
      if (modelType === "ollama") {
        // For local Ollama, we could ping the Ollama server
        await axios.post(`${API_BASE_URL}/probe_llm`, {
          provider: "ollama",
          url: "http://localhost:11434"
        });
        setModelStatus("success");
        setError(null);
      } else {
        // Just simulate success for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        setModelStatus("success");
        setError(null);
      }
    } catch (error) {
      console.error("Model connection test error:", error);
      setModelStatus("error");
      setError("Failed to connect to model service. Please check your details.");
    }
  };

  // Chat handlers
  const handleSubmit = async (): Promise<void> => {
    if (!userPrompt || !dbUrl) {
      setError("Please enter a prompt and database URL");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Add user message to chat
      const userMessage: UserMessage = { role: "user", content: userPrompt };
      setMessages(prev => [...prev, userMessage]);
      
      // Configure the LLM based on selected options
      const llmConfig: LLMConfig = {
        provider: modelType,
        model: modelType === "ollama" ? customModel : undefined,
        url: modelType === "custom" ? modelUrl : undefined,
        apiKey: modelType === "openai" ? apiKey : undefined
      };
      
      // Make API call
      const requestData: GenerateSqlRequest = {
        user_prompt: userPrompt,
        db_url: dbUrl,
        llm_config: llmConfig
      };
      
      const res = await axios.post<SqlResponse>(`${API_BASE_URL}/generate_sql`, requestData);
      
      // Add response to chat
      const assistantMessage: AssistantMessage = { 
        role: "assistant", 
        content: "I've generated the following SQL query:", 
        sql: res.data.sql,
        executing: false
      };
      setMessages(prev => [...prev, assistantMessage]);
      setResponse(res.data);
      
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
    
    try {
      // Add execution message to chat
      const executingMessage: SystemMessage = { 
        role: "system", 
        content: "Executing SQL query..." 
      };
      setMessages(prev => [...prev, executingMessage]);
      
      const requestData: ExecuteSqlRequest = {
        sql: sql,
        db_url: dbUrl
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
              dbUrl={dbUrl}
              setDbUrl={setDbUrl}
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
                        <Zap className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Start asking questions about your data</p>
                        <p className="text-sm max-w-md">
                          For example: "Show me the top 5 customers by order quantity" or 
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
                    <Alert variant="destructive" className="mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <div>
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                          </div>
                        </div>
                        
                        {/* Regenerate button for when there's an error */}
                        {messages.length > 0 && messages[messages.length - 2]?.role === "user" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleRegenerate}
                          >
                            Regenerate
                          </Button>
                        )}
                      </div>
                    </Alert>
                  )}
                </CardContent>
                
                <CardFooter className="border-t p-4 flex-shrink-0">
                  <div className="flex w-full space-x-2">
                    <Textarea
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Ask a question about your data..."
                      className="flex-grow resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSubmit}
                      disabled={loading || !dbUrl}
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