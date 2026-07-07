
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  Home, 
  Users, 
  Briefcase, 
  ClipboardList, 
  BookOpen, 
  GitBranch, 
  Settings, 
  LayoutDashboard, 
  LogOut,
  Sprout,
  Shield,
  Calendar,
  DollarSign,
  UserCircle
} from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { usePermissions } from "@/hooks/use-permissions";
import { UserProfile } from "./user-profile";

const mainMenuItems = [
  { href: "/dashboard", label: "Farm Overview", icon: Home, permission: 'ACCESS_DASHBOARD' },
  { href: "/roster", label: "Staff Roster", icon: Users, permission: 'VIEW_EMPLOYEES' },
  { href: "/users", label: "User Directory", icon: UserCircle, permission: 'VIEW_USERS' },
  { href: "/farmers", label: "Farmers Portal", icon: Sprout, permission: 'ACCESS_FARMERS' },
  { href: "/security", label: "Security Portal", icon: Shield, permission: 'ACCESS_SECURITY' },
  { href: "/events", label: "Events Portal", icon: Calendar, permission: 'ACCESS_EVENTS' },
  { href: "/finances", label: "Finances Portal", icon: DollarSign, permission: 'ACCESS_FINANCES' },
  { href: "/sops", label: "Farm Guidelines", icon: BookOpen, permission: 'VIEW_SOPS' },
];

const managementMenuItems = [
    { href: "/manager", label: "Manager Portal", icon: LayoutDashboard, permission: 'ACCESS_MANAGER_PORTAL' },
    { href: "/ceo", label: "CEO Executive", icon: Briefcase, permission: 'ACCESS_CEO_PORTAL' },
    { href: "/applications", label: "Hiring Portal", icon: GitBranch, permission: 'VIEW_APPLICATIONS' },
];

const adminMenuItems = [
    { href: "/admin", label: "System Config", icon: Settings, permission: 'ACCESS_ADMIN_PANEL' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const renderMenuItems = (items: any[]) => {
    return items.map((item) => {
        if (!hasPermission(item.permission)) return null;
        return (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                isActive={pathname === item.href}
                onClick={() => router.push(item.href)}
                tooltip={item.label}
                >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }).filter(Boolean);
  }

  return (
    <Sidebar collapsible="icon" className="border-r bg-card">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 h-14">
            <Image 
                src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png" 
                alt="Green Horizon Logo" 
                width={32} 
                height={32} 
                className="h-8 w-8 rounded-full object-cover"
            />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-bold tracking-tight">Green Horizon</span>
                <span className="text-[10px] uppercase text-muted-foreground font-semibold">Farm Management</span>
            </div>
        </div>
      </SidebarHeader>
      
      <SidebarMenu className="flex-1 p-2 space-y-4">
        <div className="px-2 pb-4 border-b border-white/5">
            <UserProfile />
        </div>

        <div>
            <p className="text-[10px] font-bold text-muted-foreground/60 px-3 pb-2 uppercase tracking-wider group-data-[collapsible=icon]:hidden">Operations</p>
            {renderMenuItems(mainMenuItems)}
        </div>
        
        <div>
            <p className="text-[10px] font-bold text-muted-foreground/60 px-3 pb-2 uppercase tracking-wider group-data-[collapsible=icon]:hidden">Leadership</p>
            {renderMenuItems(managementMenuItems)}
        </div>

        <div>
            <p className="text-[10px] font-bold text-muted-foreground/60 px-3 pb-2 uppercase tracking-wider group-data-[collapsible=icon]:hidden">Technical</p>
            {renderMenuItems(adminMenuItems)}
        </div>
      </SidebarMenu>
       
      <SidebarFooter className="p-4 mt-auto">
        <Button variant="outline" className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/10" onClick={() => router.push('/')}>
            <LogOut className="h-4 w-4 text-primary"/>
            <span className="group-data-[collapsible=icon]:hidden">Exit System</span>
        </Button>
        <div className="mt-4 flex justify-center">
            <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
