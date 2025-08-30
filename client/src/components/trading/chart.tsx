import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface ChartProps {
  priceHistory: Array<{
    id: string;
    price: string;
    timestamp: string;
  }>;
}

export default function Chart({ priceHistory }: ChartProps) {
  // Transform data for chart
  const chartData = priceHistory.map((item, index) => ({
    time: new Date(item.timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    }),
    price: parseFloat(item.price),
    index: index,
  })).slice(-20); // Show last 20 data points

  // Calculate price change
  const currentPrice = chartData[chartData.length - 1]?.price || 0;
  const previousPrice = chartData[chartData.length - 2]?.price || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-gray-700">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">BTC/USDT Chart</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {"$" + currentPrice.toLocaleString()}
            </div>
            <div
              className={`text-sm font-semibold ${
                priceChange >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {priceChange >= 0 ? "+" : ""}
              {priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["dataMin - 100", "dataMax + 100"]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickFormatter={(value) => "$" + value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#F3F4F6",
                }}
                formatter={(value: any) => ["$" + value.toLocaleString(), "Price"]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={priceChange >= 0 ? "#10B981" : "#EF4444"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
