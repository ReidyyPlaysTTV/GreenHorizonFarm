
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, PlusCircle } from "lucide-react";
import type { FormFieldData } from "@/lib/types";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

const fieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label cannot be empty."),
  type: z.enum(["text", "textarea", "select"]),
  required: z.boolean(),
  options: z.array(z.object({ id: z.string().optional(), value: z.string().min(1, "Option cannot be empty") })).optional(),
});

type FieldSchema = z.infer<typeof fieldSchema>;

interface EditFieldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FieldSchema) => void;
  onDelete: () => void;
  fieldData: FormFieldData;
}

export function EditFieldDialog({
  isOpen,
  onClose,
  onSave,
  onDelete,
  fieldData,
}: EditFieldDialogProps) {
  const form = useForm<FieldSchema>({
    resolver: zodResolver(fieldSchema),
    defaultValues: fieldData || {
      label: "",
      type: "text",
      required: true,
      options: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });
  
  const fieldType = form.watch("type");

  const handleSave = (values: FieldSchema) => {
    // Ensure the ID from the original data is preserved
    onSave({ ...values, id: fieldData.id });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{fieldData.label !== "New Question" ? "Edit Field" : "Add New Field"}</DialogTitle>
          <DialogDescription>
            Configure the properties for this form field.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question / Label</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., What is your name?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Type</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      if (value !== 'select') {
                          form.setValue('options', []);
                      }
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a field type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text">Short Text</SelectItem>
                      <SelectItem value="textarea">Long Text (Textarea)</SelectItem>
                      <SelectItem value="select">Dropdown Select</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {fieldType === 'select' && (
              <div className="space-y-2 rounded-md border p-4">
                  <div className="flex justify-between items-center mb-2">
                    <FormLabel>Options</FormLabel>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ id: `new-opt-${Date.now()}`, value: "" })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {fields.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <FormField
                            control={form.control}
                            name={`options.${index}.value`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input placeholder={`Option ${index + 1}`} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {fields.length === 0 && <p className="text-xs text-muted-foreground text-center">No options added yet.</p>}
                  </div>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="required"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label htmlFor="required-switch">Required</Label>
                    <p className="text-xs text-muted-foreground">
                      Is this question mandatory for the applicant to answer?
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      id="required-switch"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />


            <DialogFooter className="mt-6">
                <Button type="button" variant="destructive" onClick={() => { onDelete(); onClose(); }}>
                    Delete Field
                </Button>
                <div className="flex-grow" />
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
              <Button type="submit">Save Field</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
