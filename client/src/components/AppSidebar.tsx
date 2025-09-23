import { Home, Package, Truck, Users, DollarSign, Settings } from "lucide-react"
import { Link, useLocation } from "wouter"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home, testId: "nav-dashboard" },
  { title: "Order list", url: "/orders", icon: Package, testId: "nav-orders" },
  { title: "Tracking", url: "/tracking", icon: Truck, testId: "nav-tracking" },
  { title: "Customer", url: "/customers", icon: Users, testId: "nav-customers" },
  { title: "Carrier", url: "/carriers", icon: DollarSign, testId: "nav-carriers" },
]

export function AppSidebar() {
  const [location] = useLocation()
  
  return (
    <Sidebar>
      <SidebarContent className="bg-sidebar">
        <div className="p-6">
          <div className="text-sidebar-foreground font-bold text-lg" data-testid="logo-text">
            LOGO
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}