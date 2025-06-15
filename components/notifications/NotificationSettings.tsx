// Path: components/notifications/NotificationSettings.tsx
"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// Uvezite vaš custom useToast hook
//import { useToast } from "sonner";
import { NotificationPreferences } from "@/lib/types/notification-types";
import { updateNotificationPreferences } from "@/actions/notifications/update-preferences";
import { useTransition } from "react";

interface NotificationSettingsProps {
    initialPreferences: NotificationPreferences;
}

type PreferencesState = NotificationPreferences;

export default function NotificationSettings({ initialPreferences }: NotificationSettingsProps) {
    const [preferences, setPreferences] = useState<PreferencesState>(initialPreferences);
    const [isPending, startTransition] = useTransition();

    // !!! KORIGOVANO: Pribavite showToastMessage iz vašeg useToast hook-a !!!
    // const { showToastMessage } = useToast();


    useEffect(() => {
        setPreferences(initialPreferences);
    }, [initialPreferences]);

    const handleToggle = (
        typeKey: keyof Omit<NotificationPreferences, 'userId' | 'emailNotifications' | 'inAppNotifications'>,
        deliveryMethod: 'inApp' | 'email'
    ) => {
        setPreferences(prevPrefs => ({
            ...prevPrefs,
            [typeKey]: {
                ...prevPrefs[typeKey],
                [deliveryMethod]: !prevPrefs[typeKey][deliveryMethod],
            },
        }));
    };

    const handleGeneralToggle = (key: 'emailNotifications' | 'inAppNotifications') => {
         setPreferences(prevPrefs => ({
             ...prevPrefs,
             [key]: !prevPrefs[key],
         }));
    };


    const handleSave = async () => {
        console.log("Attempting to save preferences:", preferences);
        startTransition(async () => {
            const result = await updateNotificationPreferences(preferences);

            console.log("Result from updateNotificationPreferences:", result);

            if (result?.success) {
                console.log("Action reported success.");
                // !!! KORIGOVANO: Koristite showToastMessage za prikaz uspešne poruke !!!
                showToastMessage(result.success, false); // false jer nije greška

                if (result.preferences) {
                    console.log("Updating state with returned preferences.");
                    setPreferences(result.preferences as PreferencesState);
                }
            } else {
                console.error("Action reported error or unexpected result.");
                // !!! KORIGOVANO: Koristite showToastMessage za prikaz poruke o grešci !!!
                showToastMessage(result?.error || "Failed to save preferences.", true); // true jer je greška
            }
        });
    };


    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-4">
                     <h3 className="text-lg font-semibold">General Settings</h3>
                     <div className="flex items-center space-x-2">
                         <Checkbox
                             id="general-inapp"
                             checked={preferences.inAppNotifications}
                             onCheckedChange={() => handleGeneralToggle('inAppNotifications')}
                             disabled={isPending}
                         />
                         <Label htmlFor="general-inapp">Enable In-App Notifications</Label>
                     </div>
                     <div className="flex items-center space-x-2">
                         <Checkbox
                             id="general-email"
                             checked={preferences.emailNotifications}
                             onCheckedChange={() => handleGeneralToggle('emailNotifications')}
                             disabled={isPending}
                         />
                         <Label htmlFor="general-email">Enable Email Notifications</Label>
                     </div>
                 </div>

                <Separator />

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Notification Types</h3>

                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="col-span-1">Contract Expiring</Label>
                        <div className="flex items-center space-x-2 col-span-1">
                            <Checkbox
                                id="contract-expiring-inapp"
                                checked={preferences.contractExpiring.inApp}
                                onCheckedChange={() => handleToggle('contractExpiring', 'inApp')}
                                disabled={isPending}
                            />
                            <Label htmlFor="contract-expiring-inapp">In-App</Label>
                        </div>
                         <div className="flex items-center space-x-2 col-span-1">
                            <Checkbox
                                id="contract-expiring-email"
                                checked={preferences.contractExpiring.email}
                                onCheckedChange={() => handleToggle('contractExpiring', 'email')}
                                disabled={isPending}
                            />
                            <Label htmlFor="contract-expiring-email">Email</Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="col-span-1">Renewal Status Change</Label>
                        <div className="flex items-center space-x-2 col-span-1">
                            <Checkbox
                                id="renewal-status-inapp"
                                checked={preferences.contractRenewalStatusChange.inApp}
                                onCheckedChange={() => handleToggle('renewalStatusChange', 'inApp')}
                                disabled={isPending}
                            />
                            <Label htmlFor="renewal-status-inapp">In-App</Label>
                        </div>
                         <div className="flex items-center space-x-2 col-span-1">
                            <Checkbox
                                id="renewal-status-email"
                                checked={preferences.contractRenewalStatusChange.email}
                                onCheckedChange={() => handleToggle('renewalStatusChange', 'email')}
                                disabled={isPending}
                            />
                            <Label htmlFor="renewal-status-email">Email</Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="col-span-1">Complaint Assigned</Label>
                        <div className="flex items-center space-x-2 col-span-1">
                            <Checkbox
                                id="complaint-assigned-inapp"
                                checked={preferences.complaintAssigned.inApp}
                                onCheckedChange={() => handleToggle('complaintAssigned', 'inApp')}
                                disabled={isPending}
                            />
                            <Label htmlFor="complaint-assigned-inapp">In-App</Label>
                        </div>
                         <div className="flex items-center space-x-2 col-span-1">
                            <Checkbox
                                id="complaint-assigned-email"
                                checked={preferences.complaintAssigned.email}
                                onCheckedChange={() => handleToggle('complaintAssigned', 'email')}
                                disabled={isPending}
                            />
                            <Label htmlFor="complaint-assigned-email">Email</Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="col-span-1">Complaint Updated</Label>
                        <div className="flex items-center space-x-2 col-span-1">
                            <Checkbox
                                id="complaint-updated-inapp"
                                checked={preferences.complaintUpdated.inApp}
                                onCheckedChange={() => handleToggle('complaintUpdated', 'inApp')}
                                disabled={isPending}
                            />
                            <Label htmlFor="complaint-updated-inapp">In-App</Label>
                        </div>
                         <div className="flex items-center space-x-2 col-span-1">
                            <Checkbox
                                id="complaint-updated-email"
                                checked={preferences.complaintUpdated.email}
                                onCheckedChange={() => handleToggle('complaintUpdated', 'email')}
                                disabled={isPending}
                            />
                            <Label htmlFor="complaint-updated-email">Email</Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                         <Label className="col-span-1">Reminders</Label>
                         <div className="flex items-center space-x-2 col-span-1">
                             <Checkbox
                                 id="reminder-inapp"
                                 checked={preferences.reminder.inApp}
                                 onCheckedChange={() => handleToggle('reminder', 'inApp')}
                                 disabled={isPending}
                             />
                             <Label htmlFor="reminder-inapp">In-App</Label>
                         </div>
                          <div className="flex items-center space-x-2 col-span-1">
                             <Checkbox
                                 id="reminder-email"
                                 checked={preferences.reminder.email}
                                 onCheckedChange={() => handleToggle('reminder', 'email')}
                                 disabled={isPending}
                             />
                             <Label htmlFor="reminder-email">Email</Label>
                         </div>
                     </div>

                      <div className="grid grid-cols-3 items-center gap-4">
                          <Label className="col-span-1">System Notifications</Label>
                          <div className="flex items-center space-x-2 col-span-1">
                              <Checkbox
                                  id="system-inapp"
                                  checked={preferences.system.inApp}
                                  onCheckedChange={() => handleToggle('system', 'inApp')}
                                  disabled={isPending}
                              />
                              <Label htmlFor="system-inapp">In-App</Label>
                          </div>
                           <div className="flex items-center space-x-2 col-span-1">
                              <Checkbox
                                  id="system-email"
                                  checked={preferences.system.email}
                                  onCheckedChange={() => handleToggle('system', 'email')}
                                  disabled={isPending}
                              />
                              <Label htmlFor="system-email">Email</Label>
                          </div>
                      </div>

                </div>

                <Button onClick={handleSave} disabled={isPending} className="w-full">
                    {isPending ? "Saving..." : "Save Preferences"}
                </Button>
            </CardContent>
        </Card>
    );
}
