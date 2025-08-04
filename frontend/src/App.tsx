import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Article from "./pages/Article";
import Trending from "./pages/Trending";
import PersonalizedFeed from "./pages/PersonalizedFeed";
import NotFound from "./pages/NotFound";
import "./lib/env"; // Import for environment validation

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          {/* <Route path="/trending" element={<Trending />} /> */}
          <Route path="/personalized" element={<PersonalizedFeed />} />
          <Route path="/article/:id" element={<Article />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
