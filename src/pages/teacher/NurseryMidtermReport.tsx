// Nursery Midterm Assessment with checkboxes for skill-based evaluation
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Printer } from "lucide-react";
import { Link } from "react-router-dom";

const NurseryMidtermReport = () => {
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
          <h1 className="text-3xl font-bold">Nursery Midterm Report</h1>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">PRISCILLA SCHOOL</h2>
              <p className="text-sm">Nursery Midterm Assessment Report</p>
            </div>
            <p className="text-muted-foreground">Skill-based assessment form - Under development</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NurseryMidtermReport;