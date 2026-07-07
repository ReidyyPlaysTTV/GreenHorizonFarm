
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ClipboardCopy } from "lucide-react";
import React, { useState, useEffect } from "react";
import { getApplicationFormFields, submitApplication } from "@/lib/actions";
import type { FormFieldData } from "@/lib/types";

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
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

function buildZodSchema(fields: FormFieldData[]) {
  const schemaShape: { [key: string]: z.ZodTypeAny } = {};
  fields.forEach((field, index) => {
    let fieldSchema;
    const requiredError = `${field.label} is required.`;
    const fieldLabelLower = field.label.toLowerCase();
    const fieldId = field.id || `field_${index}`;

    switch (field.type) {
      case 'text':
        fieldSchema = z.string();
         if (fieldLabelLower.includes('email')) {
          fieldSchema = fieldSchema.email({ message: "Please enter a valid email address."});
        }
        if (field.required) {
          fieldSchema = fieldSchema.min(1, requiredError);
        } else {
          fieldSchema = fieldSchema.optional().or(z.literal(''));
        }
        break;
      case 'textarea':
        fieldSchema = z.string();
        if (field.required) {
          fieldSchema = fieldSchema.min(10, `${field.label} requires at least 10 characters.`);
        } else {
          fieldSchema = fieldSchema.optional().or(z.literal(''));
        }
        break;
      case 'select':
        fieldSchema = z.string();
        if(field.required) {
            fieldSchema = fieldSchema.refine(value => value && value.length > 0, { message: `Please make a selection for ${field.label}.` });
        } else {
             fieldSchema = fieldSchema.optional().or(z.literal(''));
        }
        break;
      default:
        fieldSchema = z.any();
    }
    schemaShape[fieldId] = fieldSchema;
  });
  return z.object(schemaShape);
}


export function ApplicationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formFields, setFormFields] = useState<FormFieldData[]>([]);
  const [submittedApplicationId, setSubmittedApplicationId] = useState<string | null>(null);

  // Initialize form at the top level
  const form = useForm({
    resolver: undefined, // Will be set in useEffect
    defaultValues: {},   // Will be set in useEffect
  });

  useEffect(() => {
    const fetchAndBuildForm = async () => {
        setIsLoading(true);
        try {
            const fields = await getApplicationFormFields();
            if (fields.length > 0) {
              const schema = buildZodSchema(fields);
              const defaultValues = fields.reduce((acc, field, index) => ({ ...acc, [field.id || `field_${index}`]: '' }), {});

              // Now update the form with the schema and default values
              form.reset(defaultValues);
              // A trick to update the resolver dynamically. This is not standard but works for this case.
              (form as any).resolver = zodResolver(schema);
              
              setFormFields(fields);
            } else {
              setFormFields([]);
            }
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
    fetchAndBuildForm();
  }, [toast, form]);


  async function onSubmit(values: z.infer<z.ZodObject<any>>) {
    setIsSubmitting(true);
    try {
        const result = await submitApplication(values);
        if (result.success && result.applicationId) {
             setSubmittedApplicationId(result.applicationId);
             toast({
                title: "Application Submitted",
                description: "Your application has been received successfully.",
            });
        } else {
             throw new Error(result.message || "An unknown error occurred during submission.");
        }
    } catch(err: any) {
        toast({
            variant: "destructive",
            title: "Submission Error",
            description: err.message || "There was an error submitting your application. Please try again."
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const renderFormField = (fieldData: FormFieldData, index: number) => {
    const { id, type, label, options, required } = fieldData;
    const fieldLabelLower = label.toLowerCase();
    const fieldId = id || `field_${index}`;
    
    let inputComponent;
    switch(type) {
        case 'text':
            let inputType = 'text';
            if (fieldLabelLower.includes('email')) inputType = 'email';
            if (fieldLabelLower.includes('age')) inputType = 'number';
            inputComponent = <Input placeholder={`Your ${label.toLowerCase()}`} type={inputType} />;
            break;
        case 'textarea':
            inputComponent = <Textarea placeholder="Please provide a detailed response..." className="min-h-[120px]" />;
            break;
        case 'select':
              inputComponent = (
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder={`Select an option for ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {options?.map(opt => <SelectItem key={opt.id || opt.value} value={opt.value}>{opt.value}</SelectItem>)}
                    </SelectContent>
                </Select>
              );
              break;
        default:
            return null;
    }


    return (
        <FormField
          key={fieldId}
          control={form.control}
          name={fieldId}
          render={({ field }) => {
            return (
                <FormItem>
                <FormLabel>
                    {label}
                    {required && <span className="text-destructive"> *</span>}
                </FormLabel>
                <FormControl>
                    {type === 'select' ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={`Select an option for ${label}`} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {options?.map(opt => <SelectItem key={opt.id || opt.value} value={opt.value}>{opt.value}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    ) : (
                       React.cloneElement(inputComponent, {...field})
                    )}
                </FormControl>
                <FormMessage />
                </FormItem>
            )
          }}
        />
    )
  }

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }
  
  if (submittedApplicationId) {
      return (
          <Alert>
              <AlertTitle className="text-xl font-bold">Application Received!</AlertTitle>
              <AlertDescription className="mt-2">
                  Thank you for your interest. Please save your Application ID below. You can use it to check the status of your application later.
              </AlertDescription>
              <div className="my-4 p-3 bg-muted rounded-md flex items-center justify-between">
                <code className="text-sm font-semibold">{submittedApplicationId}</code>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                        navigator.clipboard.writeText(submittedApplicationId);
                        toast({ title: "Copied to clipboard!" });
                    }}
                >
                    <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
              <Button className="w-full" onClick={() => router.push('/check-status')}>
                  Check Status Now
              </Button>
          </Alert>
      )
  }
  
  if (formFields.length === 0) {
      return (
           <div className="flex justify-center items-center h-48 text-center text-muted-foreground">
              <p>The application form is not available at this time. <br/> Please check back later.</p>
          </div>
      )
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {formFields.map((field, index) => renderFormField(field, index))}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
           {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Submit Application"
          )}
        </Button>
      </form>
    </Form>
  );
}
