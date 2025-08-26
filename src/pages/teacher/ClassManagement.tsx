import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, BookOpen, Calendar, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";

const ClassManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const classes = [
    {
      id: 1,
      name: "Mathematics 10A",
      subject: "Mathematics",
      grade: "Grade 10",
      students: 28,
      schedule: "Mon, Wed, Fri - 9:00 AM",
      status: "active",
      nextClass: "Today 9:00 AM"
    },
    {
      id: 2,
      name: "Physics 11B",
      subject: "Physics", 
      grade: "Grade 11",
      students: 24,
      schedule: "Tue, Thu - 10:30 AM",
      status: "active",
      nextClass: "Tomorrow 10:30 AM"
    },
    {
      id: 3,
      name: "Chemistry 12A",
      subject: "Chemistry",
      grade: "Grade 12", 
      students: 22,
      schedule: "Mon, Wed, Fri - 2:00 PM",
      status: "active",
      nextClass: "Today 2:00 PM"
    },
    {
      id: 4,
      name: "Advanced Math 12B",
      subject: "Mathematics",
      grade: "Grade 12",
      students: 18,
      schedule: "Tue, Thu - 1:00 PM", 
      status: "completed",
      nextClass: "No upcoming classes"
    }
  ];

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Class Management</h1>
              <p className="text-muted-foreground">Manage your classes and students</p>
            </div>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Class
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                Total Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary mb-1">5</div>
              <p className="text-sm text-muted-foreground">Active classes</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-secondary" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary mb-1">92</div>
              <p className="text-sm text-muted-foreground">Across all classes</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-accent" />
                Today's Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent mb-1">3</div>
              <p className="text-sm text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                Avg. Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-1">94%</div>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <Card key={cls.id} className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <Badge variant={cls.status === 'active' ? 'default' : 'secondary'}>
                    {cls.status === 'active' ? 'Active' : 'Completed'}
                  </Badge>
                  <Badge variant="outline">{cls.grade}</Badge>
                </div>
                <CardTitle className="text-xl">{cls.name}</CardTitle>
                <CardDescription>{cls.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Students</span>
                    <span className="font-medium flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {cls.students}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Schedule</span>
                    <span className="font-medium text-sm">{cls.schedule}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Next Class</span>
                    <span className="font-medium text-sm text-primary">{cls.nextClass}</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button variant="default" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Attendance
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassManagement;