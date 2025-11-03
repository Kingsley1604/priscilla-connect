// Secondary School Termly Report with performance chart
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const SecondaryExamResult = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4 print:hidden">
          <Link to="/teacher/upload-result">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Secondary School Result</h1>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Knightdale Middle College</h2>
              <p className="text-sm">Termly Report</p>
            </div>
            <p className="text-muted-foreground">Secondary result system - Under development</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecondaryExamResult;