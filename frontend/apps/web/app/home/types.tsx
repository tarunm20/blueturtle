// types.ts - Type definitions for the chat application

export type DatabaseType = "postgres" | "mysql" | "mssql" | "sqlite";
export type ModelType = "ollama" | "openai" | "custom";
export type ConnectionStatus = "success" | "error" | "loading" | null;

// Schema representation
export interface DBSchema {
  [tableName: string]: string[];
}

// Message types
export interface BaseMessage {
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
}

export type ChatMessage = UserMessage | AssistantMessage | SystemMessage;

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
  model: string | undefined;
  url: string | undefined;
  apiKey: string | undefined;
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