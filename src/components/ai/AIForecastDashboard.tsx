import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import RecommendationPanel from "./RecommendationPanel";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const sample7 = [
  { day: "Day 1", demand: 45 },
  { day: "Day 2", demand: 50 },
  { day: "Day 3", demand: 38 },
  { day: "Day 4", demand: 62 },
  { day: "Day 5", demand: 70 },
  { day: "Day 6", demand: 65 },
  { day: "Day 7", demand: 80 },
];

const sample30 = Array.from({ length: 30 }).map((_, i) => ({
  day: `D${i + 1}`,
  demand: Math.round(40 + Math.sin(i / 3) * 10 + Math.random() * 12),
}));

const topShortages = [
  { name: "Paracetamol 500mg", qty: 8, predicted: 60, risk: "High" },
  { name: "Cetirizine 10mg", qty: 12, predicted: 40, risk: "Medium" },
  { name: "Amoxicillin 250mg", qty: 4, predicted: 30, risk: "High" },
  { name: "Omeprazole 20mg", qty: 22, predicted: 25, risk: "Low" },
  { name: "Salbutamol Inhaler", qty: 6, predicted: 18, risk: "High" },
];

const AIForecastDashboard: React.FC = () => {
  const [view, setView] = useState<"7" | "30">("7");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, [view]);

  const data = view === "7" ? sample7 : sample30;

  return (
    <div className="space-y-4">
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-pulse">Running AI model…</div>
            <div className="text-sm text-muted-foreground mt-2">Analyzing past sales and local trends</div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Predicted demand for next {view === "7" ? "7 days" : "30 days"}</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <div className="flex items-center justify-between mb-2">
                <div className="space-x-2">
                  <Button size="sm" variant={view === "7" ? undefined : "outline"} onClick={() => setView("7")}>
                    7 Days
                  </Button>
                  <Button size="sm" variant={view === "30" ? undefined : "outline"} onClick={() => setView("30")}>
                    30 Days
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">AI explanation: Based on past ordering patterns and local trends</div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="demand" stroke="#10b981" strokeWidth={3} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Predicted stock-out items (Next 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th>Medicine</th>
                      <th>Current Qty</th>
                      <th>Predicted Demand</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topShortages.map((m) => (
                      <tr key={m.name} className="border-t">
                        <td className="py-2">{m.name}</td>
                        <td>{m.qty}</td>
                        <td>{m.predicted}</td>
                        <td>
                          <Badge variant={m.risk === "High" ? "destructive" : m.risk === "Medium" ? "outline" : undefined}>{m.risk}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">Based on the forecast we recommend prioritized reorders and pricing adjustments for high-risk items.</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Open Recommendation Panel</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <RecommendationPanel />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AIForecastDashboard;
