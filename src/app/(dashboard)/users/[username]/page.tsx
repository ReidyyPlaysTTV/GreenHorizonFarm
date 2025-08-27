
import { getUsers, getPersonnel } from "@/lib/actions";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Briefcase, Star, Hash, Mail } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const getRoleClass = (role: string) => {
    switch (role) {
        case "Administrator":
            return "animate-rainbow-text bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent";
        case "Developer":
            return "animate-dev-text";
        case "Commissioners Office":
            return "animate-co-text";
        case "High Command":
            return "animate-hc-text";
        case "Command":
            return "animate-cmd-text";
        case "NCOs":
            return "animate-nco-text";
        case "Corrections":
             return "animate-co-text-yellow";
        case "User":
            return "animate-user-text";
        case "Training":
            return "text-yellow-400";
        default:
            return "";
    }
}


export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const decodedUsername = decodeURIComponent(username);

  const users = await getUsers();
  const personnel = await getPersonnel();

  const user = users.find(u => u.username === decodedUsername);

  if (!user) {
    notFound();
  }

  const personnelRecord = personnel.find(p => p.name === user.username);
  
  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
        case 'Active': return 'secondary';
        case 'LOA':
        case 'Medical Leave':
            return 'default';
        case 'Inactive':
        case 'Suspended':
        case 'Low Activity':
            return 'destructive';
        default: return 'secondary';
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center space-x-6 mb-8">
        <Avatar className="h-24 w-24 border-2 border-primary">
          <AvatarImage src={personnelRecord?.avatarUrl} />
          <AvatarFallback className="text-3xl">
            <User />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{user.username}</h1>
          <p className="text-xl text-muted-foreground">{personnelRecord?.rank || 'Civilian'}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <span>Identity</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Username</span>
                        <span className="font-medium">{user.username}</span>
                    </div>
                     {personnelRecord?.discordUsername && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Discord</span>
                            <span className="font-medium">{personnelRecord.discordUsername}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Permission Group</span>
                         <span className={cn("font-bold text-lg", getRoleClass(user.role))}>{user.role}</span>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span>Security</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">User Since</span>
                        <span className="font-medium">N/A</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Login</span>
                        <span className="font-medium">N/A</span>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
             {personnelRecord ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Briefcase className="h-5 w-5 text-primary" />
                           <span>Roster Information</span>
                        </CardTitle>
                        <CardDescription>Details from the official DOC roster.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Star className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Rank</p>
                                <p className="font-semibold">{personnelRecord.rank}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Hash className="h-6 w-6 text-muted-foreground" />
                             <div>
                                <p className="text-sm text-muted-foreground">Callsign</p>
                                <p className="font-semibold">#{personnelRecord.badgeNumber}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Briefcase className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Department</p>
                                <p className="font-semibold">{personnelRecord.department}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="w-6 h-6 flex items-center justify-center">
                                <Image src={personnelRecord.avatarUrl} alt="Insignia" width={20} height={20} className="object-contain" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge variant={getStatusBadgeVariant(personnelRecord.status)}>{personnelRecord.status}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
             ) : (
                <Card className="h-full flex flex-col items-center justify-center text-center">
                    <CardHeader>
                        <CardTitle>Not on Roster</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">This user is not an active DOC personnel member.</p>
                    </CardContent>
                </Card>
             )}
        </div>
      </div>
    </div>
  );
}
