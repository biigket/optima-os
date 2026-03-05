import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import LeadsPage from "@/pages/LeadsPage";
import OpportunitiesPage from "@/pages/OpportunitiesPage";
import VisitCheckinPage from "@/pages/VisitCheckinPage";
import VisitReportsPage from "@/pages/VisitReportsPage";
import DemosPage from "@/pages/DemosPage";
import TasksPage from "@/pages/TasksPage";
import CalendarPage from "@/pages/CalendarPage";
import DevicesPage from "@/pages/DevicesPage";
import ConsumablesPage from "@/pages/ConsumablesPage";
import MaintenancePage from "@/pages/MaintenancePage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/visit-checkin" element={<VisitCheckinPage />} />
            <Route path="/visit-reports" element={<VisitReportsPage />} />
            <Route path="/demos" element={<DemosPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/consumables" element={<ConsumablesPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
