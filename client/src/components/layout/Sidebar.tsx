import { Link, useLocation } from "wouter";
import { useContext } from "react";
import { SidebarContext } from "@/App";
import { BarChart3, FileText, LineChart, MessagesSquare, GraduationCap, Settings, Scale, PieChart, Layers } from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { isSidebarOpen, closeSidebar } = useContext(SidebarContext);
  
  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}
      
      <aside className={`
        ${isSidebarOpen ? "fixed inset-y-0 left-0 z-50" : "hidden"} 
        md:flex md:relative md:flex-col md:w-64 bg-white dark:bg-neutral-800 shadow-md z-10 
        border-r border-neutral-200 dark:border-neutral-700 transition-all duration-200
      `}>
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L6 7V22H18V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h1 className="text-lg font-heading font-medium">Rechte-Verteidiger</h1>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/dashboard" 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 ${
                  location === "/dashboard" || location === "/" 
                    ? "text-primary bg-blue-50 dark:bg-blue-900/30 border-l-4 border-primary" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                <span>Wirkungsdashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/documents" 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 ${
                  location === "/documents" 
                    ? "text-primary bg-blue-50 dark:bg-blue-900/30 border-l-4 border-primary" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                <span className="material-icons mr-3">description</span>
                <span>Dokumente</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/analytics" 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 ${
                  location === "/analytics" 
                    ? "text-primary bg-blue-50 dark:bg-blue-900/30 border-l-4 border-primary" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                <span className="material-icons mr-3">insights</span>
                <span>Analysen</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/campaigns" 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 ${
                  location === "/campaigns" 
                    ? "text-primary bg-blue-50 dark:bg-blue-900/30 border-l-4 border-primary" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                <span className="material-icons mr-3">campaign</span>
                <span>Kampagnen</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/communications" 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 ${
                  location === "/communications" 
                    ? "text-primary bg-blue-50 dark:bg-blue-900/30 border-l-4 border-primary" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                <span className="material-icons mr-3">chat</span>
                <span>Kommunikation</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/legal" 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 ${
                  location === "/legal" 
                    ? "text-primary bg-blue-50 dark:bg-blue-900/30 border-l-4 border-primary" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                <span className="material-icons mr-3">gavel</span>
                <span>Rechtsressourcen</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/training" 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 ${
                  location === "/training" 
                    ? "text-primary bg-blue-50 dark:bg-blue-900/30 border-l-4 border-primary" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                <span className="material-icons mr-3">school</span>
                <span>Schulung</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/settings" 
                onClick={closeSidebar}
                className={`flex items-center px-4 py-3 ${
                  location === "/settings" 
                    ? "text-primary bg-blue-50 dark:bg-blue-900/30 border-l-4 border-primary" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                }`}
              >
                <span className="material-icons mr-3">settings</span>
                <span>Einstellungen</span>
              </Link>
            </li>
          </ul>
          
          <div className="mt-8 px-4">
            <h3 className="px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Integrationen
            </h3>
            <ul className="mt-2 space-y-1">
              <li>
                <Link 
                  href="/integrations" 
                  onClick={closeSidebar}
                  className={`flex items-center px-2 py-2 text-sm rounded ${
                    location === "/integrations" 
                      ? "text-primary bg-blue-50 dark:bg-blue-900/30" 
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  <span className="material-icons mr-3 text-neutral-500">integration_instructions</span>
                  <span>Uwazi Integration</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="mt-4 px-4">
            <h3 className="px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Cloud-Speicher
            </h3>
            <ul className="mt-2 space-y-1">
              <li>
                <Link
                  href="#gdrive"
                  className="flex items-center px-2 py-2 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                >
                  <span className="material-icons mr-3 text-neutral-500">cloud</span>
                  <span>Google Drive</span>
                </Link>
              </li>
              <li>
                <Link
                  href="#onedrive"
                  className="flex items-center px-2 py-2 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300"
                >
                  <span className="material-icons mr-3 text-neutral-500">cloud</span>
                  <span>OneDrive</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Profile" className="h-8 w-8 rounded-full" />
            <div className="ml-3">
              <p className="text-sm font-medium">Sarah Johnson</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Menschenrechtsanwältin</p>
            </div>
            <button className="ml-auto p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700">
              <span className="material-icons text-neutral-500">more_vert</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
