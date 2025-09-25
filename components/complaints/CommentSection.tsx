// /components/complaints/CommentSection.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { Comment, User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { addComment } from "@/actions/complaints/comment";
import { useToast } from "@/components/toast/toast-context";

type CommentWithUser = Comment & { user: Pick<User, "id" | "name" | "email"> };

interface CommentSectionProps {
  complaintId: string;
  comments: CommentWithUser[];
  currentUserId: string;
  userRole: string;
}

const commentSchema = z.object({
  text: z.string().min(3, "Comment must be at least 3 characters"),
  isInternal: z.boolean().default(false),
});

type CommentFormValues = z.infer<typeof commentSchema>;

export default function CommentSection({ 
  complaintId, 
  comments, 
  currentUserId,
  userRole
}: CommentSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canAddInternalComments = ["ADMIN", "MANAGER", "AGENT"].includes(userRole);
  
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      text: "",
      isInternal: false,
    },
  });

  const onSubmit = async (values: CommentFormValues) => {
    setIsSubmitting(true);
    try {
      await addComment(complaintId, values.text, values.isInternal);
      form.reset();
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Filter comments based on user role
  const filteredComments = comments.filter(comment => 
    !comment.isInternal || ["ADMIN", "MANAGER", "AGENT"].includes(userRole)
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Comments</h3>
      
      {filteredComments.length === 0 ? (
        <p className="text-muted-foreground italic">No comments yet</p>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader className="py-3 flex flex-row items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {comment.user.name?.charAt(0) || comment.user.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {comment.user.name || comment.user.email}
                    {comment.isInternal && (
                      <Badge variant="outline" className="ml-2 bg-amber-100">Internal</Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Card>
        <CardHeader className="pb-2 pt-4">
          <h4 className="text-sm font-medium">Add a comment</h4>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your comment here..." 
                        className="resize-none" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {canAddInternalComments && (
                <FormField
                  control={form.control}
                  name="isInternal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 mt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="text-sm">
                        Mark as internal comment (only visible to staff)
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}