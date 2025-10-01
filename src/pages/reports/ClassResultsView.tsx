import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ClassResultsViewProps {
  examType: 'entrance' | 'midterm' | 'exam';
  onBack: () => void;
}

const ClassResultsView = ({ examType, onBack }: ClassResultsViewProps) => {
  const [classLevel, setClassLevel] = useState("");
  const [grade, setGrade] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getClassOptions = () => {
    return ["Primary", "Junior Secondary", "Senior Secondary"];
  };

  const getGradeOptions = () => {
    if (classLevel === "Primary") {
      return [
        "Play Group 1 Result",
        "Play Group 2 Result", 
        "First Grade Result",
        "Second Grade Result",
        "Third Grade Result",
        "Fourth Grade Result",
        "Fifth Grade Result",
        "Sixth Grade Result"
      ];
    } else if (classLevel === "Junior Secondary") {
      return [
        "Seventh Grade Result",
        "Eighth Grade Result",
        "Nineth Grade Result"
      ];
    } else if (classLevel === "Senior Secondary") {
      return [
        "Tenth Grade Result",
        "Eleventh Grade Result",
        "Twelfth Grade Result"
      ];
    }
    return [];
  };

  const loadResults = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResults([]);
      setLoading(false);
    }, 1000);
  };

  const getExamTitle = () => {
    if (examType === 'entrance') return 'Entrance Result';
    if (examType === 'midterm') return 'Midterm Result';
    return 'Exam Result';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{getExamTitle()}</h1>
              <p className="text-white/90">Select class to view results</p>
            </div>
          </div>
        </div>
      </header>

      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Select Class</CardTitle>
              <CardDescription>Choose the class level and grade to view results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class Level</label>
                  <Select value={classLevel} onValueChange={(v) => {
                    setClassLevel(v);
                    setGrade("");
                    setResults([]);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class level" />
                    </SelectTrigger>
                    <SelectContent>
                      {getClassOptions().map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Grade</label>
                  <Select 
                    value={grade} 
                    onValueChange={setGrade}
                    disabled={!classLevel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGradeOptions().map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {grade && (
                <Button onClick={loadResults} disabled={loading}>
                  {loading ? "Loading..." : "View Results"}
                </Button>
              )}
            </CardContent>
          </Card>

          {grade && !loading && results.length === 0 && (
            <Card className="shadow-soft border-dashed border-2">
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Result Available</h3>
                <p className="text-muted-foreground">
                  Results for {grade.replace(" Result", "")} are not available yet. Please check back later.
                </p>
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Results - {grade}</CardTitle>
                <CardDescription>{results.length} students</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Total Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Remark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>{result.admissionNo}</TableCell>
                        <TableCell>{result.totalScore}</TableCell>
                        <TableCell>
                          <Badge>{result.grade}</Badge>
                        </TableCell>
                        <TableCell>{result.remark}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default ClassResultsView;