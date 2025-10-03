import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";


const EnhancedUploadResult = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    academicSession: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
    totalTimeOpened: "",
    resultType: "",
    term: "",
    classLevel: "",
    grade: ""
  });

  const getGradeOptions = () => {
    const { classLevel } = formData;
    if (classLevel === "Primary") {
      return ["Play Group 1", "Play Group 2", "First Grade", "Second Grade", "Third Grade", "Fourth Grade", "Fifth Grade", "Sixth Grade"];
    } else if (classLevel === "Junior Secondary") {
      return ["Seventh Grade", "Eighth Grade", "Nineth Grade"];
    } else if (classLevel === "Senior Secondary") {
      return ["Tenth Grade", "Eleventh Grade", "Twelfth Grade"];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/reports">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Upload Result</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Result Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Academic Session</Label>
                <Input 
                  value={formData.academicSession} 
                  onChange={(e) => setFormData({...formData, academicSession: e.target.value})}
                  placeholder="e.g., 2024/2025"
                />
              </div>
              <div>
                <Label>Total Time School Opened</Label>
                <Input 
                  type="number"
                  placeholder="e.g., 180 days"
                  value={formData.totalTimeOpened}
                  onChange={(e) => setFormData({...formData, totalTimeOpened: e.target.value})}
                />
              </div>
              <div>
                <Label>Result Type</Label>
                <Select value={formData.resultType} onValueChange={(v) => setFormData({...formData, resultType: v})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MidTerm Result">MidTerm Result</SelectItem>
                    <SelectItem value="Examination Result">Examination Result</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Term</Label>
                <Select value={formData.term} onValueChange={(v) => setFormData({...formData, term: v})}>
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Term">First Term</SelectItem>
                    <SelectItem value="Second Term">Second Term</SelectItem>
                    <SelectItem value="Third Term">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class Level</Label>
                <Select value={formData.classLevel} onValueChange={(v) => setFormData({...formData, classLevel: v, grade: ""})}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary">Primary</SelectItem>
                    <SelectItem value="Junior Secondary">Junior Secondary</SelectItem>
                    <SelectItem value="Senior Secondary">Senior Secondary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grade</Label>
                <Select value={formData.grade} onValueChange={(v) => setFormData({...formData, grade: v})} disabled={!formData.classLevel}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {getGradeOptions().map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {formData.grade && (
          <div className="flex justify-end gap-4">
            <Button onClick={() => {
              if (!formData.academicSession || !formData.totalTimeOpened || !formData.resultType || !formData.term || !formData.classLevel || !formData.grade) {
                toast.error("Please fill in all required fields");
                return;
              }
              navigate(`/teacher/report-card?session=${formData.academicSession}&term=${formData.term}&class=${formData.classLevel}&grade=${formData.grade}&totalOpened=${formData.totalTimeOpened}`);
            }}>
              <Send className="h-4 w-4 mr-2" />
              Create Result
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedUploadResult;