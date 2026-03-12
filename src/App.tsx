import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import { ClubProvider } from "./context/ClubContext";
import Sessions from "./pages/Sessions";
import AddSession from "./pages/AddSession";
import JoinGroup from "./pages/JoinGroup";
import Members from "./pages/Members";
import Calendar from "./pages/Calendar";
import Announcements from "./pages/Announcements";
import More from "./pages/More";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Invite from "./pages/Invite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <ClubProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Sessions />} />
          <Route path="/about" element={<Index />} />
          <Route path="/add-session" element={<AddSession />} />
          <Route path="/join" element={<JoinGroup />} />
          <Route path="/members" element={<Members />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/more" element={<More />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/invite/:token" element={<Invite />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      </ClubProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
