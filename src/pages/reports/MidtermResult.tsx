import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Eye, BarChart3, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

const MidtermResult = () => {
  const midtermResults = [
    {
      id: 1,
      examName: "Mathematics Midterm",
      grade: "Grade 10A",
      date: "2024-01-25",
      totalStudents: 28,
      averageScore: 84.2,
      highestScore: 98,
      lowestScore: 62,
      passRate: 89.3,
      status: "graded"
    },
    {
      id: 2,
      examName: "Physics Midterm", 
      grade: "Grade 11B",
      date: "2024-01-23",
      totalStudents: 24,
      averageScore: 79.8,
      highestScore: 95,
      lowestScore: 58,
      passRate: 83.3,
      status: "graded"
    },
    {
      id: 3,
      examName: "Chemistry Midterm",
      grade: "Grade 12A",
      date: "2024-01-22",
      totalStudents: 22,
      averageScore: 87.5,
      highestScore: 100,
      lowestScore: 65,
      passRate: 95.4,
      status: "graded"
    },
    {
      id: 4,
      examName: "Biology Midterm",
      grade: "Grade 11A",
      date: "2024-01-20",
      totalStudents: 26,
      averageScore: 81.7,
      highestScore: 96,
      lowestScore: 55,
      passRate: 84.6,
      status: "pending"
    }
  ];

  const performanceAnalysis = [
    { category: "Excellent (90-100%)", count: 45, percentage: 45 },
    { category: "Good (80-89%)", count: 32, percentage: 32 },
    { category: "Satisfactory (70-79%)", count: 18, percentage: 18 },
    { category: "Needs Improvement (<70%)", count: 5, percentage: 5 }
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
              <h1 className="text-3xl font-bold text-foreground">Midterm Results</h1>
              <p className="text-muted-foreground">Mid-semester examination results and analysis</p>
            </div>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export All Results
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Total Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">4</div>
              <p className="text-sm text-muted-foreground">This midterm</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Students Tested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-1">100</div>
              <p className="text-sm text-muted-foreground">Total participants</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-1">83.3%</div>
              <p className="text-sm text-muted-foreground">Across all subjects</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-1">88.1%</div>
              <p className="text-sm text-muted-foreground">Students passing</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-1">+5.2%</div>
              <p className="text-sm text-muted-foreground">From last term</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Midterm Results List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-semibold text-foreground">Subject-wise Results</h3>
            
            {midtermResults.map((exam) => (
              <Card key={exam.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{exam.examName}</CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-1">
                        <span>{exam.grade}</span>
                        <span>•</span>
                        <span>{new Date(exam.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{exam.totalStudents} students</span>
                      </CardDescription>
                    </div>
                    <Badge variant={exam.status === 'graded' ? 'default' : 'secondary'}>
                      {exam.status === 'graded' ? 'Graded' : 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className={`text-xl font-bold mb-1 ${getScoreColor(exam.averageScore)}`}>
                        {exam.averageScore}%
                      </div>
                      <p className="text-xs text-muted-foreground">Average</p>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600 mb-1">
                        {exam.highestScore}%
                      </div>
                      <p className="text-xs text-muted-foreground">Highest</p>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600 mb-1">
                        {exam.lowestScore}%
                      </div>
                      <p className="text-xs text-muted-foreground">Lowest</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-xl font-bold mb-1 ${getPassRateColor(exam.passRate)}`}>
                        {exam.passRate}%
                      </div>
                      <p className="text-xs text-muted-foreground">Pass Rate</p>
                    </div>
                  </div>

                  {/* Score Distribution */}
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Score Distribution</h4>
                    <div className="w-full bg-muted rounded-full h-2 flex overflow-hidden">
                      <div className="bg-green-500 h-2" style={{width: '40%'}}></div>
                      <div className="bg-blue-500 h-2" style={{width: '35%'}}></div>
                      <div className="bg-yellow-500 h-2" style={{width: '20%'}}></div>
                      <div className="bg-red-500 h-2" style={{width: '5%'}}></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>A: 40%</span>
                      <span>B: 35%</span>
                      <span>C: 20%</span>
                      <span>D: 5%</span>
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

          {/* Performance Analysis */}
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Analysis
                </CardTitle>
                <CardDescription>Overall student performance distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceAnalysis.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{item.category}</span>
                        <span className="text-sm font-bold">{item.count} students</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-green-500' :
                            index === 1 ? 'bg-blue-500' :
                            index === 2 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{width: `${item.percentage}%`}}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.percentage}% of students
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Summary Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  Compare with Previous Term
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MidtermResult;