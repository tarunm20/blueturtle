'use client';
import { useState, useEffect } from 'react';
import { Database, Menu, MessageSquare } from 'lucide-react';
import { PageHeader } from '@kit/ui/page';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@kit/ui/button';
import { 
  DatabaseType, 
  ModelType, 
  ConnectionStatus, 
  DBSchema 
} from './types';

// Import our components
import { ChatInterface } from './ChatInterface';
import { ConfigSidebar } from './_components/ConfigSidebar';
import { DatabaseSchemaViewer } from './_components/DatabaseSchemaViewer';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

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
  
  // UI state
  const [showMobileConfig, setShowMobileConfig] = useState<boolean>(false);
  const [showMobileSessions, setShowMobileSessions] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const supabase = useSupabase();
  
  // Use useEffect to check if we're on mobile - fixes "window is not defined" error
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Load chat sessions
  useEffect(() => {
    async function loadSessions() {
      try {
        const { data: sessions, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .order('updated_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching sessions:', error);
          return;
        }
        
        setSessions(sessions || []);
        
        // Set active session to the first one if we have sessions
        if (sessions?.length > 0) {
          setActiveSessionId(sessions[0]?.id || '');
        } else {
          // Create a default session if none exist
          createSession();
        }
      } catch (err) {
        console.error('Error in loadSessions:', err);
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
        setSessions(prev => [data, ...prev]);
        setActiveSessionId(data.id);
        // Close mobile session sidebar after creating a new session
        setShowMobileSessions(false);
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
            // Close mobile menu on successful connection
            setShowMobileConfig(false);
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
    <div className="flex flex-col h-screen overflow-hidden">
      <PageHeader 
        description={'Chat with your database'} 
        className="md:px-4 px-2 flex items-center justify-between"
      >
        <div className="md:hidden flex space-x-2">
          <button 
            onClick={() => setShowMobileConfig(!showMobileConfig)}
            className="p-2 rounded-md border border-muted-foreground/20 hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setShowMobileSessions(!showMobileSessions)}
            className="p-2 rounded-md border border-muted-foreground/20 hover:bg-muted transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        </div>
      </PageHeader>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile configuration drawer */}
        <div 
          className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden ${
            showMobileConfig ? 'block' : 'hidden'
          }`}
          onClick={() => setShowMobileConfig(false)}
        >
          <div 
            className="h-full w-[85%] max-w-sm bg-background border-r shadow-lg p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium">Configuration</h2>
              <button 
                onClick={() => setShowMobileConfig(false)}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                ✕
              </button>
            </div>
            
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
            
            {/* Mobile status indicators */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="break-words">{error}</AlertDescription>
              </Alert>
            )}
            
            {dbStatus === "success" && (
              <Alert variant="default" className="mt-4 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Database Connected</AlertTitle>
              </Alert>
            )}
          </div>
        </div>
        
        {/* Mobile sessions drawer */}
        <div 
          className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden ${
            showMobileSessions ? 'block' : 'hidden'
          }`}
          onClick={() => setShowMobileSessions(false)}
        >
          <div 
            className="h-full w-[85%] max-w-sm ml-auto bg-background border-l shadow-lg p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium">Chat Sessions</h2>
              <button 
                onClick={() => setShowMobileSessions(false)}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                ✕
              </button>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mb-4"
              onClick={createSession}
            >
              <span className="mx-auto">New Chat</span>
            </Button>
            
            <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-150px)]">
              {sessions.map(session => (
                <div 
                  key={session?.id}
                  className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                    session?.id === activeSessionId ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                  onClick={() => {
                    setActiveSessionId(session?.id);
                    setShowMobileSessions(false);
                  }}
                >
                  <div className="truncate">{session?.title || 'Untitled'}</div>
                  
                  {sessions?.length > 1 && (
                    <button 
                      className="ml-2 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session?.id);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main layout - 3 columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left column - Connection Config */}
          <div className="hidden md:block w-60 border-r overflow-y-auto">
            <div className="sticky top-0 p-2">
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
              
              {/* Error and status alerts */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription className="break-words">{error}</AlertDescription>
                </Alert>
              )}
              
              {dbStatus === "success" && (
                <Alert variant="default" className="mt-4 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Database Connected</AlertTitle>
                </Alert>
              )}
              
              {modelStatus === "success" && (
                <Alert variant="default" className="mt-4 bg-blue-50 dark:bg-blue-900/20">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle>Model Connected</AlertTitle>
                </Alert>
              )}
            </div>
          </div>
          
          {/* Middle column - Sessions list */}
          <div className="hidden md:flex md:flex-col w-60 border-r overflow-hidden">
            <div className="p-2 border-b">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={createSession}
              >
                <span className="mx-auto">New Chat</span>
              </Button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              {sessions.map(session => (
                <div 
                  key={session?.id}
                  className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                    session?.id === activeSessionId ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                  onClick={() => setActiveSessionId(session?.id)}
                >
                  <div className="truncate">{session?.title || 'Untitled'}</div>
                  
                  {sessions?.length > 1 && (
                    <button 
                      className="ml-2 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session?.id);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Two-pane layout for chat and DB schema */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main chat area */}
            <div className="flex-1 max-w-2xl mx-auto overflow-y-auto">
              {dbStatus === "success" && activeSessionId ? (
                <div className="h-full">
                  <ChatInterface 
                    sessionId={activeSessionId} 
                    dbConfig={getCurrentDbConfig()}
                    llmConfig={getCurrentLlmConfig()}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Connect to your database</h3>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      {isMobile ? 
                        "Tap the menu icon in the top-left to connect to your database." :
                        "Use the sidebar to connect to your database before starting a chat."
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right pane - DB Schema (fixed width) */}
            {dbStatus === "success" && dbSchema && (
              <div className="hidden lg:block w-80 border-l overflow-y-auto">
                <div className="p-2 h-full overflow-y-auto">
                  <DatabaseSchemaViewer 
                    schema={dbSchema} 
                    isMinimized={isSchemaMinimized}
                    toggleMinimize={() => setIsSchemaMinimized(!isSchemaMinimized)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}