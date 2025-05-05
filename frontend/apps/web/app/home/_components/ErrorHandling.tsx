import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@kit/ui/alert";
import { Button } from "@kit/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@kit/ui/collapsible";
import { AlertCircle, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

interface ErrorHandlingProps {
  error: string | null;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
}

export const ErrorHandling: React.FC<ErrorHandlingProps> = ({ 
  error, 
  onRegenerate, 
  showRegenerate = false 
}) => {
  const [showTips, setShowTips] = useState(false);
  
  if (!error) return null;
  
  // Determine if this is likely an LLM-related error
  const isLlmError = error.includes("LLM") || 
                    error.includes("SQL") || 
                    error.includes("extract") || 
                    error.includes("parse");
  
  return (
    <div className="space-y-2">
      <Alert variant="destructive">
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 mt-1 mr-2" />
            <div>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </div>
          
          {showRegenerate && onRegenerate && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRegenerate}
            >
              Regenerate
            </Button>
          )}
        </div>
      </Alert>
      
      {isLlmError && (
        <Collapsible
          open={showTips}
          onOpenChange={setShowTips}
          className="border rounded-md p-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
              <h4 className="text-sm font-medium">Tips for better SQL generation</h4>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {showTips ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="mt-2 text-sm text-muted-foreground">
            <ul className="space-y-2 list-disc pl-5">
              <li>Be more specific in your question - include table names from the schema</li>
              <li>Break down complex queries into simpler questions</li>
              <li>Make sure your question is clear about what data you want to retrieve</li>
              <li>Check that the columns or tables you're asking about exist in the schema</li>
              <li>Try a different LLM model - some models are better at SQL generation than others</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};