// frontend/apps/web/app/home/types.ts
export type DatabaseType = "postgres" | "mysql" | "mssql" | "sqlite";
export type ModelType = "ollama" | "openai" | "custom";
export type ConnectionStatus = "success" | "error" | "loading" | null;
export type ChartType = "bar" | "line" | "pie" | "table";

// Schema representation
export interface DBSchema {
  [tableName: string]: string[];
}

// Visualization recommendation
export interface VisualizationRecommendation {
  visualization: boolean;
  chartType?: ChartType;
  xAxis?: string;
  yAxis?: string;
  title?: string;
  explanation?: string;
}


// Message types
export interface BaseMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export interface UserMessage extends BaseMessage {
  role: "user";
}

export interface AssistantMessage extends BaseMessage {
  role: "assistant";
  sql?: string;
  executing?: boolean;
}

export interface SystemMessage extends BaseMessage {
  role: "system";
  results?: QueryResult;
  visualization?: VisualizationRecommendation;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sql?: string;
  results?: {
    columns: string[];
    rows: any[][];
  };
  visualization?: VisualizationRecommendation;
  executing?: boolean;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
}

export interface SqlResponse {
  sql: string;
}

export interface SchemaResponse {
  success: boolean;
  schema?: DBSchema;
  message?: string;
}

export interface DbConnectionRequest {
  db_type: DatabaseType;
  db_host?: string;
  db_port?: string;
  db_name: string;
  db_user?: string; 
  db_password?: string;
}

export interface DbConnectionResponse {
  success: boolean;
  message: string;
}

export interface LLMConfig {
  provider: ModelType;
  model?: string;
  url?: string;
  apiKey?: string;
}

export interface GenerateSqlRequest {
  user_prompt: string;
  db_connection: DbConnectionRequest;
  llm_config: LLMConfig;
}

export interface ExecuteSqlRequest {
  sql: string;
  db_connection: DbConnectionRequest;
}

