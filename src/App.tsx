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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </SecurityProvider>
);

export default App;
