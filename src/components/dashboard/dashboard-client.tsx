

"use client";

import type { Personnel, Application, PersonnelEvent, Announcement, GalleryImage } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, UserCheck, UserX, ArrowUp, ArrowDown, UserPlus, UserMinus, ShieldAlert, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "../ui/badge";
import { RefreshButton } from "../layout/refresh-button";
import { ScrollArea } from "../ui/scroll-area";
import { Announcements } from "./announcements";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { AddGalleryImageDialog } from "./add-gallery-image-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { deleteGalleryImage } from "@/lib/actions/gallery-actions";

interface DashboardClientProps {
  personnel: Personnel[];
  applications: Application[];
  recentActivity: PersonnelEvent[];
  announcements: Announcement[];
  galleryImages: GalleryImage[];
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

export function DashboardClient({ personnel, applications, recentActivity, announcements, galleryImages: initialGalleryImages }: DashboardClientProps) {
  const pendingApplications = applications.filter(app => app.status === "Pending").length;
  const { hasPermission } = usePermissions();
  const canManageGallery = hasPermission('MANAGE_GALLERY');
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  const handleDeleteImage = async (id: string) => {
    setIsDeleting(prev => ({ ...prev, [id]: true }));
    try {
      const result = await deleteGalleryImage(id);
      if (result.success) {
        toast({ title: "Image Removed", description: "The image has been removed from the gallery." });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "Could not remove the image." });
    } finally {
      setIsDeleting(prev => ({ ...prev, [id]: false }));
    }
  }


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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Photo Gallery</CardTitle>
                <CardDescription>Highlights from the Department of Corrections.</CardDescription>
            </div>
            {canManageGallery && <AddGalleryImageDialog />}
          </CardHeader>
          <CardContent>
             {initialGalleryImages.length > 0 ? (
                <Carousel 
                    opts={{ loop: true }} 
                    plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
                    className="w-full"
                >
                    <CarouselContent>
                        {initialGalleryImages.map((image, index) => (
                            <CarouselItem key={image.id || index}>
                                <div className="aspect-video relative overflow-hidden rounded-lg group">
                                    <Image 
                                        src={image.src} 
                                        alt={image.alt || 'Gallery image'}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={image.hint}
                                    />
                                    {canManageGallery && (
                                       <Button 
                                            variant="destructive" 
                                            size="icon" 
                                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteImage(image.id)}
                                            disabled={isDeleting[image.id]}
                                        >
                                            {isDeleting[image.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                       </Button>
                                    )}
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
             ) : (
                <div className="flex items-center justify-center h-40 rounded-lg border border-dashed aspect-video">
                    <p className="text-muted-foreground">No images in the gallery yet.</p>
                </div>
             )}
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
