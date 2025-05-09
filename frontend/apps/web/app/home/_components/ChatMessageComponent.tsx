<<<<<<< HEAD
// frontend/apps/web/app/home/_components/ChatMessageComponent.tsx

=======
import { useState } from "react";
>>>>>>> dev
import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Spinner } from "@kit/ui/spinner";
import { Copy, Info, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { ChatMessage } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

interface ChatMessageProps {
  message: ChatMessage;
<<<<<<< HEAD
  previousMessage?: ChatMessage;
  onExecuteSQL?: (sql: string) => Promise<void>; // Make it optional
=======
  onExecuteSQL: (sql: string, messageId?: string) => Promise<void>;
  onRequestVisualization?: (message: ChatMessage) => Promise<void>;
>>>>>>> dev
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ 
  message, 
<<<<<<< HEAD
  previousMessage,
  onExecuteSQL = () => Promise.resolve() // Default empty function
}) => {
  const shouldGroup = previousMessage?.role === message.role;
=======
  onExecuteSQL,
  onRequestVisualization
}) => {
  const [isRequestingViz, setIsRequestingViz] = useState(false);
  const [showVisualization, setShowVisualization] = useState(true);
>>>>>>> dev
  
  const bgColorClass = message.role === "user" 
    ? "bg-primary/10" 
    : message.role === "assistant" 
      ? "bg-secondary/10" 
      : "bg-muted";
      
  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text)
      .catch((error) => console.error('Failed to copy text: ', error));
  };
  
  const handleVisualizationRequest = async () => {
    if (onRequestVisualization && !isRequestingViz) {
      setIsRequestingViz(true);
      await onRequestVisualization(message);
      setIsRequestingViz(false);
    }
  };
  
  
  return (
    <div className={`p-4 rounded-lg mb-4 ${bgColorClass} ${shouldGroup ? 'mt-1' : 'mt-4'}`}>
      {!shouldGroup && message.role === "user" && (
        <div className="flex items-start">
          <Badge variant="outline" className="mr-2 mt-1">You</Badge>
          <p>{message.content}</p>
        </div>
      )}
      
      {!shouldGroup && message.role === "assistant" && (
        <div className="flex flex-col space-y-2">
          <div className="flex items-start">
            <Badge variant="outline" className="mr-2 mt-1">Assistant</Badge>
            <p>{message.content}</p>
          </div>
          
          {message.sql && (
            <div className="mt-2 p-3 bg-muted/80 dark:bg-gray-800 text-foreground dark:text-gray-100 rounded font-mono text-sm overflow-x-auto border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground dark:text-gray-400">SQL Query</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => copyToClipboard(message.sql || "")}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <pre>{message.sql}</pre>
              {message.executing && (
                <div className="mt-2 flex items-center text-muted-foreground dark:text-gray-400">
                  <Spinner className="mr-2 h-4 w-4" />
                  <span>Executing query...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {shouldGroup && (
        <div className="pl-8">
          <p>{message.content}</p>
          
          {message.role === "assistant" && message.sql && (
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
<<<<<<< HEAD
              {message.executing && (
                <div className="mt-2 flex items-center text-gray-400">
                  <Spinner className="mr-2 h-4 w-4" />
                  <span>Executing query...</span>
                </div>
              )}
=======
              <div className="mt-2">
              <Button 
                size="sm" 
                onClick={() => onExecuteSQL(message.sql || "", message.id)}
                disabled={message.executing}
                className="mt-2"
              >
                {message.executing ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Execute Query
              </Button>
              </div>
>>>>>>> dev
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
          <div className="font-semibold mb-2 flex items-center justify-between">
            <div>
              <Info className="h-4 w-4 mr-2 inline" /> 
              Query Results:
            </div>
        
          </div>
          
          {/* Display results table */}
          {message.results.rows && message.results.rows.length > 0 ? (
            <table className="min-w-full bg-card border border-border rounded overflow-hidden">
              <thead className="bg-muted">
                <tr>
                  {message.results.columns.map((column: string, i: number) => (
                    <th key={i} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {message.results.rows.map((row: any[], rowIndex: number) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    {row.map((cell: any, cellIndex: number) => (
                      <td key={cellIndex} className="px-4 py-2 text-sm">
                        {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">No results found</p>
          )}

        </div>
      )}
    </div>
  );
};