import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Eye, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const ExamResult = () => {
  const examResults = [
    {
      id: 1,
      examName: "Final Mathematics Exam",
      subject: "Mathematics",
      grade: "Grade 10A",
      date: "2024-01-15",
      totalStudents: 28,
      averageScore: 87.5,
      passRate: 92.8,
      status: "published"
    },
    {
      id: 2,
      examName: "Physics Mid-Year Assessment",
      subject: "Physics", 
      grade: "Grade 11B",
      date: "2024-01-12",
      totalStudents: 24,
      averageScore: 82.3,
      passRate: 87.5,
      status: "published"
    },
    {
      id: 3,
      examName: "Chemistry Unit Test",
      subject: "Chemistry",
      grade: "Grade 12A",
      date: "2024-01-10",
      totalStudents: 22,
      averageScore: 89.1,
      passRate: 95.4,
      status: "draft"
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 80) return "text-blue-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/reports">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Exam Results</h1>
              <p className="text-muted-foreground">View and download exam result reports</p>
            </div>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export All Results
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Total Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">3</div>
              <p className="text-sm text-muted-foreground">This semester</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-1">86.3%</div>
              <p className="text-sm text-muted-foreground">Across all exams</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-1">91.9%</div>
              <p className="text-sm text-muted-foreground">Students passing</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Students Tested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-1">74</div>
              <p className="text-sm text-muted-foreground">Total participants</p>
            </CardContent>
          </Card>
        </div>

        {/* Exam Results List */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Recent Exam Results</h3>
          
          {examResults.map((exam) => (
            <Card key={exam.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{exam.examName}</CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-1">
                      <span>{exam.subject}</span>
                      <span>•</span>
                      <span>{exam.grade}</span>
                      <span>•</span>
                      <span>{new Date(exam.date).toLocaleDateString()}</span>
                    </CardDescription>
                  </div>
                  <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                    {exam.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground mb-1">
                      {exam.totalStudents}
                    </div>
                    <p className="text-sm text-muted-foreground">Students</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getScoreColor(exam.averageScore)}`}>
                      {exam.averageScore}%
                    </div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-1 ${getPassRateColor(exam.passRate)}`}>
                      {exam.passRate}%
                    </div>
                    <p className="text-sm text-muted-foreground">Pass Rate</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button variant="default" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                
                {/* Performance Distribution */}
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-2">Grade Distribution</h4>
                  <div className="flex space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span>A: 45%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span>B: 32%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span>C: 15%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span>D+: 8%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamResult;