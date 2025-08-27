
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
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

function buildZodSchema(fields: FormFieldData[]) {
  const schemaShape: { [key: string]: z.ZodTypeAny } = {};
  fields.forEach(field => {
    let fieldSchema;
    const requiredError = `${field.label} is required.`;

    switch (field.type) {
      case 'text':
        fieldSchema = z.string();
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
    schemaShape[field.id!] = fieldSchema;
  });
  return z.object(schemaShape);
}


export function ApplicationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formFields, setFormFields] = useState<FormFieldData[]>([]);

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
              const defaultValues = fields.reduce((acc, field) => ({ ...acc, [field.id!]: '' }), {});

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
        setIsSubmitting(false);
    }
  }

  const renderFormField = (fieldData: FormFieldData) => {
    const { id, type, label, options, required } = fieldData;

    let inputComponent;
    switch(type) {
        case 'text':
            inputComponent = <Input placeholder={`Your ${label.toLowerCase()}`} />;
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
                        {options?.map(opt => <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>)}
                    </SelectContent>
                </Select>
              );
              break;
        default:
            return null;
    }


    return (
        <FormField
          key={id}
          control={form.control}
          name={id!}
          render={({ field }) => {
            const finalComponent = React.cloneElement(inputComponent, { ...field, onValueChange: field.onChange, defaultValue: field.value });
            return (
                <FormItem>
                <FormLabel>
                    {label}
                    {required && <span className="text-destructive"> *</span>}
                </FormLabel>
                <FormControl>
                    {inputComponent.type.displayName === 'Select' ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                {finalComponent.props.children[0]}
                            </FormControl>
                            {finalComponent.props.children[1]}
                        </Select>
                    ) : finalComponent}
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
        {formFields.map(renderFormField)}
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
