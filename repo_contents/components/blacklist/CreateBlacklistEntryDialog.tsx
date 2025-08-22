// components/blacklist/CreateBlacklistEntryDialog.tsx
// components/blacklist/CreateBlacklistEntryDialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { createBlacklistEntry } from "@/actions/blacklist/create-blacklist-entry";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface CreateBlacklistEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateBlacklistEntryDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateBlacklistEntryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [formData, setFormData] = useState({
    senderName: "",
    effectiveDate: new Date(), // Changed from dateApplied to effectiveDate
    description: "",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.senderName.trim()) {
      toast.error("Sender name is required");
      return;
    }

    // Validate effective date
    if (!formData.effectiveDate) {
      toast.error("Effective date is required");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createBlacklistEntry({
        senderName: formData.senderName.trim(),
        effectiveDate: formData.effectiveDate,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
      });

      if (result.success) {
        toast.success(`Blacklist entry created for ${result.data?.length || 0} bulk providers`);
        // Reset form
        setFormData({
          senderName: "",
          effectiveDate: new Date(),
          description: "",
          isActive: true,
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to create blacklist entry");
      }
    } catch (error) {
      console.error("Error creating blacklist entry:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form when canceling
    setFormData({
      senderName: "",
      effectiveDate: new Date(),
      description: "",
      isActive: true,
    });
    setCalendarOpen(false); // Close calendar if open
    onOpenChange(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, effectiveDate: date }));
    }
    setCalendarOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Blacklist Entry</DialogTitle>
          <DialogDescription>
            Add a new sender to the blacklist across all bulk providers. This will prevent messages from this sender on all bulk SMS services.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senderName">Sender Name *</Label>
            <Input
              id="senderName"
              placeholder="Enter sender name..."
              value={formData.senderName}
              onChange={(e) => setFormData(prev => ({ ...prev, senderName: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Effective Date *</Label>
              <Popover 
                open={calendarOpen} 
                onOpenChange={setCalendarOpen}
                modal={true}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                    disabled={isLoading}
                    onClick={() => setCalendarOpen(true)}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.effectiveDate ? format(formData.effectiveDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0" 
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  onInteractOutside={(e) => {
                    // Prevent closing when clicking inside the calendar
                    e.preventDefault();
                  }}
                >
                  <Calendar
                    mode="single"
                    selected={formData.effectiveDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <div className="flex items-center space-x-2 h-10 px-3 py-2 border rounded-md">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  disabled={isLoading}
                />
                <Label htmlFor="isActive" className="text-sm">
                  {formData.isActive ? "Active" : "Inactive"}
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description (optional)..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Entry for All Bulk Providers
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}