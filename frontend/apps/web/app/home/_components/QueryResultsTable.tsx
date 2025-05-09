// frontend/apps/web/app/home/_components/QueryResultsTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kit/ui/table";
import { ScrollArea } from "@kit/ui/scroll-area";
import { Badge } from "@kit/ui/badge";
import { FileSpreadsheet } from "lucide-react";

interface QueryResultsTableProps {
  columns: string[];
  rows: any[][];
}

export function QueryResultsTable({ columns, rows }: QueryResultsTableProps) {
  if (!columns?.length || !rows?.length) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        <FileSpreadsheet className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>No results found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
        <h3 className="font-medium text-sm">Query Results</h3>
        <Badge variant="outline" className="font-mono">
          {rows.length} row{rows.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <ScrollArea className="max-h-[300px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/40">
              {columns.map((column, index) => (
                <TableHead key={index} className="font-medium">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? undefined : 'bg-muted/20'}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>
                    {cell !== null && cell !== undefined ? 
                      (typeof cell === 'object' ? JSON.stringify(cell) : String(cell)) : 
                      <span className="text-muted-foreground italic">null</span>
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}