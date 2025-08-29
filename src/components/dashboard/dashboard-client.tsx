

"use client";

import type { Personnel, Application, PersonnelEvent, Announcement } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, UserCheck, UserX, ArrowUp, ArrowDown, UserPlus, UserMinus, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../ui/badge";
import { RefreshButton } from "../layout/refresh-button";
import { ScrollArea } from "../ui/scroll-area";
import { Announcements } from "./announcements";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";

interface DashboardClientProps {
  personnel: Personnel[];
  applications: Application[];
  recentActivity: PersonnelEvent[];
  announcements: Announcement[];
}

const eventIcons = {
    Hired: <UserPlus className="h-4 w-4 text-green-500" />,
    Fired: <UserMinus className="h-4 w-4 text-red-500" />,
    Promoted: <ArrowUp className="h-4 w-4 text-blue-500" />,
    Demoted: <ArrowDown className="h-4 w-4 text-orange-500" />,
}

const eventColors = {
    Hired: "secondary",
    Fired: "destructive",
    Promoted: "default",
    Demoted: "secondary",
} as const;

const galleryImages = [
    { src: "https://i.imgur.com/G53P09O.png", alt: "Group of officers standing in a line", hint: "officer group" },
    { src: "https://i.imgur.com/gG943d2.png", alt: "Officer talking to an inmate in a cell", hint: "officer inmate" },
    { src: "https://i.imgur.com/2MAbA7k.png", alt: "Inmates in the prison yard", hint: "prison yard" },
    { src: "https://i.imgur.com/gRMA9v0.png", alt: "Medical staff attending to a person on a stretcher", hint: "medical emergency" },
    { src: "https://i.imgur.com/5L9yXG9.png", alt: "Prison bus driving away from the facility", hint: "prison bus" },
];


export function DashboardClient({ personnel, applications, recentActivity, announcements }: DashboardClientProps) {
  const pendingApplications = applications.filter(app => app.status === "Pending").length;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to the Department of Corrections Roster.</p>
        </div>
        <RefreshButton />
      </div>

      <Announcements initialAnnouncements={announcements} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Personnel</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personnel.length}</div>
            <p className="text-xs text-muted-foreground">officers on active duty</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApplications}</div>
            <p className="text-xs text-muted-foreground">awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Apps (Month)</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2</div>
            <p className="text-xs text-muted-foreground">since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fired/Resigned (Month)</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+1</div>
             <p className="text-xs text-muted-foreground">since last month</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Photo Gallery</CardTitle>
            <CardDescription>Highlights from the Department of Corrections.</CardDescription>
          </CardHeader>
          <CardContent>
            <Carousel 
                opts={{ loop: true }} 
                plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
                className="w-full"
            >
                <CarouselContent>
                    {galleryImages.map((image, index) => (
                        <CarouselItem key={index}>
                            <div className="aspect-video relative overflow-hidden rounded-lg">
                                <Image 
                                    src={image.src} 
                                    alt={image.alt}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={image.hint}
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest personnel changes.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72">
                    {recentActivity.length > 0 ? (
                    <div className="space-y-4 pr-4">
                        {recentActivity.map(event => (
                            <div key={event.id} className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                    {eventIcons[event.event_type] || <ShieldAlert className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 text-sm">
                                    <p className="font-medium">{event.personnel_name}</p>
                                    <p className="text-muted-foreground">{event.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(event.date, { addSuffix: true })}
                                    </p>
                                </div>
                                <Badge variant={eventColors[event.event_type]} className="text-xs">{event.event_type}</Badge>
                            </div>
                        ))}
                    </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 rounded-lg border border-dashed">
                            <p className="text-muted-foreground">No recent activity.</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
