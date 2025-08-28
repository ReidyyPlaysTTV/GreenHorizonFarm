

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import { logUserAction, loginUser } from "@/lib/actions";
import { Checkbox } from "../ui/checkbox";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean().default(false).optional(),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  useEffect(() => {
    const savedCreds = localStorage.getItem('rememberedCredentials');
    if (savedCreds) {
        const { username, password } = JSON.parse(savedCreds);
        form.setValue('username', username);
        form.setValue('password', password);
        form.setValue('rememberMe', true);
    }
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
        const result = await loginUser(values);

        if (result.success) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('loggedInUser', values.username);
                
                if (values.rememberMe) {
                    localStorage.setItem('rememberedCredentials', JSON.stringify({username: values.username, password: values.password}));
                } else {
                    localStorage.removeItem('rememberedCredentials');
                }
            }
            
            await logUserAction(values.username, "Login", `User '${values.username}' signed in.`);

            toast({
                title: "Login Successful",
                description: `Welcome back, ${values.username}!`,
            });
            
            router.push("/dashboard");
        } else {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: result.message || "An unknown error occurred.",
            });
        }
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Login Error",
            description: "An unexpected error occurred during login.",
        });
    }


    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Username" {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Remember me
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </Form>
  );
}
