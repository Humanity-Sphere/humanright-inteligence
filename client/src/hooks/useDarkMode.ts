import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useDarkMode() {
  // Initialize with system preference or stored preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check if there's a theme preference in localStorage
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    
    if (savedTheme) {
      return savedTheme === "dark";
    }
    
    // Otherwise, check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  
  useEffect(() => {
    // Update the HTML class and localStorage when isDarkMode changes
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);
  
  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a preference
      if (!localStorage.getItem("theme")) {
        setIsDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);
  
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };
  
  return { isDarkMode, toggleDarkMode };
}
