// DatabaseSchemaViewer.tsx - Fixed component with better null checks
import { 
    Card, CardContent, CardDescription, CardHeader, CardTitle 
  } from "@kit/ui/card";
  import { Button } from "@kit/ui/button";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@kit/ui/tabs";
  import { Badge } from "@kit/ui/badge";
  import { 
    Accordion, AccordionContent, AccordionItem, AccordionTrigger 
  } from "@kit/ui/accordion";
  import { Database, ChevronDown, ChevronUp } from "lucide-react";
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
    if (!schema) return null;
    
    // Function to get icon based on data type
    const getTypeIcon = (type: string) => {
      if (!type) return '📊';
      if (type.includes('int')) return '🔢';
      if (type.includes('varchar') || type.includes('text')) return '📝';
      if (type.includes('date') || type.includes('time')) return '🗓️';
      if (type.includes('bool')) return '✓';
      if (type.includes('decimal') || type.includes('numeric') || type.includes('money')) return '💲';
      if (type.includes('json')) return '{ }';
      if (type.includes('uuid')) return '🆔';
      if (type.includes('array')) return '[ ]';
      return '📊';
    };
  
    // Safe check for array and its properties
    const isValidArray = (arr: any): arr is any[] => 
      Array.isArray(arr) && arr.length > 0;
    
    // Safe access to first element with lowercase check
    const hasIdInFirstColumn = (arr: any[]): boolean => 
      isValidArray(arr) && 
      typeof arr[0] === 'string' && 
      arr[0].toLowerCase().includes('id');
    
    // Safe check for foreign keys  
    const hasForeignKeys = (arr: any[]): boolean => 
      isValidArray(arr) && 
      arr.some(col => typeof col === 'string' && col.toLowerCase().includes('_id'));
    
    return (
      <Card className="mb-6 overflow-hidden border-primary/10 shadow-md">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-background">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-primary/20 p-1.5 rounded-md mr-2">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Database Schema</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleMinimize} className="hover:bg-primary/10">
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
                      <AccordionItem key={tableIndex} value={`item-${tableIndex}`} className="mb-3">
                        <AccordionTrigger 
                          className="bg-primary/10 hover:bg-primary/15 px-3 py-2 rounded-t-md font-medium border border-primary/20 relative transition-all"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-primary bg-primary/20 p-1 rounded">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                                <line x1="9" y1="16" x2="9" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="15" y1="16" x2="15" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </span>
                            <span className="text-lg">{tableName}</span>
                          </div>
                          
                          <div className="absolute right-10 top-2 flex space-x-1">
                            <Badge variant="outline" className="ml-2 text-xs bg-background/80">
                              {isValidArray(columns) ? columns.length : 0} columns
                            </Badge>
                            
                            {hasForeignKeys(columns) && (
                              <Badge variant="secondary" className="text-xs">FK</Badge>
                            )}
                            
                            {hasIdInFirstColumn(columns) && (
                              <Badge variant="outline" className="text-xs bg-primary/20">PK</Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        
                        <AccordionContent className="bg-background border border-t-0 rounded-b-md p-2 shadow-inner">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm p-2">
                            {isValidArray(columns) && columns.map((column, i) => {
                              if (typeof column !== 'string') return null;
                              
                              const isPrimaryKey = column.toLowerCase().includes("id") && i === 0;
                              const isForeignKey = column.toLowerCase().includes("_id");
                              
                              // Split column name and type - with safe checks
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
                                        : "bg-muted/30 hover:bg-muted/40"
                                  } transition-colors`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <span className={`mr-2 ${
                                        isPrimaryKey 
                                          ? "text-primary" 
                                          : isForeignKey 
                                            ? "text-secondary" 
                                            : "text-muted-foreground"
                                      }`}>
                                        {isPrimaryKey ? "🔑" : isForeignKey ? "🔗" : getTypeIcon(columnType || columnName)}
                                      </span>
                                      <span className="font-medium">{columnName}</span>
                                    </div>
                                    
                                    {isPrimaryKey && (
                                        <Badge variant="outline" className="text-[10px] px-1 bg-primary/5">
                                            Primary
                                        </Badge>
                                        )}

                                    {isForeignKey && !isPrimaryKey && (
                                        <Badge variant="outline" className="text-[10px] px-1 bg-secondary/5">
                                            Foreign
                                        </Badge>
                                    )}
                                  </div>
                                  
                                  {columnType && (
                                    <span className="text-xs text-muted-foreground ml-6 mt-1 font-mono">{columnType}</span>
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
                <pre className="bg-muted/20 p-4 rounded-md text-xs overflow-auto max-h-[300px] font-mono border">
                  {Object.entries(schema).map(([tableName, columns]) => (
                    `Table: ${tableName}\n  Columns: ${Array.isArray(columns) ? columns.join(', ') : ''}\n\n`
                  )).join('')}
                </pre>
              </TabsContent>
            </Tabs>
            
            <div className="text-xs mt-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-md text-muted-foreground border">
              <p className="flex items-center">
                <span className="bg-primary/20 p-1 rounded mr-2 text-primary">💡</span>
                <span>
                  <strong>Tips:</strong> Primary keys (🔑) uniquely identify records. Foreign keys (🔗) connect tables together.
                  Use these relationships to formulate better questions about your data.
                </span>
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };