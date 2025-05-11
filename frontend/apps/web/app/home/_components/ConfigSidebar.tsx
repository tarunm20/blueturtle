// ConfigSidebar.tsx - Updated with Sample DB button and URI support
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kit/ui/card";
import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import { Spinner } from "@kit/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kit/ui/select";
import { Checkbox } from "@kit/ui/checkbox";
import { Label } from "@kit/ui/label";
import { Database, AlertCircle, CheckCircle, LockKeyhole, Lock, ExternalLink } from "lucide-react";
import { DatabaseType, ModelType, ConnectionStatus } from "../types";

interface ConfigSidebarProps {
  dbType: DatabaseType;
  setDbType: (type: DatabaseType) => void;
  dbHost: string;
  setDbHost: (host: string) => void;
  dbPort: string;
  setDbPort: (port: string) => void;
  dbName: string;
  setDbName: (name: string) => void;
  dbUser: string;
  setDbUser: (user: string) => void;
  dbPassword: string;
  setDbPassword: (password: string) => void;
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
  connectionUri: string;
  setConnectionUri: (uri: string) => void;
}

export const ConfigSidebar: React.FC<ConfigSidebarProps> = ({ 
  dbType, setDbType, 
  dbHost, setDbHost,
  dbPort, setDbPort,
  dbName, setDbName,
  dbUser, setDbUser,
  dbPassword, setDbPassword,
  modelType, setModelType, 
  modelUrl, setModelUrl, 
  apiKey, setApiKey, 
  customModel, setCustomModel,
  dbStatus, modelStatus,
  testDbConnection, testModelConnection,
  fetchingSchema
}) => {
  // Add state for URI input
  const [useConnectionUri, setUseConnectionUri] = useState<boolean>(false);
  const [connectionUri, setConnectionUri] = useState<string>("");

  // Default ports for different database types
  const getDefaultPort = () => {
    switch(dbType) {
      case "postgres": return "5432";
      case "mysql": return "3306";
      case "mssql": return "1433";
      case "sqlite": return "";
      default: return "";
    }
  };

  // Function to check if form is valid
  const isFormValid = () => {
    if (useConnectionUri) {
      return connectionUri.trim() !== "";
    }
    
    if (dbType === "sqlite") {
      return dbName.trim() !== "";
    }
    
    return dbHost.trim() !== "" && 
           dbName.trim() !== "" && 
           dbUser.trim() !== "";
  };

  // Sample database connection function
  const connectToSampleDb = () => {
    // Set values for the sample database in Supabase
    setUseConnectionUri(true);
    
    // Use a connection string with the demo credentials
    // Format: postgres://username:password@host:port/database
    setConnectionUri("postgresql://demo_user:demo_password@db.wpwdzcrofuexfrvqhwox.supabase.co:5432/postgres");
    
    // Then test the connection
    setTimeout(testDbConnection, 100); // Small delay to ensure state updates
  };

  // Function to parse URI and set individual fields
  const parseConnectionUri = () => {
    if (!connectionUri) return;
    
    try {
      // Parse the connection URI
      const url = new URL(connectionUri);
      
      // Extract protocol (database type)
      const protocol = url.protocol.replace(':', '');
      if (protocol === 'postgres' || protocol === 'postgresql') {
        setDbType('postgres');
      } else if (protocol === 'mysql') {
        setDbType('mysql');
      } else if (protocol === 'mssql') {
        setDbType('mssql');
      } else if (protocol === 'sqlite') {
        setDbType('sqlite');
      }
      
      // Extract hostname
      setDbHost(url.hostname);
      
      // Extract port
      if (url.port) {
        setDbPort(url.port);
      } else {
        setDbPort(getDefaultPort());
      }
      
      // Extract database name (pathname without leading slash)
      setDbName(url.pathname.replace(/^\//, ''));
      
      // Extract username and password
      if (url.username) {
        setDbUser(decodeURIComponent(url.username));
      }
      
      if (url.password) {
        setDbPassword(decodeURIComponent(url.password));
      }
      
      // Switch to individual fields mode
      setUseConnectionUri(false);
    } catch (error) {
      console.error("Error parsing connection URI:", error);
    }
  };

  // Function to build connection URI from individual fields
  const buildConnectionUri = () => {
    if (dbType === "sqlite") {
      setConnectionUri(`sqlite://${dbName}`);
    } else {
      const auth = dbUser ? 
        `${encodeURIComponent(dbUser)}${dbPassword ? `:${encodeURIComponent(dbPassword)}` : ''}@` : 
        '';
      
      const port = dbPort ? `:${dbPort}` : '';
      
      setConnectionUri(`${dbType}://${auth}${dbHost}${port}/${dbName}`);
    }
    
    // Switch to URI mode
    setUseConnectionUri(true);
  };

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
            <TabsTrigger value="model" className="w-1/2 opacity-50 cursor-not-allowed">
              <Lock className="h-3 w-3 mr-1" />
              Model
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="database" className="space-y-4 pt-4">
            {/* Quick connect button for sample database */}
            <Button 
              onClick={connectToSampleDb} 
              className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Database className="mr-2 h-4 w-4" />
              Sample Database
            </Button>
            
            {/* Toggle between connection URI and individual fields */}
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="useConnectionUri" 
                checked={useConnectionUri}
                onCheckedChange={(checked) => {
                  if (checked === true) {
                    buildConnectionUri();
                  } else if (checked === false) {
                    parseConnectionUri();
                  }
                }}
              />
              <Label 
                htmlFor="useConnectionUri" 
                className="text-sm cursor-pointer"
              >
                Use connection URI string
              </Label>
            </div>
            
            {useConnectionUri ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Connection URI</label>
                <Input
                  value={connectionUri}
                  onChange={(e) => setConnectionUri(e.target.value)}
                  placeholder="postgres://username:password@host:port/database"
                />
                <p className="text-xs text-muted-foreground">
                  Example: postgres://user:pass@localhost:5432/mydb
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Database Type</label>
                  <Select value={dbType} onValueChange={(value: string) => {
                    setDbType(value as DatabaseType);
                    setDbPort(value === "sqlite" ? "" : getDefaultPort());
                  }}>
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
                
                {dbType !== "sqlite" ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Host</label>
                      <Input
                        value={dbHost}
                        onChange={(e) => setDbHost(e.target.value)}
                        placeholder="localhost or IP address"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Port</label>
                      <Input
                        value={dbPort}
                        onChange={(e) => setDbPort(e.target.value)}
                        placeholder={getDefaultPort()}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Database Name</label>
                      <Input
                        value={dbName}
                        onChange={(e) => setDbName(e.target.value)}
                        placeholder="database_name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        value={dbUser}
                        onChange={(e) => setDbUser(e.target.value)}
                        placeholder="username"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Password</label>
                      <Input
                        type="password"
                        value={dbPassword}
                        onChange={(e) => setDbPassword(e.target.value)}
                        placeholder="password"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Database File Path</label>
                    <Input
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      placeholder="/path/to/database.db"
                    />
                  </div>
                )}
              </>
            )}
            
            <Button 
              onClick={testDbConnection} 
              className="w-full"
              disabled={dbStatus === "loading" || fetchingSchema || !isFormValid()}
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
            
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <LockKeyhole className="h-3 w-3" />
                <span>Your credentials are sent securely to our backend and never stored.</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="model" className="space-y-4 pt-4">
            {/* Disabled Model Section */}
            <div className="border border-muted rounded-md p-4 bg-muted/30 opacity-50">
              <div className="flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-center font-medium text-muted-foreground mb-2">
                Model Configuration Locked
              </h3>
              <p className="text-sm text-center text-muted-foreground">
                The model configuration is currently locked by the administrator.
                A default configuration is automatically used for all queries.
              </p>
              
              {/* Display current model configuration (read-only) */}
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model Type:</span>
                  <span>Claude</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span>Sonnet 3.7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                    Connected
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};