// frontend/apps/web/app/home/_components/QueryResultsTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kit/ui/table";
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
    <div className="border rounded-md overflow-hidden flex flex-col">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
        <h3 className="font-medium text-sm">Query Results</h3>
        <Badge variant="outline" className="font-mono">
          {rows.length} row{rows.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      {/* Main container with vertical scroll only */}
      <div className="max-h-[270px] overflow-y-auto flex-grow">
        <div className="min-w-full inline-block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/40">
                {columns.map((column, index) => (
                  <TableHead key={index} className="font-medium whitespace-nowrap sticky top-0 bg-muted/30 z-10">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? undefined : 'bg-muted/20'}>
                  {row.map((cell, cellIndex) => (
                    <TableCell 
                      key={cellIndex} 
                      title={cell !== null && cell !== undefined ? String(cell) : ''}
                    >
                      {cell !== null && cell !== undefined ? (
                        typeof cell === 'object' ? (
                          <span className="inline-block max-w-xs overflow-hidden text-ellipsis">
                            {JSON.stringify(cell)}
                          </span>
                        ) : (
                          String(cell)
                        )
                      ) : (
                        <span className="text-muted-foreground italic">null</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Separate horizontal scrollbar container that's always visible */}
      <div className="overflow-x-auto overflow-y-hidden border-t">
        <div className="h-3 min-w-full"></div>
      </div>
    </div>
  );
}