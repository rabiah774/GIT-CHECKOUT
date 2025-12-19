import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const recs = [
  { text: "Reorder 50 units of Paracetamol 500mg" },
  { text: "Increase price of Cetirizine 10mg by 4%" },
  { text: "Reduce stock of Omeprazole 20mg by 10%" },
];

const RecommendationPanel: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recs.map((r, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div>{r.text}</div>
              <Button size="sm" variant="ghost">Apply</Button>
            </div>
          ))}

          <div className="pt-4 border-t mt-2">
            <Button className="w-full" variant="default">Apply AI Recommendations</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationPanel;
