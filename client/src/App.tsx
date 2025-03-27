import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Documents from "@/pages/Documents";
import Analytics from "@/pages/Analytics";
import Campaigns from "@/pages/Campaigns";
import Communications from "@/pages/Communications";
import LegalResources from "@/pages/LegalResources";
import Training from "@/pages/Training";
import Settings from "@/pages/Settings";
import Integrations from "@/pages/Integrations";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useCallback, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./lib/authContext";

// Create a context for managing the sidebar state
import { createContext } from "react";

export const SidebarContext = createContext({
  isSidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {}
});

// Private Route Component for Authentication
function PrivateRoute({ component: Component, ...rest }: { component: React.ComponentType<any>; path?: string }) {
  const { isAuthenticated, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>;
  }

  return isAuthenticated ? <Component {...rest} /> : <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);
  
  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);
  
  // Close sidebar on route change
  useEffect(() => {
    closeSidebar();
  }, [window.location.pathname, closeSidebar]);
  
  // For login and register pages, don't show the sidebar and header
  if (['/login', '/register'].includes(window.location.pathname)) {
    return <>{children}</>;
  }
  
  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar }}>
      {isAuthenticated ? (
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 px-4 py-8 md:px-8">
              {children}
            </main>
          </div>
        </div>
      ) : (
        <Redirect to="/login" />
      )}
    </SidebarContext.Provider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        {() => <PrivateRoute component={Dashboard} />}
      </Route>
      <Route path="/dashboard">
        {() => <PrivateRoute component={Dashboard} />}
      </Route>
      <Route path="/documents">
        {() => <PrivateRoute component={Documents} />}
      </Route>
      <Route path="/analytics">
        {() => <PrivateRoute component={Analytics} />}
      </Route>
      <Route path="/campaigns">
        {() => <PrivateRoute component={Campaigns} />}
      </Route>
      <Route path="/communications">
        {() => <PrivateRoute component={Communications} />}
      </Route>
      <Route path="/legal">
        {() => <PrivateRoute component={LegalResources} />}
      </Route>
      <Route path="/training">
        {() => <PrivateRoute component={Training} />}
      </Route>
      <Route path="/settings">
        {() => <PrivateRoute component={Settings} />}
      </Route>
      <Route path="/integrations">
        {() => <PrivateRoute component={Integrations} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell>
          <Router />
        </AppShell>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
