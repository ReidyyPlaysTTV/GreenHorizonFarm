"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";

// In a real application, these values would be fetched from a database.
const defaultFormValues = {
    fullNameLabel: "Full Name",
    dateOfBirthLabel: "Date of Birth",
    reasonLabel: "Why do you want to join the DOC?",
    reasonPlaceholder: "Explain your motivations, relevant skills, and what you hope to achieve...",
};

const formSchema = z.object({
  fullNameLabel: z.string().min(1, "Label cannot be empty."),
  dateOfBirthLabel: z.string().min(1, "Label cannot be empty."),
  reasonLabel: z.string().min(1, "Label cannot be empty."),
  reasonPlaceholder: z.string().min(1, "Placeholder cannot be empty."),
});

export function ApplicationFormEditor() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Simulate API call to save form settings
    setTimeout(() => {
      console.log("Saving form settings:", values);
      toast({
        title: "Form Settings Saved",
        description: "The application form has been updated successfully.",
      });
      setIsLoading(false);
    }, 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Application Form</CardTitle>
        <CardDescription>
          Customize the labels and placeholders for the public application form.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="fullNameLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name Field Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirthLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth Field Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reasonLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason Field Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="reasonPlaceholder"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Reason Field Placeholder</FormLabel>
                    <FormControl>
                        <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
