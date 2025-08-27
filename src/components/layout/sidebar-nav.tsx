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
import { Home, Users, Archive, ShieldAlert, FileText, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";

const menuItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/archive", label: "Fired/Resigned", icon: Archive },
  { href: "/command", label: "DOC Command", icon: ShieldAlert },
  { href: "/applications", label: "Application Center", icon: FileText },
  { href: "/admin", label: "Admin Panel", icon: ShieldCheck },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg">
                <Image src="https://r2.fivemanage.com/4AF89ztbnR3tjjy8HcUAp/Doc_logo.png" alt="DOC Logo" width={24} height={24} className="h-6 w-6" />
            </div>
            <span className="text-lg font-semibold">DOC Roster</span>
        </div>
      </SidebarHeader>
      <SidebarMenu className="flex-1 p-2">
        {menuItems.map((item) => (
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
        ))}
      </SidebarMenu>
      <SidebarFooter className="p-2">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => router.push('/login')}>
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
