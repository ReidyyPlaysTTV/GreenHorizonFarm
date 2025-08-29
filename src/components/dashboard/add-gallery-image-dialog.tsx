
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { addGalleryImage } from "@/lib/actions/gallery-actions";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription as FormDesc,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";

const formSchema = z.object({
  src: z.string().url("Please enter a valid URL.").refine(
    (url) => /^https:\/\/i\.imgur\.com\//.test(url) || /^https:\/\/r2\.fivemanage\.com\//.test(url), 
    "URL must be from i.imgur.com or r2.fivemanage.com"
  ),
  alt: z.string().min(1, "Alt text is required for accessibility."),
  hint: z.string().optional(),
});

export function AddGalleryImageDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      src: "",
      alt: "",
      hint: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await addGalleryImage(values);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Image has been added to the gallery.",
      });
      setIsOpen(false);
      form.reset();
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4"/> Add Image</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Image to Gallery</DialogTitle>
          <DialogDescription>
            Enter a URL to an image hosted on Imgur or FiveManage.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="src"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://i.imgur.com/..." {...field} />
                  </FormControl>
                   <FormDesc className="text-xs">
                    Must be a direct link from i.imgur.com or r2.fivemanage.com.
                  </FormDesc>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="alt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alt Text</FormLabel>
                  <FormControl>
                    <Input placeholder="A brief description of the image" {...field} />
                  </FormControl>
                  <FormDesc className="text-xs">
                    Short, descriptive text for accessibility.
                  </FormDesc>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Hint (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'prison bus'" {...field} />
                  </FormControl>
                   <FormDesc className="text-xs">
                    One or two keywords to describe the image for AI.
                  </FormDesc>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Add to Gallery"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
