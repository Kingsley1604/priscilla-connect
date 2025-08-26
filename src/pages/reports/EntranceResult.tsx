import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Eye, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const EntranceResult = () => {
  const entranceResults = [
    {
      id: 1,
      examName: "2024 Grade 10 Entrance Exam",
      date: "2024-01-20",
      totalApplicants: 450,
      totalAdmitted: 280,
      admissionRate: 62.2,
      averageScore: 78.5,
      cutoffScore: 65,
      status: "completed"
    },
    {
      id: 2,
      examName: "2024 Grade 11 Transfer Exam",
      date: "2024-01-18",
      totalApplicants: 120,
      totalAdmitted: 85,
      admissionRate: 70.8,
      averageScore: 82.1,
      cutoffScore: 70,
      status: "completed"
    },
    {
      id: 3,
      examName: "2024 Advanced Program Entrance",
      date: "2024-01-15",
      totalApplicants: 200,
      totalAdmitted: 50,
      admissionRate: 25.0,
      averageScore: 85.3,
      cutoffScore: 80,
      status: "completed"
    }
  ];

  const subjectBreakdown = [
    { subject: "Mathematics", averageScore: 79.2, passRate: 68.5 },
    { subject: "English", averageScore: 76.8, passRate: 72.1 },
    { subject: "Science", averageScore: 81.3, passRate: 65.2 },
    { subject: "General Knowledge", averageScore: 74.5, passRate: 70.8 }
  ];

  const getAdmissionRateColor = (rate: number) => {
    if (rate >= 70) return "text-green-600";
    if (rate >= 50) return "text-blue-600";
    if (rate >= 30) return "text-yellow-600";
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
              <h1 className="text-3xl font-bold text-foreground">Entrance Exam Results</h1>
              <p className="text-muted-foreground">Admission statistics and entrance exam performance</p>
            </div>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Total Applicants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">770</div>
              <p className="text-sm text-muted-foreground">This academic year</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Students Admitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-1">415</div>
              <p className="text-sm text-muted-foreground">Successful applicants</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Admission Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-1">53.9%</div>
              <p className="text-sm text-muted-foreground">Overall acceptance</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-1">78.6%</div>
              <p className="text-sm text-muted-foreground">All entrance exams</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Entrance Exam Results */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-semibold text-foreground mb-6">Entrance Exam Results</h3>
            <div className="space-y-6">
              {entranceResults.map((exam) => (
                <Card key={exam.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{exam.examName}</CardTitle>
                        <CardDescription>
                          {new Date(exam.date).toLocaleDateString()} • {exam.totalApplicants} applicants
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{exam.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600 mb-1">
                          {exam.totalAdmitted}
                        </div>
                        <p className="text-xs text-muted-foreground">Admitted</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-xl font-bold mb-1 ${getAdmissionRateColor(exam.admissionRate)}`}>
                          {exam.admissionRate}%
                        </div>
                        <p className="text-xs text-muted-foreground">Admission Rate</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600 mb-1">
                          {exam.averageScore}%
                        </div>
                        <p className="text-xs text-muted-foreground">Avg Score</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600 mb-1">
                          {exam.cutoffScore}%
                        </div>
                        <p className="text-xs text-muted-foreground">Cutoff</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="default" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Subject Performance */}
          <div>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Subject Performance
                </CardTitle>
                <CardDescription>Average performance by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjectBreakdown.map((subject, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{subject.subject}</span>
                        <span className="text-sm font-bold text-primary">{subject.averageScore}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{width: `${subject.averageScore}%`}}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Pass Rate: {subject.passRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-soft mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download All Results
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View Detailed Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Generate Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntranceResult;