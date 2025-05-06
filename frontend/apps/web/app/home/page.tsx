'use client';
import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { PageBody, PageHeader } from '@kit/ui/page';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  DatabaseType, 
  ModelType, 
  ConnectionStatus, 
  DBSchema 
} from './types';

// Import our components
import { ChatSessionManager } from './ChatSessionManager';
import { ConfigSidebar } from './_components/ConfigSidebar';
import { DatabaseSchemaViewer } from './_components/DatabaseSchemaViewer';
import { useChatSessions } from '../hooks/use-chat-sessions';

export default function HomePage() {
  // Database connection state
  const [dbType, setDbType] = useState<DatabaseType>('postgres');
  const [dbHost, setDbHost] = useState<string>('localhost');
  const [dbPort, setDbPort] = useState<string>('5432');
  const [dbName, setDbName] = useState<string>('');
  const [dbUser, setDbUser] = useState<string>('');
  const [dbPassword, setDbPassword] = useState<string>('');
  
  // LLM state
  const [modelType, setModelType] = useState<ModelType>('ollama');
  const [modelUrl, setModelUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [customModel, setCustomModel] = useState<string>('llama3.2');
  
  // Connection state
  const [dbStatus, setDbStatus] = useState<ConnectionStatus>(null);
  const [modelStatus, setModelStatus] = useState<ConnectionStatus>(null);
  const [dbSchema, setDbSchema] = useState<DBSchema | null>(null);
  const [fetchingSchema, setFetchingSchema] = useState<boolean>(false);
  const [isSchemaMinimized, setIsSchemaMinimized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Test database connection
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
      const dbConnectionRequest = {
        db_type: dbType,
        db_host: dbType !== "sqlite" ? dbHost : undefined,
        db_port: dbType !== "sqlite" && dbPort ? dbPort : undefined,
        db_name: dbName,
        db_user: dbType !== "sqlite" ? dbUser : undefined,
        db_password: dbType !== "sqlite" ? dbPassword : undefined
      };
      
      // Test connection
      const res = await fetch('http://localhost:8000/test_db_connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbConnectionRequest)
      });
      
      const data = await res.json();
      
      if (data?.success) {
        setDbStatus("success");
        
        // Fetch the database schema
        try {
          const schemaRes = await fetch('http://localhost:8000/get_db_schema', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbConnectionRequest)
          });
          
          const schemaData = await schemaRes.json();
          
          if (schemaData?.success && schemaData?.schema) {
            setDbSchema(schemaData.schema);
          } else {
            setError("Connected to database but failed to retrieve schema");
          }
        } catch (schemaError) {
          console.error("Failed to fetch schema:", schemaError);
          setError("Connected to database but failed to retrieve schema");
        }
      } else {
        setDbStatus("error");
        setError(`Database connection failed: ${data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Connection test error:", error);
      setDbStatus("error");
      setError("Failed to connect to database. Please check your connection details.");
    } finally {
      setFetchingSchema(false);
    }
  };
  
  // Test model connection
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
        const response = await fetch("http://localhost:8000/probe_llm", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: "ollama",
            url: "http://localhost:11434"
          })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
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
  
  // Get current database connection config
  const getCurrentDbConfig = () => {
    return {
      db_type: dbType,
      db_host: dbType !== "sqlite" ? dbHost : undefined,
      db_port: dbType !== "sqlite" && dbPort ? dbPort : undefined,
      db_name: dbName,
      db_user: dbType !== "sqlite" ? dbUser : undefined,
      db_password: dbType !== "sqlite" ? dbPassword : undefined
    };
  };
  
  // Get current LLM config
  const getCurrentLlmConfig = () => {
    return {
      provider: modelType,
      model: modelType === "ollama" ? customModel : undefined,
      url: modelType === "custom" ? modelUrl : undefined,
      apiKey: modelType === "openai" ? apiKey : undefined
    };
  };

  return (
    <>
      <PageHeader description={'Chat with your database'} />
      <PageBody className="h-[calc(100vh-180px)]">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Configuration sidebar */}
          <div className="col-span-3">
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
            
            {/* Error display */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Connection status indicators */}
            {dbStatus === "success" && (
              <Alert variant="default" className="mt-4 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Database Connected</AlertTitle>
                <AlertDescription>Ready to chat with your database</AlertDescription>
              </Alert>
            )}
            
            {modelStatus === "success" && (
              <Alert variant="default" className="mt-4 bg-blue-50 dark:bg-blue-900/20">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <AlertTitle>Model Connected</AlertTitle>
                <AlertDescription>Ready to generate SQL</AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Main content area */}
          <div className="col-span-9 flex flex-col space-y-4">
            {/* Schema viewer (when connected) */}
            {dbStatus === "success" && dbSchema && (
              <DatabaseSchemaViewer 
                schema={dbSchema} 
                isMinimized={isSchemaMinimized}
                toggleMinimize={() => setIsSchemaMinimized(!isSchemaMinimized)}
              />
            )}
            
            {/* Chat interface (enabled only when database is connected) */}
            {dbStatus === "success" ? (
              <div className="flex-grow">
                <ChatSessionManager 
                  dbConfig={getCurrentDbConfig()}
                  llmConfig={getCurrentLlmConfig()}
                />
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center border rounded-lg p-8 bg-muted/10">
                <div className="text-center">
                  <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Connect to your database</h3>
                  <p className="text-muted-foreground mb-4">
                    Use the sidebar to connect to your database before starting a chat.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
}