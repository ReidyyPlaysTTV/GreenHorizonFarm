

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
import { Home, Users, Archive, ShieldAlert, FileText, LogOut, ShieldCheck, User, Contact, History, BookMarked, Sun, Moon } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { BugReportForm } from "./bug-report-form";
import { SuggestionForm } from "./suggestion-form";
import { UserProfile } from "./user-profile";
import { usePermissions } from "@/hooks/use-permissions";

const mainMenuItems = [
  { href: "/dashboard", label: "Home", icon: Home, permission: 'ACCESS_DASHBOARD' },
  { href: "/roster", label: "Roster", icon: Users, permission: 'VIEW_ROSTER' },
  { href: "/users", label: "Users", icon: User, permission: 'VIEW_USERS' },
  { href: "/callsigns", label: "Callsigns", icon: Contact, permission: 'VIEW_CALLSIGNS' },
  { href: "/sops", label: "DOC SOPs", icon: BookMarked, permission: 'VIEW_SOPS' },
];

const commandMenuItems = [
    { href: "/archive", label: "Fired/Resigned", icon: Archive, permission: 'VIEW_ARCHIVE' },
    { href: "/command", label: "DOC Command", icon: ShieldAlert, permission: 'ACCESS_COMMAND_CENTER' },
    { href: "/applications", label: "Application Center", icon: FileText, permission: 'VIEW_APPLICATIONS' },
    { href: "/logs", label: "DOC Logs", icon: History, permission: 'VIEW_LOGS' },
];

const adminMenuItems = [
    { href: "/admin", label: "Admin Panel", icon: ShieldCheck, permission: 'ACCESS_ADMIN_PANEL' },
];


export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission } = usePermissions();


  const renderMenuItems = (items: typeof mainMenuItems) => {
    return items.map((item) => {
        if (!hasPermission(item.permission as any)) return null;
        return (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                isActive={pathname === item.href}
                onClick={() => router.push(item.href)}
                tooltip={item.label}
                >
                <item.icon />
                <span>{item.label}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }).filter(Boolean); // Filter out null items
  }

  const renderedMain = renderMenuItems(mainMenuItems);
  const renderedCommand = renderMenuItems(commandMenuItems);
  const renderedAdmin = renderMenuItems(adminMenuItems);


  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center justify-center gap-2 h-10">
            <Image src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png" alt="DOC Logo" width={28} height={28} className="h-7 w-7" />
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">DOC Roster</span>
        </div>
      </SidebarHeader>
      <SidebarMenu className="flex-1 p-2 space-y-4">
        {renderedMain.length > 0 && (
            <div>
                <p className="text-xs font-semibold text-muted-foreground px-2 pb-1 group-data-[collapsible=icon]:hidden">Main</p>
                {renderedMain}
            </div>
        )}
        {renderedCommand.length > 0 && (
            <div>
                <p className="text-xs font-semibold text-muted-foreground px-2 pb-1 group-data-[collapsible=icon]:hidden">NCOs and Command+</p>
                {renderedCommand}
            </div>
        )}
        {renderedAdmin.length > 0 && (
            <div>
                <p className="text-xs font-semibold text-muted-foreground px-2 pb-1 group-data-[collapsible=icon]:hidden">Admin</p>
                {renderedAdmin}
            </div>
        )}
      </SidebarMenu>
       <Separator className="my-2" />
      <div className="p-2 space-y-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
        <SuggestionForm />
        <BugReportForm />
      </div>
       <Separator className="my-2" />
      <SidebarFooter className="p-2 mt-auto">
        <UserProfile />
        <Button variant="ghost" className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center" onClick={() => router.push('/')}>
            <LogOut className="h-4 w-4"/>
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </Button>
        <div className="group-data-[collapsible=icon]:hidden mt-2">
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
