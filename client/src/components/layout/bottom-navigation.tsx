import { Home, Dumbbell, TrendingUp, User } from "lucide-react";
import { Link, useLocation } from "wouter";

interface BottomNavigationProps {
  currentPage: "home" | "workouts" | "progress" | "profile";
}

export default function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const [location] = useLocation();

  const isActive = (page: string) => {
    switch (page) {
      case "home":
        return location === "/";
      case "workouts":
        return location.startsWith("/workout");
      case "progress":
        return location.startsWith("/progress");
      case "profile":
        return location.startsWith("/profile");
      default:
        return false;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          <Link href="/">
            <button 
              className={`flex flex-col items-center py-2 px-3 ${
                isActive("home") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="nav-home"
            >
              <Home size={20} />
              <span className="text-xs mt-1 font-medium">Home</span>
            </button>
          </Link>
          
          <button 
            className={`flex flex-col items-center py-2 px-3 ${
              isActive("workouts") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="nav-workouts"
          >
            <Dumbbell size={20} />
            <span className="text-xs mt-1">Workouts</span>
          </button>
          
          <Link href="/progress">
            <button 
              className={`flex flex-col items-center py-2 px-3 ${
                isActive("progress") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="nav-progress"
            >
              <TrendingUp size={20} />
              <span className="text-xs mt-1">Progress</span>
            </button>
          </Link>
          
          <button 
            className={`flex flex-col items-center py-2 px-3 ${
              isActive("profile") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="nav-profile"
          >
            <User size={20} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
