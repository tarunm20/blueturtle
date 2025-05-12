// Simplified version for your ConfigSidebar.tsx

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kit/ui/card";
import { Button } from "@kit/ui/button";
import { Input } from "@kit/ui/input";
import { Spinner } from "@kit/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kit/ui/select";
import { Checkbox } from "@kit/ui/checkbox";
import { Label } from "@kit/ui/label";
import { Database, AlertCircle, CheckCircle, LockKeyhole, Lock } from "lucide-react";
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
  onSampleDbConnect?: () => void;
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
  fetchingSchema,
  onSampleDbConnect
}) => {
  // Default ports for different database types
  const getDefaultPort = () => {
    switch(dbType) {
      case "postgres": return "5432";
      case "mysql": return "3306";
      case "mssql": return "1433";
      default: return "";
    }
  };

  // Function to check if form is valid
  const isFormValid = () => {
    if (dbType === "sqlite") {
      return dbName.trim() !== "";
    }
    
    return dbHost.trim() !== "" && 
           dbName.trim() !== "" && 
           dbUser.trim() !== "";
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
            {/* Sample DB button - calls parent component's handler if provided */}
          <Button 
            onClick={() => {
              console.log("Sample DB button clicked");
              setDbType("postgres");
              setDbHost("aws-0-us-east-2.pooler.supabase.com");
              setDbPort("6543");
              setDbName("postgres");
              setDbUser("postgres.wpwdzcrofuexfrvqhwox");
              setDbPassword("blueturtlesample123");
              console.log("Fields filled directly from ConfigSidebar");
            }} 
            className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Database className="mr-2 h-4 w-4" />
            Sample Database
          </Button>

            
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