import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SchedulingDashboard from "@/components/SchedulingDashboard";
import PublicScheduleView from "@/components/PublicScheduleView";
import NotFound from "@/pages/not-found";

// TODO: remove mock data for public schedule
const mockPublicData = {
  month: 1,
  year: 2024,
  schedules: [
    { id: 's1', day: 1, userId: '1', userName: 'Dr. Sarah Smith', userRole: 'physician' as const },
    { id: 's2', day: 3, userId: '2', userName: 'Dr. Michael Johnson', userRole: 'physician' as const },
    { id: 's3', day: 5, userId: '4', userName: 'Medical Student Alex', userRole: 'learner' as const },
  ],
  users: [
    { id: '1', name: 'Dr. Sarah Smith', phone: '555-0101', role: 'physician' as const },
    { id: '2', name: 'Dr. Michael Johnson', phone: '555-0102', role: 'physician' as const },
    { id: '4', name: 'Medical Student Alex', phone: '555-0201', role: 'learner' as const },
  ]
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={SchedulingDashboard} />
      <Route path="/public/:token">
        {(params) => (
          <PublicScheduleView 
            {...mockPublicData}
            onExportPDF={() => console.log('Export public PDF')}
          />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
