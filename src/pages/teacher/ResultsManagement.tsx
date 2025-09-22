import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import ResultEntry from "@/components/teacher/ResultEntry";
import SubjectSetup from "@/components/teacher/SubjectSetup";
import StudentReportSheet from "@/components/teacher/StudentReportSheet";
import ClassPerformanceDashboard from "@/components/teacher/ClassPerformanceDashboard";
import AdminPanel from "@/components/teacher/AdminPanel";

const ResultsManagement = () => {
  const [currentPage, setCurrentPage] = useState('entry');

  const renderPage = () => {
    switch (currentPage) {
      case 'entry':
        return <ResultEntry onNavigate={setCurrentPage} />;
      case 'subjects':
        return <SubjectSetup onNavigate={setCurrentPage} />;
      case 'report':
        return <StudentReportSheet onNavigate={setCurrentPage} />;
      case 'dashboard':
        return <ClassPerformanceDashboard onNavigate={setCurrentPage} />;
      case 'admin':
        return <AdminPanel onNavigate={setCurrentPage} />;
      default:
        return <ResultEntry onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/teacher/upload-result">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload Result
            </Button>
          </Link>
        </div>
        {renderPage()}
      </div>
    </div>
  );
};

export default ResultsManagement;