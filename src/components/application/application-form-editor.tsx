

"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Loader2, GripVertical, PlusCircle, Trash2, Edit, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  getApplicationFormFields,
  saveApplicationFormFields,
} from "@/lib/actions";
import type { FormFieldData } from "@/lib/types";
import { EditFieldDialog } from "./edit-field-dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";

const formFieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required"),
  type: z.enum(["text", "textarea", "select"]),
  required: z.boolean(),
  options: z.array(z.object({ id: z.string().optional(), value: z.string() })).optional(),
});

const formSchema = z.object({
  fields: z.array(formFieldSchema),
});

type FormSchema = z.infer<typeof formSchema>;
type FormFieldSchema = z.infer<typeof formFieldSchema>;

const SortableField = ({ field, index, onEdit, onRemove }: { field: FormFieldSchema, index: number, onEdit: (index: number) => void, onRemove: (index: number) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id! });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderFieldPreview = () => {
    switch(field.type) {
      case 'text':
        return <Input placeholder={field.label} disabled />;
      case 'textarea':
        return <Textarea placeholder={field.label} disabled />;
      case 'select':
        return (
             <Select disabled>
                <SelectTrigger>
                    <SelectValue placeholder={field.label} />
                </SelectTrigger>
                <SelectContent>
                    {field.options?.map((opt, i) => <SelectItem key={i} value={opt.value}>{opt.value}</SelectItem>)}
                </SelectContent>
            </Select>
        )
      default:
        return <p>Unsupported field type</p>
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
      <div {...attributes} {...listeners} className="cursor-grab p-2">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <Label className="font-normal">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
        </Label>
        {renderFieldPreview()}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(index)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onRemove(index)} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export function ApplicationFormEditor() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [editDialogIndex, setEditDialogIndex] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState("System");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser(localStorage.getItem('loggedInUser') || "System");
    }
  }, []);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fields: [],
    },
  });

  const { fields, control, reset } = form;
  const { append, remove, move, update } = useFieldArray({
    control,
    name: "fields",
  });

  useEffect(() => {
    setIsMounted(true);
    const fetchFields = async () => {
      try {
        const fetchedFields = await getApplicationFormFields();
        reset({ fields: fetchedFields as FormFieldSchema[] });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load form fields.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchFields();
  }, [reset, toast]);

  const onSubmit = async (data: FormSchema) => {
    setIsSaving(true);
    try {
      await saveApplicationFormFields(data.fields, currentUser);
      toast({
        title: "Success",
        description: "Application form saved successfully.",
      });
       const fetchedFields = await getApplicationFormFields();
       reset({ fields: fetchedFields as FormFieldSchema[] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save the form.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = fields.value.findIndex((f) => f.id === active.id);
      const newIndex = fields.value.findIndex((f) => f.id === over.id);
      move(oldIndex, newIndex);
    }
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const handleAddNewField = () => {
     // Use a temporary client-side ID for the key, the server will assign a permanent one.
     append({ id: `new-${Date.now()}`, label: "New Question", type: 'text', required: true, options: [] }, { shouldFocus: false });
     setEditDialogIndex(form.getValues('fields').length);
  };

  const handleSaveField = (index: number, data: FormFieldSchema) => {
    update(index, data);
    setEditDialogIndex(null);
  }

  if (!isMounted) {
    return (
       <div className="flex items-center justify-center p-8">
         <Loader2 className="h-8 w-8 animate-spin" />
       </div>
    );
  }
  
  const currentFields = form.getValues('fields');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Application Form</CardTitle>
        <CardDescription>
          Drag and drop to reorder fields. Click "Add Field" to create new questions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {isLoading ? (
               <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
               </div>
            ) : (
              <div className="space-y-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={currentFields.map(f => f.id!)} strategy={verticalListSortingStrategy}>
                    {currentFields.map((field, index) => (
                      <SortableField key={field.id} field={field} index={index} onEdit={setEditDialogIndex} onRemove={remove} />
                    ))}
                  </SortableContext>
                </DndContext>
                {currentFields.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 rounded-lg border border-dashed text-center p-4">
                        <p className="text-muted-foreground">Your application form is empty.</p>
                        <p className="text-sm text-muted-foreground">Click "Add New Field" to get started.</p>
                    </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={handleAddNewField}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Field
              </Button>
              <Button type="submit" disabled={isSaving || isLoading}>
                {isSaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Form
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      {editDialogIndex !== null && currentFields[editDialogIndex] && (
        <EditFieldDialog
            isOpen={editDialogIndex !== null}
            onClose={() => setEditDialogIndex(null)}
            onSave={(data) => handleSaveField(editDialogIndex, data)}
            onDelete={() => {
                remove(editDialogIndex);
                setEditDialogIndex(null);
            }}
            fieldData={currentFields[editDialogIndex]}
        />
       )}
    </Card>
  );
}
