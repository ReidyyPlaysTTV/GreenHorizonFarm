
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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { submitAccessRequest } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";

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
        toast({
            title: "Request Submitted",
            description: "Your access request has been sent for review.",
        });
        router.push("/login");
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
        });
    }
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert variant="destructive" className="border-red-500/50 bg-red-950 text-red-400 [&>svg]:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">Identity Verification</AlertTitle>
          <AlertDescription className="text-red-400/80 text-xs">
            Your username must be your In-Character (IC) Name in "First Last" format. 
            Do not use your OOC name or a random nickname.
          </AlertDescription>
        </Alert>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IC Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Leon Green" {...field} />
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
              <FormLabel>Secure Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Request Account Access"
          )}
        </Button>
      </form>
    </Form>
  );
}
