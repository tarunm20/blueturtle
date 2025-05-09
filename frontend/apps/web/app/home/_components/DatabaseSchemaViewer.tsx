// frontend/apps/web/app/home/_components/DatabaseSchemaViewer.tsx

import { 
  Card, CardContent, CardHeader, CardTitle 
} from "@kit/ui/card";
import { Button } from "@kit/ui/button";
import { Badge } from "@kit/ui/badge";
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@kit/ui/accordion";
import { Database, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@kit/ui/input";
import { DBSchema } from "../types";

interface DatabaseSchemaViewerProps {
  schema: DBSchema;
  isMinimized: boolean;
  toggleMinimize: () => void;
}

export const DatabaseSchemaViewer: React.FC<DatabaseSchemaViewerProps> = ({ 
  schema, 
  isMinimized, 
  toggleMinimize 
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  if (!schema) return null;
  
  // Filter tables based on search term
  const filteredTables = Object.entries(schema).filter(([tableName]) => 
    tableName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Function to get icon based on column name/type
  const getColumnIcon = (columnName: string, index: number) => {
    if (columnName.toLowerCase().includes("id") && index === 0) return "🔑";
    if (columnName.toLowerCase().includes("_id")) return "🔗";
    if (columnName.toLowerCase().includes("name")) return "📝";
    if (columnName.toLowerCase().includes("date")) return "🗓️";
    if (columnName.toLowerCase().includes("time")) return "⏱️";
    if (columnName.toLowerCase().includes("price") || columnName.toLowerCase().includes("cost")) return "💲";
    if (columnName.toLowerCase().includes("email")) return "📧";
    if (columnName.toLowerCase().includes("phone")) return "📱";
    if (columnName.toLowerCase().includes("address")) return "🏠";
    if (columnName.toLowerCase().includes("status")) return "📊";
    return "";
  };
  
  // Safe check for array and its properties
  const isValidArray = (arr: any): arr is any[] => 
    Array.isArray(arr) && arr.length > 0;
  
  // Extract column name from format "column_name (data_type)"
  const extractColumnName = (columnString: string): string => {
    if (!columnString) return "";
    const match = columnString.match(/(.+?)(\s*\(.*\))?$/);
    return match?.[1]?.trim() || columnString;
  };
  
  return (
    <Card className="border-primary/10 shadow-sm h-full">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-background flex flex-row justify-between items-center py-2 px-3">
        <div className="flex items-center">
          <div className="bg-primary/10 p-1 rounded-md mr-2">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-sm">Database Schema</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleMinimize} className="h-7 w-7 p-0">
          {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="p-2">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          
          <div className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            <Accordion type="multiple" className="w-full">
              {filteredTables.map(([tableName, columns], tableIndex) => (
                <AccordionItem 
                  key={tableIndex} 
                  value={`table-${tableIndex}`} 
                  className="border-b-0 mb-1"
                >
                  <AccordionTrigger 
                    className="bg-muted/30 hover:bg-muted/40 px-2 py-1 rounded-sm text-xs font-medium border border-muted transition-all"
                  >
                    <div className="flex items-center space-x-1.5 truncate max-w-[90%]">
                      <span className="text-primary bg-primary/10 p-0.5 rounded flex-shrink-0">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </span>
                      <span className="truncate">{tableName}</span>
                      <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1">
                        {isValidArray(columns) ? columns.length : 0}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="border border-t-0 rounded-b-sm border-muted bg-background/50 pt-1 pb-0.5 px-1">
                    <div className="space-y-0.5 text-xs">
                      {isValidArray(columns) && columns.map((column, i) => {
                        if (typeof column !== 'string') return null;
                        
                        const isPrimaryKey = column.toLowerCase().includes("id") && i === 0;
                        const isForeignKey = column.toLowerCase().includes("_id") && !isPrimaryKey;
                        
                        // Extract column name and type
                        const match = column.match(/(.+?)(\(.+\))?$/);
                        const columnName = match?.[1]?.trim() || column;
                        const columnType = match?.[2] || "";
                        
                        return (
                          <div 
                            key={i} 
                            className={`px-1.5 py-1 rounded flex items-center ${
                              isPrimaryKey 
                                ? "bg-primary/5 border-l-2 border-l-primary" 
                                : isForeignKey 
                                  ? "bg-secondary/5 border-l-2 border-l-secondary" 
                                  : "hover:bg-muted/20"
                            }`}
                          >
                            <span className={`mr-1.5 w-4 text-center ${
                              isPrimaryKey 
                                ? "text-primary" 
                                : isForeignKey 
                                  ? "text-secondary" 
                                  : "text-muted-foreground"
                            }`}>
                              {isPrimaryKey ? "🔑" : (isForeignKey ? "🔗" : getColumnIcon(columnName, i))}
                            </span>
                            <span className="truncate font-mono text-[10px]">{columnName}</span>
                            {columnType && (
                              <span className="ml-1 text-[10px] text-muted-foreground">{columnType}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {filteredTables.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-xs">
                No tables found matching "{searchTerm}"
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};