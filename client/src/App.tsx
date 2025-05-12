import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ChatPage from "@/pages/chat";

function Navigation() {
  return (
    <nav className="bg-gray-100 p-4 mb-4">
      <div className="container mx-auto flex space-x-4">
        <Link href="/" className="text-primary hover:underline">
          Home
        </Link>
        <Link href="/chat" className="text-primary hover:underline">
          Chat
        </Link>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/chat" component={ChatPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
