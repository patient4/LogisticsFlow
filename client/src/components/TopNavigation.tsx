import { Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { queryClient } from "@/lib/queryClient"

const navItems = [
  { label: "Order list", active: true, testId: "nav-tab-orders" },
  { label: "Tracking", active: false, testId: "nav-tab-tracking" },
  { label: "Dispatch", active: false, testId: "nav-tab-dispatch" },
  { label: "Costumer", active: false, testId: "nav-tab-costumer" },
  { label: "Carrier", active: false, testId: "nav-tab-carrier" },
]

export function TopNavigation() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    queryClient.clear(); // Clear cached data on logout
  };

  return (
    <nav className="bg-sidebar border-b border-sidebar-border">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          {navItems.map((item, index) => (
            <Button
              key={item.label}
              variant={item.active ? "default" : "ghost"}
              size="sm"
              className={item.active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}
              data-testid={item.testId}
            >
              {item.label}
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
          <Button variant="ghost" size="icon" className="text-sidebar-foreground" data-testid="button-profile">
            <User className="w-5 h-5" />
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