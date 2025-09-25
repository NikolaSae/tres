///components/notifications/AdminNotificationControls.tsx


"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationType } from "@prisma/client";
import { toast } from "sonner";

type AdminNotificationControlsProps = {
  userRoles: string[];
};

export default function AdminNotificationControls({ userRoles }: AdminNotificationControlsProps) {
  const [notificationType, setNotificationType] = useState<NotificationType>(NotificationType.SYSTEM);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [template, setTemplate] = useState("custom");

  // Templates for quick notifications
  const templates = {
    custom: {
      title: "",
      message: "",
    },
    maintenance: {
      title: "Scheduled Maintenance",
      message: "The system will be down for scheduled maintenance on [DATE] from [TIME] to [TIME]. Please save any work in progress.",
    },
    update: {
      title: "System Update",
      message: "A new system update has been deployed. Refresh your browser to access the latest features.",
    },
    alert: {
      title: "Important Alert",
      message: "Please be aware of [ALERT DETAILS]. Contact support if you need assistance.",
    }
  };

  // Handle role selection/deselection
  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  // Handle template selection
  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    if (value !== "custom") {
      setTitle(templates[value as keyof typeof templates].title);
      setMessage(templates[value as keyof typeof templates].message);
    }
  };

  // Send notification
  const handleSendNotification = async () => {
    if (!title || !message) {
      toast.error("Please provide both title and message");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          type: notificationType,
          roles: selectedRoles,
        }),
      });

      if (response.ok) {
        toast.success("Notification sent successfully");
        // Reset form
        setTitle("");
        setMessage("");
        setSelectedRoles([]);
        setTemplate("custom");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to send notification");
      }
    } catch (error) {
      toast.error("An error occurred while sending notification");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Admin Notification Controls</CardTitle>
        <CardDescription>
          Send system notifications to specific user roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Notification</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Notification Type</label>
                <Select 
                  value={notificationType} 
                  onValueChange={(value) => setNotificationType(value as NotificationType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(NotificationType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  placeholder="Notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <Textarea
                  placeholder="Notification message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Roles</label>
                <div className="flex flex-wrap gap-2">
                  {userRoles.map((role) => (
                    <Button
                      key={role}
                      variant={selectedRoles.includes(role) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleRole(role)}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Template</label>
              <Select value={template} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Message</SelectItem>
                  <SelectItem value="maintenance">Maintenance Notice</SelectItem>
                  <SelectItem value="update">System Update</SelectItem>
                  <SelectItem value="alert">Important Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {template !== "custom" && (
              <div className="p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">{templates[template as keyof typeof templates].title}</h4>
                <p className="text-sm text-muted-foreground">
                  {templates[template as keyof typeof templates].message}
                </p>
                <p className="text-xs mt-2 italic">
                  Note: You can edit this template after applying it
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSendNotification} 
          disabled={isSending || !title || !message || selectedRoles.length === 0}
          className="ml-auto"
        >
          {isSending ? "Sending..." : "Send Notification"}
        </Button>
      </CardFooter>
    </Card>
  );
}