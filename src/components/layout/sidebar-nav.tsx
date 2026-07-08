
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
  SidebarContent,
} from "@/components/ui/sidebar";
import { 
  Home, 
  Users, 
  Briefcase, 
  BookOpen, 
  GitBranch, 
  Settings, 
  LayoutDashboard, 
  LogOut,
  Sprout,
  Shield,
  Calendar,
  DollarSign,
  UserCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { usePermissions } from "@/hooks/use-permissions";
import { UserProfile } from "./user-profile";
import { cn } from "@/lib/utils";

const mainMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, permission: 'ACCESS_DASHBOARD' },
  { href: "/roster", label: "Staff Roster", icon: Users, permission: 'VIEW_EMPLOYEES' },
  { href: "/users", label: "Directory", icon: UserCircle, permission: 'VIEW_USERS' },
  { href: "/farmers", label: "Farmers Portal", icon: Sprout, permission: 'ACCESS_FARMERS' },
  { href: "/security", label: "Security", icon: Shield, permission: 'ACCESS_SECURITY' },
  { href: "/events", label: "Events", icon: Calendar, permission: 'ACCESS_EVENTS' },
  { href: "/finances", label: "Accounting", icon: DollarSign, permission: 'ACCESS_FINANCES' },
  { href: "/sops", label: "Guidelines", icon: BookOpen, permission: 'VIEW_SOPS' },
];

const managementMenuItems = [
    { href: "/manager", label: "Ops Manager", icon: LayoutDashboard, permission: 'ACCESS_MANAGER_PORTAL' },
    { href: "/ceo", label: "Executive", icon: Briefcase, permission: 'ACCESS_CEO_PORTAL' },
    { href: "/applications", label: "Recruitment", icon: GitBranch, permission: 'VIEW_APPLICATIONS' },
];

const technicalMenuItems = [
    { href: "/admin", label: "System Config", icon: Settings, permission: 'ACCESS_ADMIN_PANEL' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const renderMenuItems = (items: any[]) => {
    return items.map((item) => {
        if (!hasPermission(item.permission)) return null;
        const isActive = pathname === item.href;
        return (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                isActive={isActive}
                onClick={() => router.push(item.href)}
                tooltip={item.label}
                className={cn(
                    "relative h-10 transition-all duration-300 rounded-xl px-4",
                    isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-primary/10 hover:text-primary"
                )}
                >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-primary/60")} />
                <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                {isActive && <ChevronRight className="ml-auto h-3 w-3 animate-pulse" />}
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }).filter(Boolean);
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-black/40 backdrop-blur-xl">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-4 transition-all duration-500 group-data-[collapsible=icon]:gap-0">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Image 
                    src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png" 
                    alt="Logo" 
                    width={40} 
                    height={40} 
                    className="relative h-10 w-10 rounded-xl border border-primary/20 object-cover"
                />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-lg font-black tracking-tighter text-white leading-none">GREEN HORIZON</span>
                <span className="text-[8px] uppercase text-primary font-black tracking-[0.3em] mt-1">Management v2.0</span>
            </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 space-y-8">
        <div className="pt-2">
            <UserProfile />
        </div>

        <div className="space-y-4">
            <div className="space-y-1">
                <p className="text-[9px] font-black text-white/30 px-4 pb-2 uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden">Field Operations</p>
                {renderMenuItems(mainMenuItems)}
            </div>
            
            <div className="space-y-1">
                <p className="text-[9px] font-black text-white/30 px-4 pb-2 uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden">Leadership Hub</p>
                {renderMenuItems(managementMenuItems)}
            </div>

            <div className="space-y-1">
                <p className="text-[9px] font-black text-white/30 px-4 pb-2 uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden">Technical</p>
                {renderMenuItems(technicalMenuItems)}
            </div>
        </div>
      </SidebarContent>
       
      <SidebarFooter className="p-6 mt-auto space-y-4">
        <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-12 rounded-xl text-white/40 hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all group" 
            onClick={() => router.push('/')}
        >
            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1"/>
            <span className="group-data-[collapsible=icon]:hidden font-black text-[10px] uppercase tracking-widest">Sign Out</span>
        </Button>
        <div className="flex justify-center group-data-[collapsible=icon]:rotate-180 transition-transform">
            <SidebarTrigger className="h-10 w-10 text-white/20 hover:text-primary transition-colors" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
