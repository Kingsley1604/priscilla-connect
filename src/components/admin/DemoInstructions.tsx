import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const DemoInstructions = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Demo Exam Tokens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>Demo exam tokens have been created for testing:</strong>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <div className="p-4 bg-accent/50 rounded-lg">
            <p className="font-semibold text-sm">CBT Exam Token:</p>
            <p className="font-mono text-lg">CBT2025001</p>
            <p className="text-sm text-muted-foreground mt-1">Duration: 30 minutes | 3 questions</p>
          </div>
          
          <div className="p-4 bg-accent/50 rounded-lg">
            <p className="font-semibold text-sm">Entrance Exam Token:</p>
            <p className="font-mono text-lg">ENT2025001</p>
            <p className="text-sm text-muted-foreground mt-1">Duration: 60 minutes | 4 questions</p>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            Students can use these tokens at <strong>/student/exam</strong> to test the exam interface with anti-cheating features.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
