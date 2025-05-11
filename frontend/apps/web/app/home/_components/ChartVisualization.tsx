// frontend/apps/web/app/home/_components/ChartVisualization.tsx
import { 
  BarChart, Bar, 
  LineChart, Line, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ChartData } from '../types';

interface ChartVisualizationProps {
  data: {
    columns: string[];
    rows: any[][];
  };
  chartConfig: ChartData;
}

// Colors for the charts - using your BlueTurtle theme colors
const COLORS = [
  '#0284c7', // Blue
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky blue
  '#3b82f6', // Blue
  '#60a5fa', // Light blue
];

export function ChartVisualization({ data, chartConfig }: ChartVisualizationProps) {
  // Transform data for charting
  const chartData = data.rows.map(row => {
    const dataPoint: any = {};
    data.columns.forEach((col, index) => {
      dataPoint[col] = row[index];
    });
    return dataPoint;
  });

  const renderChart = () => {
    switch (chartConfig.chartType) {
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={chartConfig.xAxis} 
              angle={-45} 
              textAnchor="end" 
              height={80}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey={chartConfig.yAxis} 
              fill={COLORS[0]} 
            />
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={chartConfig.yAxis} 
              stroke={COLORS[0]} 
              strokeWidth={2}
            />
          </LineChart>
        );
      
      case 'pie':
        // For pie charts, we need different data structure
        const pieData = chartData.map((item, index) => ({
          name: item[chartConfig.xAxis],
          value: item[chartConfig.yAxis],
          fill: COLORS[index % COLORS.length]
        }));
        
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="border rounded-md p-4 bg-card">
      <h3 className="text-lg font-semibold mb-4">{chartConfig.title}</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        {chartConfig.explanation}
      </p>
    </div>
  );
}