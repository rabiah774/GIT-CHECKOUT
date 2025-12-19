import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const insights = [
  {
    title: "Paracetamol surge",
    body: "Paracetamol demand expected to increase due to seasonal flu trends.",
  },
  {
    title: "Allergy meds steady",
    body: "Antihistamines show steady weekly consumption; reorder as usual.",
  },
  {
    title: "Antibiotics caution",
    body: "Amoxicillin predicted high usage — confirm supplier lead time before large reorder.",
  },
];

const MedicineInsights: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Medicine Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {insights.map((i) => (
            <div key={i.title} className="mb-4">
              <h4 className="font-semibold">{i.title}</h4>
              <p className="text-sm text-muted-foreground">{i.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicineInsights;
