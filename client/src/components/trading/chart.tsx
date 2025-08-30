import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ChartProps {
  priceHistory: Array<{ price: string; timestamp: string }>;
}

export default function Chart({ priceHistory }: ChartProps) {
  const chartData = useMemo(() => {
    if (priceHistory.length < 2) return { path: "", currentPrice: "" };

    const prices = priceHistory.map(p => parseFloat(p.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const width = 100; // percentage
    const height = 100; // percentage
    
    const points = prices.map((price, index) => {
      const x = (index / (prices.length - 1)) * width;
      const y = height - ((price - minPrice) / priceRange) * height;
      return `${x},${y}`;
    }).join(" ");

    const currentPrice = prices[prices.length - 1];
    
    return { 
      path: `M ${points.replace(/,/g, " L ")}`, 
      currentPrice: currentPrice.toFixed(2) 
    };
  }, [priceHistory]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-muted-foreground">Live Chart</span>
          <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
            Live: {chartData.currentPrice}
          </div>
        </div>
        
        <div className="chart-container h-32 rounded-lg relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={chartData.path}
              stroke="hsl(var(--chart-1))"
              strokeWidth="0.5"
              fill="none"
              data-testid="price-chart-path"
            />
            <path
              d={`${chartData.path} L 100,100 L 0,100 Z`}
              fill="url(#chartGradient)"
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
