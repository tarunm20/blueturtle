import { useState } from "react";
import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import { Spinner } from "@kit/ui/spinner";
import { Copy, Info, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { ChatMessage } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

interface ChatMessageProps {
  message: ChatMessage;
  onExecuteSQL: (sql: string) => Promise<void>;
  onRequestVisualization?: (message: ChatMessage) => Promise<void>;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({ 
  message, 
  onExecuteSQL,
  onRequestVisualization
}) => {
  const [isRequestingViz, setIsRequestingViz] = useState(false);
  const [showVisualization, setShowVisualization] = useState(true);
  
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
  
  // Function to prepare data for the chart
  const prepareChartData = () => {
    if (!message.results || !message.visualization) return null;
    
    const viz = message.visualization;
    const columns = message.results.columns;
    const rows = message.results.rows;
    
    // Find column indices
    const xIndex = columns.indexOf(viz.xAxis || "");
    const yIndex = columns.indexOf(viz.yAxis || "");
    
    // If we can't find the columns, try to find any text column and number column
    const effectiveXIndex = xIndex !== -1 ? xIndex : 
      columns.findIndex((_, i) => rows.length > 0 && rows[0] && typeof rows[0][i] === 'string');
    
    const effectiveYIndex = yIndex !== -1 ? yIndex : 
      columns.findIndex((_, i) => rows.length > 0 && rows[0] && 
        (typeof rows[0][i] === 'number' || !isNaN(parseFloat(rows[0][i]))));
    
    // If we still don't have valid indices, return null
    if (effectiveXIndex === -1 || effectiveYIndex === -1) return null;
    
    // Extract data
    const labels = rows.map(row => String(row[effectiveXIndex] || ''));
    const data = rows.map(row => {
      const val = row[effectiveYIndex];
      return typeof val === 'number' ? val : 
        typeof val === 'string' ? parseFloat(val) || 0 : 0;
    });
    
    return {
      labels,
      data,
      title: viz.title || `${columns[effectiveYIndex]} by ${columns[effectiveXIndex]}`
    };
  };
  
  // Get chart data
  const chartData = message.visualization ? prepareChartData() : null;
  
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
          <div className="font-semibold mb-2 flex items-center justify-between">
            <div>
              <Info className="h-4 w-4 mr-2 inline" /> 
              Query Results:
            </div>
            
            {/* Add visualization button if results exist and no visualization yet */}
            {!message.visualization && onRequestVisualization && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleVisualizationRequest}
                disabled={isRequestingViz}
              >
                {isRequestingViz ? (
                  <><Spinner className="mr-2 h-3 w-3" /> Analyzing...</>
                ) : (
                  <><BarChart2 className="mr-2 h-3 w-3" /> Visualize</>
                )}
              </Button>
            )}
            
            {/* Toggle visualization if available */}
            {message.visualization && message.visualization.visualization && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowVisualization(!showVisualization)}
              >
                {showVisualization ? (
                  <><ChevronUp className="mr-2 h-3 w-3" /> Hide Chart</>
                ) : (
                  <><ChevronDown className="mr-2 h-3 w-3" /> Show Chart</>
                )}
              </Button>
            )}
          </div>
          
          {/* Display results table */}
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
                        {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
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