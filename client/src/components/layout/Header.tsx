import { useContext } from "react";
import { SidebarContext } from "@/App";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/authContext";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Header() {
  const { toggleSidebar } = useContext(SidebarContext);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
  
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  
  // Get user's initials for the avatar
  const getInitials = () => {
    if (!user) return "U";
    if (user.fullName) {
      return user.fullName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user.username.substring(0, 2).toUpperCase();
  };
  
  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "ar", name: "العربية" },
    { code: "zh", name: "中文" },
    { code: "ru", name: "Русский" },
    { code: "pt", name: "Português" }
  ];
  
  return (
    <header className="bg-white dark:bg-neutral-800 shadow-sm z-10 border-b border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Mobile menu button */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden rounded-md p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          aria-label="Toggle menu"
        >
          <span className="material-icons">menu</span>
        </button>
        
        {/* Search bar */}
        <div className="flex-1 max-w-2xl ml-4 mr-4 relative">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="material-icons text-neutral-400">search</span>
            </span>
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary" 
              placeholder="Dokumente, Kampagnen durchsuchen..." 
            />
          </div>
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
            aria-label={isDarkMode ? "Zum Lichtmodus wechseln" : "Zum Dunkelmodus wechseln"}
          >
            <span className={`material-icons ${isDarkMode ? "hidden" : "inline-block"}`}>dark_mode</span>
            <span className={`material-icons ${isDarkMode ? "inline-block" : "hidden"}`}>light_mode</span>
          </button>
          
          <button className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 relative">
            <span className="material-icons">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
          </button>
          
          <Dialog open={isLanguageDialogOpen} onOpenChange={setIsLanguageDialogOpen}>
            <DialogTrigger asChild>
              <button className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center">
                <span className="material-icons mr-1">language</span>
                <span className="text-sm">DE</span>
                <span className="material-icons text-sm">arrow_drop_down</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Sprache auswählen</DialogTitle>
                <DialogDescription>
                  Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setIsLanguageDialogOpen(false)}
                    className="flex items-center p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <span className="material-icons mr-2 text-neutral-500">language</span>
                    <span>{lang.name}</span>
                    {lang.code === "de" && (
                      <span className="ml-auto text-primary">
                        <span className="material-icons text-sm">check</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={() => setIsLanguageDialogOpen(false)}>
                  Schließen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full">
                <Avatar className="h-8 w-8 border border-neutral-200 dark:border-neutral-700">
                  <AvatarImage src={user?.profileImage || ""} alt={user?.fullName || user?.username || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <div className="font-medium">{user?.fullName || user?.username}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {user?.email || ""}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <span className="material-icons mr-2 text-lg">person</span>
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <span className="material-icons mr-2 text-lg">settings</span>
                <span>Einstellungen</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <span className="material-icons mr-2 text-lg">logout</span>
                <span>Abmelden</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
