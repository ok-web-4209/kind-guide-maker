import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GolfProvider } from "@/contexts/GolfContext";
import Index from "./pages/Index";
import ManagePlayers from "./pages/ManagePlayers";
import NewSeason from "./pages/NewSeason";
import ContinueSeason from "./pages/ContinueSeason";
import AddCourse from "./pages/AddCourse";
import PlayRound from "./pages/PlayRound";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GolfProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/players" element={<ManagePlayers />} />
            <Route path="/new-season" element={<NewSeason />} />
            <Route path="/continue-season" element={<ContinueSeason />} />
            <Route path="/continue-season/:seasonId" element={<ContinueSeason />} />
            <Route path="/add-course" element={<AddCourse />} />
            <Route path="/play" element={<PlayRound />} />
            <Route path="/stats" element={<Statistics />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </GolfProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
