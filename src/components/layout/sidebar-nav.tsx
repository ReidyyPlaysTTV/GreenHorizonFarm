
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
  ChevronRight,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { usePermissions } from "@/hooks/use-permissions";
import { UserProfile } from "./user-profile";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

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
  const { state, toggleSidebar } = useSidebar();

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
                    "relative h-11 transition-all duration-300 rounded-xl px-4",
                    isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-primary/10 hover:text-primary"
                )}
                >
                <item.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-primary/60")} />
                <span className="font-black text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
                {isActive && <ChevronRight className="ml-auto h-3 w-3 animate-pulse" />}
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }).filter(Boolean);
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-black/60 backdrop-blur-3xl">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-4 transition-all duration-500 group-data-[collapsible=icon]:gap-0">
            <div className="relative shrink-0">
                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
                <Image 
                    src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/ChatGPTImage2jul202600_03_13.png" 
                    alt="Logo" 
                    width={44} 
                    height={44} 
                    className="relative h-11 w-11 rounded-2xl border border-white/10 object-cover shadow-2xl"
                />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
                <span className="text-xl font-black tracking-tighter text-white leading-tight">GREEN HORIZON</span>
                <span className="text-[8px] uppercase text-primary font-black tracking-[0.4em] opacity-80">v2.5 Enterprise</span>
            </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 space-y-8 scrollbar-hide">
        <div className="pt-2">
            <UserProfile />
        </div>

        <div className="space-y-6">
            <div className="space-y-1.5">
                <p className="text-[9px] font-black text-white/20 px-4 pb-2 uppercase tracking-[0.3em] group-data-[collapsible=icon]:hidden">Field Operations</p>
                {renderMenuItems(mainMenuItems)}
            </div>
            
            <div className="space-y-1.5">
                <p className="text-[9px] font-black text-white/20 px-4 pb-2 uppercase tracking-[0.3em] group-data-[collapsible=icon]:hidden">Leadership Hub</p>
                {renderMenuItems(managementMenuItems)}
            </div>

            <div className="space-y-1.5">
                <p className="text-[9px] font-black text-white/20 px-4 pb-2 uppercase tracking-[0.3em] group-data-[collapsible=icon]:hidden">Technical Control</p>
                {renderMenuItems(technicalMenuItems)}
            </div>
        </div>
      </SidebarContent>
       
      <SidebarFooter className="p-6 mt-auto space-y-4">
        <Button 
            variant="ghost" 
            className="w-full justify-start gap-4 h-12 rounded-2xl text-white/30 hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all group overflow-hidden" 
            onClick={() => {
                localStorage.removeItem('loggedInUser');
                router.push('/');
            }}
        >
            <LogOut className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-1"/>
            <span className="group-data-[collapsible=icon]:hidden font-black text-[10px] uppercase tracking-widest">Terminate Session</span>
        </Button>

        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-10 w-full rounded-2xl text-white/20 hover:text-primary hover:bg-white/5 border border-white/5 transition-all"
            >
                {state === 'expanded' ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
