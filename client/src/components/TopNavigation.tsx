import { Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { queryClient } from "@/lib/queryClient"
import { Link, useLocation } from "wouter"

const navItems = [
  { label: "Dashboard", url: "/", testId: "nav-tab-dashboard" },
  { label: "Orders", url: "/orders", testId: "nav-tab-orders" },
  { label: "Tracking", url: "/tracking", testId: "nav-tab-tracking" },
  { label: "Customers", url: "/customers", testId: "nav-tab-customers" },
  { label: "Carriers", url: "/carriers", testId: "nav-tab-carriers" },
]

export function TopNavigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logout();
    queryClient.clear(); // Clear cached data on logout
  };

  return (
    <nav className="bg-sidebar border-b border-sidebar-border">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          <div className="text-sidebar-foreground font-bold text-lg mr-8" data-testid="logo-text">
            LOGO
          </div>
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant={location === item.url ? "default" : "ghost"}
              size="sm"
              className={location === item.url ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}
              data-testid={item.testId}
              asChild
            >
              <Link href={item.url}>{item.label}</Link>
            </Button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-sidebar-foreground" data-testid="text-username">
            Welcome, {user?.username}
          </span>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-sidebar-foreground" data-testid="button-profile" asChild>
            <Link href="/profile">
              <User className="w-5 h-5" />
            </Link>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-sidebar-foreground hover:text-destructive" 
            onClick={handleLogout}
            data-testid="button-logout"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  )
}