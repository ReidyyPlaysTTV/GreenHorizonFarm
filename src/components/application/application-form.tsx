
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getApplicationFormFields, submitApplication } from "@/lib/actions";
import type { FormFieldData } from "@/lib/actions/form-actions";

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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function buildZodSchema(fields: FormFieldData[]) {
  const schemaShape: { [key: string]: z.ZodTypeAny } = {};
  fields.forEach(field => {
    let fieldSchema;
    switch (field.type) {
      case 'text':
        fieldSchema = z.string().min(1, `${field.label} is required.`);
        break;
      case 'textarea':
        fieldSchema = z.string().min(10, `${field.label} requires at least 10 characters.`);
        break;
      case 'select':
        fieldSchema = z.string({ required_error: `Please make a selection for ${field.label}.`});
        break;
      default:
        fieldSchema = z.any();
    }
    schemaShape[field.id!] = fieldSchema;
  });
  return z.object(schemaShape);
}


export function ApplicationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formFields, setFormFields] = useState<FormFieldData[]>([]);
  const [zodSchema, setZodSchema] = useState<z.ZodObject<any> | null>(null);

  useEffect(() => {
    const fetchFields = async () => {
        setIsLoading(true);
        try {
            const fields = await getApplicationFormFields();
            setFormFields(fields);
            const schema = buildZodSchema(fields);
            setZodSchema(schema);
        } catch (err) {
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Failed to load application form. Please try again later."
            });
        } finally {
            setIsLoading(false);
        }
    };
    fetchFields();
  }, [toast]);

  const form = useForm({
    resolver: zodSchema ? zodResolver(zodSchema) : undefined,
  });
  
  useEffect(() => {
      if (zodSchema) {
          form.reset();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zodSchema, form.reset]);


  async function onSubmit(values: z.infer<z.ZodObject<any>>) {
    setIsLoading(true);
    try {
        await submitApplication(values);
        toast({
            title: "Application Submitted",
            description: "Thank you for your interest. We will review your application shortly.",
        });
        router.push("/login");
    } catch(err) {
        toast({
            variant: "destructive",
            title: "Submission Error",
            description: "There was an error submitting your application. Please try again."
        });
    } finally {
        setIsLoading(false);
    }
  }

  const renderFormField = (fieldData: FormFieldData) => {
    const { id, type, label, options } = fieldData;

    return (
        <FormField
          key={id}
          control={form.control}
          name={id!}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                {type === 'text' && <Input placeholder={`Your ${label.toLowerCase()}`} {...field} />}
                {type === 'textarea' && <Textarea placeholder="Please provide a detailed response..." className="min-h-[120px]" {...field} />}
                {type === 'select' && (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                        <SelectValue placeholder={`Select an option for ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {options?.map(opt => <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
    )
  }

  if (isLoading && formFields.length === 0) {
      return (
          <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {formFields.map(renderFormField)}
        <Button type="submit" className="w-full" disabled={isLoading || !zodSchema}>
           {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Submit Application"
          )}
        </Button>
      </form>
    </Form>
  );
}

