import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SecurityProvider from "@/components/security/SecurityProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";
import Achievements from "./pages/Achievements";
import Calendar from "./pages/Calendar";
import Messages from "./pages/Messages";
import PriscillaBrain from "./pages/PriscillaBrain";
import PriscillaTube from "./pages/PriscillaTube";
import GamesArena from "./pages/GamesArena";
import Analytics from "./pages/teacher/Analytics";
import ContentUpload from "./pages/teacher/ContentUpload";
import ClassManagement from "./pages/teacher/ClassManagement";
import ProfileSettings from "./pages/teacher/ProfileSettings";
import ExamBuilder from "./pages/teacher/ExamBuilder";
import ExamInterface from "./pages/student/ExamInterface";
import ExamResults from "./pages/admin/ExamResults";
import ExamResult from "./pages/reports/ExamResult";
import EntranceResult from "./pages/reports/EntranceResult";
import MidtermResult from "./pages/reports/MidtermResult";
import AnnouncementManager from "./components/admin/AnnouncementManager";

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
            <Route path="/reports" element={<Reports />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/priscilla-brain" element={<PriscillaBrain />} />
            <Route path="/priscilla-tube" element={<PriscillaTube />} />
            <Route path="/games-arena" element={<GamesArena />} />
            <Route path="/teacher/analytics" element={<Analytics />} />
            <Route path="/teacher/content-upload" element={<ContentUpload />} />
            <Route path="/teacher/class-management" element={<ClassManagement />} />
            <Route path="/teacher/profile-settings" element={<ProfileSettings />} />
            <Route path="/teacher/exam-builder" element={<ExamBuilder />} />
            <Route path="/student/exam" element={<ExamInterface />} />
            <Route path="/admin/exam-results" element={<ExamResults />} />
            <Route path="/admin/announcements" element={<AnnouncementManager />} />
            <Route path="/reports/exam-result" element={<ExamResult />} />
            <Route path="/reports/entrance-result" element={<EntranceResult />} />
            <Route path="/reports/midterm-result" element={<MidtermResult />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </SecurityProvider>
);

export default App;
