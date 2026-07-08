
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { submitAccessRequest } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import Link from "next/link";

const formSchema = z.object({
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters." })
    .regex(/^[A-Z][a-z]+ [A-Z][a-z]+$/, "Username must be your IC Name (e.g. 'Leon Green')"),
  password: z.string().min(8, { message: "Password must be at least 8 characters."}),
});

export function RequestAccessForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await submitAccessRequest(values);
    if (result.success) {
        setIsSuccess(true);
        toast({
            title: "Request Transmitted",
            description: "Your portal access request is now awaiting review.",
        });
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
        });
    }
    setIsLoading(false);
  }

  if (isSuccess) {
      return (
          <div className="text-center space-y-6 py-8">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center border-4 border-emerald-500/20">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">Request Logged</h2>
                  <p className="text-muted-foreground font-medium">Your account request has been sent to Green Horizon Management. Please wait for an administrator to approve your credentials.</p>
              </div>
              <Button asChild className="w-full h-12 rounded-xl font-bold">
                  <Link href="/">Return to Main Entrance</Link>
              </Button>
          </div>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert variant="destructive" className="border-red-500/50 bg-red-950 text-red-400 [&>svg]:text-red-400">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="font-black uppercase tracking-widest text-xs">Security Protocol</AlertTitle>
          <AlertDescription className="text-red-400/90 text-[10px] font-bold leading-relaxed uppercase mt-1">
            DO NOT USE YOUR EVERYDAY PASSWORDS. THE MANAGEMENT SYSTEM DATABASE IS ACCESSIBLE TO DEVELOPERS. 
            PLEASE USE A UNIQUE IN-CHARACTER PASSWORD.
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">IC Full Name (First Last)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Leon Green" {...field} className="h-12 bg-background/50 border-white/10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground">System Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="h-12 bg-background/50 border-white/10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Request System Entry"
          )}
        </Button>
      </form>
    </Form>
  );
}
