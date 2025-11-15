import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SecurityProvider from "@/components/security/SecurityProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";
import Achievements from "./pages/Achievements";
import Calendar from "./pages/Calendar";
import Messages from "./pages/Messages";
import ComingSoon from "./pages/ComingSoon";
import PriscillaBrain from "./pages/PriscillaBrain";
import PriscillaTube from "./pages/PriscillaTube";
import GamesArena from "./pages/GamesArena";
import Analytics from "./pages/teacher/Analytics";
import ContentUpload from "./pages/teacher/ContentUpload";
import ClassManagement from "./pages/teacher/ClassManagement";
import TeacherProfileSettings from "./pages/teacher/ProfileSettings";
import UploadResult from "./pages/teacher/UploadResult";
import LessonPlanner from "./pages/teacher/LessonPlanner";
import ExamBuilder from "./pages/teacher/ExamBuilder";
import MidtermReportSheet from "./pages/teacher/MidtermReportSheet";
import NurseryOneExamResult from "./pages/teacher/NurseryOneExamResult";
import NurseryTwoExamResult from "./pages/teacher/NurseryTwoExamResult";
import NurseryMidtermReport from "./pages/teacher/NurseryMidtermReport";
import SecondaryExamResult from "./pages/teacher/SecondaryExamResult";
import ExamInterface from "./pages/student/ExamInterface";
import ExamResults from "./pages/admin/ExamResults";
import ManageAnnouncements from "./pages/admin/ManageAnnouncements";
import SystemSettings from "./pages/admin/SystemSettings";
import ManageStore from "./pages/admin/ManageStore";
import ManagePriscillaTube from "./pages/admin/ManagePriscillaTube";
import ExamResult from "./pages/reports/ExamResult";
import EntranceResult from "./pages/reports/EntranceResult";
import MidtermResult from "./pages/reports/MidtermResult";
import AnnouncementManager from "./components/admin/AnnouncementManager";
import PassAnnouncement from "./pages/admin/PassAnnouncement";
import ProfileSettings from "./pages/ProfileSettings";
import Store from "./pages/Store";
import ResultsManagement from "./pages/teacher/ResultsManagement";
import AdminProfileSettings from "./pages/admin/AdminProfileSettings";
import EnhancedUploadResult from "./pages/teacher/EnhancedUploadResult";
import StudentReportCardSystem from "./pages/teacher/StudentReportCardSystem";
import DraftResults from "./pages/teacher/DraftResults";
import ExamOverview from "./pages/teacher/ExamOverview";
import ExamSetup from "./pages/teacher/ExamSetup";
import CreateQuestions from "./pages/teacher/CreateQuestions";
import InventoryManager from "./pages/admin/InventoryManager";
import ManageStoreEnhanced from "./pages/admin/ManageStoreEnhanced";
import Error404 from "./pages/errors/Error404";
import Error403 from "./pages/errors/Error403";
import Error401 from "./pages/errors/Error401";
import Error500 from "./pages/errors/Error500";
import ErrorNetwork from "./pages/errors/ErrorNetwork";

const queryClient = new QueryClient();

const App = () => (
  <SecurityProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/store" element={<Store />} />
            <Route path="/profile-settings" element={<ProfileSettings />} />
        <Route path="/priscilla-brain" element={<PriscillaBrain />} />
        <Route path="/priscilla-tube" element={<PriscillaTube />} />
        <Route path="/games-arena" element={<ComingSoon title="Games Arena" description="Educational gaming platform" />} />
            <Route path="/teacher/analytics" element={<ComingSoon title="Analytics" description="Comprehensive student performance analytics and insights" />} />
            <Route path="/teacher/content-upload" element={<ComingSoon title="Content Upload" description="Upload and manage educational content" />} />
            <Route path="/teacher/lesson-planner" element={<LessonPlanner />} />
            <Route path="/teacher/class-management" element={<ComingSoon title="Class Management" description="Manage your classes and students" />} />
            <Route path="/teacher/profile-settings" element={<TeacherProfileSettings />} />
            <Route path="/teacher/upload-result" element={<EnhancedUploadResult />} />
            <Route path="/teacher/midterm-report" element={<MidtermReportSheet />} />
            <Route path="/teacher/nursery-one-exam" element={<NurseryOneExamResult />} />
            <Route path="/teacher/nursery-two-exam" element={<NurseryTwoExamResult />} />
            <Route path="/teacher/nursery-midterm-report" element={<NurseryMidtermReport />} />
            <Route path="/teacher/secondary-exam-result" element={<SecondaryExamResult />} />
            <Route path="/teacher/report-card" element={<StudentReportCardSystem />} />
            <Route path="/teacher/draft-results" element={<DraftResults />} />
            <Route path="/teacher/exam-overview" element={<ExamOverview />} />
            <Route path="/teacher/exam-setup" element={<ExamSetup />} />
            <Route path="/teacher/create-questions" element={<CreateQuestions />} />
            <Route path="/teacher/results-management" element={<ResultsManagement />} />
            <Route path="/admin/profile-settings" element={<AdminProfileSettings />} />
            <Route path="/teacher/exam-builder" element={<ExamBuilder />} />
            <Route path="/student/exam" element={<ExamInterface />} />
            <Route path="/admin/exam-results" element={<ExamResults />} />
            <Route path="/admin/announcements" element={<AnnouncementManager />} />
            <Route path="/admin/manage-announcements" element={<ManageAnnouncements />} />
            <Route path="/admin/manage-store" element={<ManageStoreEnhanced />} />
            <Route path="/admin/inventory-manager" element={<InventoryManager />} />
            <Route path="/admin/manage-priscilla-tube" element={<ManagePriscillaTube />} />
            <Route path="/admin/system-settings" element={<SystemSettings />} />
            <Route path="/admin/pass-announcement" element={<PassAnnouncement />} />
            <Route path="/reports/exam-result" element={<ExamResult />} />
            <Route path="/reports/entrance-result" element={<EntranceResult />} />
            <Route path="/reports/midterm-result" element={<MidtermResult />} />
            {/* Error Pages */}
            <Route path="/error/403" element={<Error403 />} />
            <Route path="/error/401" element={<Error401 />} />
            <Route path="/error/500" element={<Error500 />} />
            <Route path="/error/network" element={<ErrorNetwork />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<Error404 />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </SecurityProvider>
);

export default App;
