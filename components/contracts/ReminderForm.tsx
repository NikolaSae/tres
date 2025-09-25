///components/contracts/ReminderForm.tsx


"use client";

import { useState } from "react";
import { CalendarIcon, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn, formatDate } from "@/lib/utils";
import { createReminder } from "@/actions/contracts/create-reminder";
import { acknowledgeReminder } from "@/actions/contracts/acknowledge-reminder";
import { toast } from "sonner";

interface Reminder {
  id: string;
  reminderDate: Date;
  reminderType: string;
  isAcknowledged: boolean;
  acknowledgedBy?: {
    name: string;
  } | null;
}

interface ReminderFormProps {
  contractId: string;
  endDate: Date;
  reminders: Reminder[];
  onReminderCreated?: () => void;
  onReminderAcknowledged?: (reminderId: string) => void;
}

export function ReminderForm({
  contractId,
  endDate,
  reminders,
  onReminderCreated,
  onReminderAcknowledged,
}: ReminderFormProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [reminderType, setReminderType] = useState<string>("expiration");
  const [creating, setCreating] = useState(false);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  // const { toast } = useToast();

  const handleCreate = async () => {
    if (!date) {
      toast({
        title: "Missing date",
        description: "Please select a reminder date",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      
      const result = await createReminder({
        contractId,
        reminderDate: date,
        reminderType,
      });
      
      if (result.success) {
        toast({
          title: "Reminder created",
          description: `Reminder set for ${formatDate(date)}`,
        });
        
        setDate(undefined);
        setReminderType("expiration");
        
        if (onReminderCreated) {
          onReminderCreated();
        }
      } else {
        toast({
          title: "Failed to create reminder",
          description: result.error || "An error occurred while creating the reminder",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleAcknowledge = async (reminderId: string) => {
    try {
      setAcknowledging(reminderId);
      
      const result = await acknowledgeReminder({
        reminderId,
      });
      
      if (result.success) {
        toast({
          title: "Reminder acknowledged",
          description: "You have acknowledged this reminder",
        });
        
        if (onReminderAcknowledged) {
          onReminderAcknowledged(reminderId);
        }
      } else {
        toast({
          title: "Failed to acknowledge reminder",
          description: result.error || "An error occurred while acknowledging the reminder",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error acknowledging reminder:", error);
      toast({
        title: "Error",
        description: "Failed to acknowledge reminder",
        variant: "destructive",
      });
    } finally {
      setAcknowledging(null);
    }
  };

  // Get the appropriate reminder type label
  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case "expiration":
        return "Contract Expiration";
      case "renewal":
        return "Contract Renewal";
      case "review":
        return "Contract Review";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Sort reminders by date (closest first)
  const sortedReminders = [...reminders].sort(
    (a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime()
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Contract Reminders</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-gray-50">
          <div className="space-y-2">
            <Label htmlFor="reminder-date">Reminder Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="reminder-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={creating}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? formatDate(date) : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date() || date > new Date(endDate)}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reminder-type">Reminder Type</Label>
            <Select
              value={reminderType}
              onValueChange={setReminderType}
              disabled={creating}
            >
              <SelectTrigger id="reminder-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expiration">Contract Expiration</SelectItem>
                <SelectItem value="renewal">Contract Renewal</SelectItem>
                <SelectItem value="review">Contract Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              className="w-full flex items-center gap-2"
              disabled={!date || creating}
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4" />
              {creating ? "Creating..." : "Create Reminder"}
            </Button>
          </div>
        </div>
        
        {/* List of reminders */}
        <div className="space-y-4">
          <h4 className="font-medium">Current Reminders</h4>
          
          {sortedReminders.length === 0 ? (
            <div className="p-4 text-center border rounded-md text-muted-foreground">
              No reminders set for this contract
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReminders.map((reminder) => {
                const isPast = new Date(reminder.reminderDate) < new Date();
                
                return (
                  <div 
                    key={reminder.id} 
                    className={cn(
                      "p-4 border rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2",
                      isPast && !reminder.isAcknowledged ? "bg-amber-50 border-amber-200" : "",
                      reminder.isAcknowledged ? "bg-gray-50" : ""
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Bell className={cn(
                          "h-4 w-4",
                          isPast && !reminder.isAcknowledged ? "text-amber-500" : "text-gray-500"
                        )} />
                        <span className="font-medium">{getReminderTypeLabel(reminder.reminderType)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reminder for {formatDate(reminder.reminderDate)}
                        {isPast ? " (past)" : ""}
                      </p>
                      {reminder.isAcknowledged && reminder.acknowledgedBy && (
                        <p className="text-xs text-muted-foreground">
                          Acknowledged by {reminder.acknowledgedBy.name}
                        </p>
                      )}
                    </div>
                    
                    {!reminder.isAcknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(reminder.id)}
                        disabled={acknowledging === reminder.id}
                        className="self-end sm:self-center"
                      >
                        {acknowledging === reminder.id ? "Processing..." : "Acknowledge"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}