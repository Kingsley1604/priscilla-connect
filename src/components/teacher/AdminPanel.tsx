import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Upload, Download, Lock, Unlock, Check, X, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface AdminPanelProps {
  onNavigate: (page: string) => void;
}

const AdminPanel = ({ onNavigate }: AdminPanelProps) => {
  const [gradeSystem, setGradeSystem] = useState([
    { grade: 'A', minScore: 80, maxScore: 100, description: 'Excellent', color: 'green' },
    { grade: 'B', minScore: 70, maxScore: 79, description: 'Good', color: 'blue' },
    { grade: 'C', minScore: 60, maxScore: 69, description: 'Credit', color: 'yellow' },
    { grade: 'D', minScore: 50, maxScore: 59, description: 'Pass', color: 'orange' },
    { grade: 'F', minScore: 0, maxScore: 49, description: 'Fail', color: 'red' }
  ]);

  const [pendingResults, setPendingResults] = useState([
    {
      id: "1",
      teacher: "Mrs. Sarah Johnson",
      class: "JSS 1A",
      subject: "Mathematics",
      students: 45,
      submittedAt: "2024-01-15",
      status: "pending"
    },
    {
      id: "2", 
      teacher: "Mr. David Wilson",
      class: "JSS 2B",
      subject: "English",
      students: 42,
      submittedAt: "2024-01-14",
      status: "pending"
    },
    {
      id: "3",
      teacher: "Dr. Emily Brown",
      class: "JSS 3A", 
      subject: "Science",
      students: 38,
      submittedAt: "2024-01-13",
      status: "approved"
    }
  ]);

  const [bulkUploadSettings, setBulkUploadSettings] = useState({
    allowedFormats: ['xlsx', 'csv'],
    maxFileSize: 10,
    autoApprove: false,
    validateStudentIds: true
  });

  const handleGradeSystemUpdate = (index: number, field: string, value: any) => {
    const updated = [...gradeSystem];
    updated[index] = { ...updated[index], [field]: value };
    setGradeSystem(updated);
    toast.success("Grade system updated");
  };

  const handleApproveResult = (resultId: string) => {
    setPendingResults(prev => prev.map(result => 
      result.id === resultId ? { ...result, status: 'approved' } : result
    ));
    toast.success("Result approved successfully");
  };

  const handleRejectResult = (resultId: string) => {
    setPendingResults(prev => prev.map(result => 
      result.id === resultId ? { ...result, status: 'rejected' } : result
    ));
    toast.success("Result rejected");
  };

  const handleLockResult = (resultId: string) => {
    setPendingResults(prev => prev.map(result => 
      result.id === resultId ? { ...result, status: 'locked' } : result
    ));
    toast.success("Result locked");
  };

  const handleBulkUpload = () => {
    toast.success("Bulk upload initiated - processing file...");
  };

  const handleExportTemplate = () => {
    toast.success("Template downloaded successfully");
  };

  const pendingCount = pendingResults.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Result Management Admin Panel
              </CardTitle>
              <CardDescription>
                Manage grading system, approve results, and configure bulk upload settings
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onNavigate('entry')}>
                Back to Entry
              </Button>
              <Badge variant={pendingCount > 0 ? "destructive" : "default"}>
                {pendingCount} Pending Approvals
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grading System Management */}
      <Card>
        <CardHeader>
          <CardTitle>Grading System Configuration</CardTitle>
          <CardDescription>
            Define and manage grade boundaries and descriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Min Score</TableHead>
                  <TableHead>Max Score</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradeSystem.map((grade, index) => (
                  <TableRow key={grade.grade}>
                    <TableCell>
                      <Badge variant="outline" className={`border-${grade.color}-500 text-${grade.color}-600`}>
                        {grade.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.minScore}
                        onChange={(e) => handleGradeSystemUpdate(index, 'minScore', Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.maxScore}
                        onChange={(e) => handleGradeSystemUpdate(index, 'maxScore', Number(e.target.value))}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={grade.description}
                        onChange={(e) => handleGradeSystemUpdate(index, 'description', e.target.value)}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Result Approval Management */}
      <Card>
        <CardHeader>
          <CardTitle>Result Approval Queue</CardTitle>
          <CardDescription>
            Review and approve teacher-submitted results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingResults.map((result) => (
              <div key={result.id} className={`border rounded-lg p-4 ${
                result.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                result.status === 'approved' ? 'bg-green-50 dark:bg-green-950/20' :
                result.status === 'rejected' ? 'bg-red-50 dark:bg-red-950/20' :
                'bg-gray-50 dark:bg-gray-950/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold">{result.class} - {result.subject}</h3>
                      <Badge variant={
                        result.status === 'pending' ? 'default' :
                        result.status === 'approved' ? 'default' :
                        result.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {result.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Teacher: {result.teacher}</p>
                      <p>Students: {result.students} • Submitted: {result.submittedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApproveResult(result.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectResult(result.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {result.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLockResult(result.id)}
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        Lock
                      </Button>
                    )}
                    {result.status === 'locked' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Upload Management */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload Configuration</CardTitle>
          <CardDescription>
            Configure settings for Excel/CSV bulk result uploads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium">Upload Settings</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-approve uploads</p>
                  <p className="text-sm text-muted-foreground">Automatically approve bulk uploaded results</p>
                </div>
                <Switch
                  checked={bulkUploadSettings.autoApprove}
                  onCheckedChange={(checked) => setBulkUploadSettings({
                    ...bulkUploadSettings,
                    autoApprove: checked
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Validate Student IDs</p>
                  <p className="text-sm text-muted-foreground">Check student IDs against database</p>
                </div>
                <Switch
                  checked={bulkUploadSettings.validateStudentIds}
                  onCheckedChange={(checked) => setBulkUploadSettings({
                    ...bulkUploadSettings,
                    validateStudentIds: checked
                  })}
                />
              </div>
              
              <div>
                <label className="font-medium">Maximum file size (MB)</label>
                <Input
                  type="number"
                  value={bulkUploadSettings.maxFileSize}
                  onChange={(e) => setBulkUploadSettings({
                    ...bulkUploadSettings,
                    maxFileSize: Number(e.target.value)
                  })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Upload Actions</h3>
              
              <div className="space-y-3">
                <Button onClick={handleExportTemplate} variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Upload Template
                </Button>
                
                <Button onClick={handleBulkUpload} className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Results File
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  View Upload History
                </Button>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Upload Instructions</h3>
            <Textarea
              placeholder="Provide instructions for teachers on how to format their upload files..."
              rows={4}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>System Statistics</CardTitle>
          <CardDescription>
            Overview of result management system usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1,247</div>
              <p className="text-sm text-blue-600">Total Results</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">1,198</div>
              <p className="text-sm text-green-600">Approved</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-sm text-yellow-600">Pending</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">25</div>
              <p className="text-sm text-purple-600">Active Teachers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;