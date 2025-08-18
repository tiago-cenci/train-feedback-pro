import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PersonalDashboard from "./pages/PersonalDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AddStudent from "./pages/AddStudent";
import CreateTraining from "./pages/CreateTraining";
import CorrectionsArea from "./pages/CorrectionsArea";
import StudentTraining from "./pages/StudentTraining";
import StudentCorrections from "./pages/StudentCorrections";
import NotFound from "./pages/NotFound";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/personal/dashboard" element={<PersonalDashboard />} />
            <Route path="/personal/add-student" element={<AddStudent />} />
            <Route path="/personal/create-training" element={<CreateTraining />} />
            <Route path="/personal/create-training/:studentId" element={<CreateTraining />} />
            <Route path="/personal/corrections" element={<CorrectionsArea />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/training" element={<StudentTraining />} />
            <Route path="/student/corrections" element={<StudentCorrections />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
