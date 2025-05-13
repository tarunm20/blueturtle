// frontend/apps/web/app/home/_components/ChartVisualization.tsx
import { 
  BarChart, Bar, 
  LineChart, Line, 
  PieChart, Pie, Cell, Sector,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { ChartData } from '../types';
import { useState } from 'react';

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
  '#93c5fd', // Lighter blue
  '#22d3ee', // Teal
  '#38bdf8', // Sky
  '#7dd3fc', // Light Sky
  '#a5f3fc', // Cyan
];

// Custom active shape for pie chart to enhance user experience
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { 
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value, name
  } = props;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xs">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">{`${name}: ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

export function ChartVisualization({ data, chartConfig }: ChartVisualizationProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Transform data for charting
  const chartData = data.rows.map((row, rowIndex) => {
    const dataPoint: any = {};
    
    // Add all columns to the data point
    data.columns.forEach((col, colIndex) => {
      // Handle null values
      dataPoint[col] = row[colIndex] === null ? 0 : row[colIndex];
    });
    
    // Add name property for pie charts if missing
    if (chartConfig.chartType === 'pie' && !dataPoint.name) {
      dataPoint.name = dataPoint[chartConfig.xAxis] || `Item ${rowIndex + 1}`;
    }
    
    return dataPoint;
  });

  // For pie charts, we need a more specific data structure
  const preparePieData = () => {
    return chartData.map((item, index) => ({
      name: String(item[chartConfig.xAxis] || `Item ${index + 1}`),
      value: Number(item[chartConfig.yAxis] || 0),
    }));
  };

  const handlePieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

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
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey={chartConfig.yAxis} 
              fill={COLORS[0]} 
              name={chartConfig.yAxis}
            />
          </BarChart>
        );
      
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey={chartConfig.xAxis}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={chartConfig.yAxis} 
              stroke={COLORS[0]} 
              strokeWidth={2}
              name={chartConfig.yAxis}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        );
      
      case 'pie':
        const pieData = preparePieData();
        
        // Don't render if no valid data
        if (pieData.length === 0 || pieData.every(item => item.value === 0)) {
          return (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No valid data for pie chart</p>
            </div>
          );
        }
        
        return (
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={handlePieEnter}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
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