import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage/Home";
import Login from "./pages/AuthPage/Login";
import Register from "./pages/AuthPage/Register";
import PatientDashboard from "./pages/DashboardPage/PatientDashboard";
import PharmacyDashboard from "./pages/DashboardPage/PharmacyDashboard";
import ClinicDashboard from "./pages/DashboardPage/ClinicDashboard";
import { TestDataPage } from "./pages/TestDataPage";
import { AdminVerifyPage } from "./pages/AdminVerifyPage";
import { DebugClinicsPage } from "./pages/DebugClinicsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard/patient" element={<PatientDashboard />} />
          <Route path="/dashboard/pharmacy" element={<PharmacyDashboard />} />
          <Route path="/dashboard/clinic" element={<ClinicDashboard />} />
          <Route path="/test-data" element={<TestDataPage />} />
          <Route path="/debug-clinics" element={<DebugClinicsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
