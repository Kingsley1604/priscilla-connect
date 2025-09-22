import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Plus, Trash2, Copy, Settings } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  code: string;
  caWeight: number;
  examWeight: number;
  isActive: boolean;
}

interface SubjectSetupProps {
  onNavigate: (page: string) => void;
}

const SubjectSetup = ({ onNavigate }: SubjectSetupProps) => {
  const [selectedClass, setSelectedClass] = useState("JSS 1A");
  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: "1",
      name: "Mathematics",
      code: "MTH101",
      caWeight: 40,
      examWeight: 60,
      isActive: true
    },
    {
      id: "2",
      name: "English Language",
      code: "ENG101", 
      caWeight: 40,
      examWeight: 60,
      isActive: true
    },
    {
      id: "3",
      name: "Basic Science",
      code: "SCI101",
      caWeight: 30,
      examWeight: 70,
      isActive: true
    },
    {
      id: "4",
      name: "Social Studies",
      code: "SST101",
      caWeight: 40,
      examWeight: 60,
      isActive: false
    }
  ]);

  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    caWeight: 40,
    examWeight: 60
  });

  const handleAddSubject = () => {
    if (!newSubject.name || !newSubject.code) {
      toast.error("Please fill in subject name and code");
      return;
    }

    if (newSubject.caWeight + newSubject.examWeight !== 100) {
      toast.error("CA and Exam weights must total 100");
      return;
    }

    const subject: Subject = {
      id: Date.now().toString(),
      name: newSubject.name,
      code: newSubject.code,
      caWeight: newSubject.caWeight,
      examWeight: newSubject.examWeight,
      isActive: true
    };

    setSubjects(prev => [...prev, subject]);
    setNewSubject({ name: "", code: "", caWeight: 40, examWeight: 60 });
    toast.success("Subject added successfully");
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    toast.success("Subject deleted");
  };

  const toggleSubjectStatus = (subjectId: string) => {
    setSubjects(prev => prev.map(s => 
      s.id === subjectId ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const updateSubjectWeight = (subjectId: string, field: 'caWeight' | 'examWeight', value: number) => {
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) {
        const otherField = field === 'caWeight' ? 'examWeight' : 'caWeight';
        return { ...s, [field]: value, [otherField]: 100 - value };
      }
      return s;
    }));
  };

  const handleCopyFromPreviousTerm = () => {
    toast.success("Subjects copied from previous term");
  };

  const activeSubjects = subjects.filter(s => s.isActive);
  const inactiveSubjects = subjects.filter(s => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Subject Setup
              </CardTitle>
              <CardDescription>
                Configure subjects and scoring weights for your classes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onNavigate('entry')}>
                Result Entry
              </Button>
              <Button variant="outline" onClick={handleCopyFromPreviousTerm}>
                <Copy className="h-4 w-4 mr-2" />
                Copy from Previous Term
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Select Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JSS 1A">JSS 1A</SelectItem>
                  <SelectItem value="JSS 1B">JSS 1B</SelectItem>
                  <SelectItem value="JSS 2A">JSS 2A</SelectItem>
                  <SelectItem value="JSS 2B">JSS 2B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Class: <span className="font-medium">{selectedClass}</span></p>
              <p>Active Subjects: <span className="font-medium">{activeSubjects.length}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Subject */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Subject
          </CardTitle>
          <CardDescription>
            Add subjects and define their assessment weights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Subject Name</label>
              <Input
                value={newSubject.name}
                onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                placeholder="e.g., Mathematics"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subject Code</label>
              <Input
                value={newSubject.code}
                onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                placeholder="e.g., MTH101"
              />
            </div>
            <div>
              <label className="text-sm font-medium">CA Weight (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newSubject.caWeight}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setNewSubject({
                    ...newSubject, 
                    caWeight: value, 
                    examWeight: 100 - value
                  });
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Exam Weight (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={newSubject.examWeight}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setNewSubject({
                    ...newSubject, 
                    examWeight: value, 
                    caWeight: 100 - value
                  });
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddSubject} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Subjects */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subjects</CardTitle>
          <CardDescription>
            Subjects currently available for {selectedClass}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>CA Weight</TableHead>
                  <TableHead>Exam Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={subject.caWeight}
                          onChange={(e) => updateSubjectWeight(subject.id, 'caWeight', Number(e.target.value))}
                          className="w-16"
                        />
                        <span className="text-sm">%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={subject.examWeight}
                          onChange={(e) => updateSubjectWeight(subject.id, 'examWeight', Number(e.target.value))}
                          className="w-16"
                        />
                        <span className="text-sm">%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={subject.isActive}
                          onCheckedChange={() => toggleSubjectStatus(subject.id)}
                        />
                        <Badge variant="default">Active</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inactive Subjects */}
      {inactiveSubjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inactive Subjects</CardTitle>
            <CardDescription>
              Subjects currently disabled for {selectedClass}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inactiveSubjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div>
                    <span className="font-medium">{subject.name}</span>
                    <span className="text-muted-foreground ml-2">({subject.code})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={subject.isActive}
                      onCheckedChange={() => toggleSubjectStatus(subject.id)}
                    />
                    <Badge variant="secondary">Inactive</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubjectSetup;