// Path: app/(protected)/admin/notifications/page.tsx

import { Suspense } from 'react';
import { getCurrentUser, isAdmin } from '@/lib/security/auth-helpers';
import AdminNotificationControls from '@/components/notifications/AdminNotificationControls';
import { redirect } from 'next/navigation';
import { Loader2 } from "lucide-react";

export const metadata = {
    title: 'Admin Notifications | Service Management',
    description: 'Administrative notification management',
};

// Definisaćemo listu svih mogućih korisničkih uloga ovde.
// PRILAGODITE OVAJ NIZ da sadrži STVARNE uloge koje imate u vašoj aplikaciji.
const ALL_USER_ROLES = ['ADMIN', 'MANAGER', 'PROVIDER', 'USER', 'AGENT']; // Primer uloga


export default async function AdminNotificationsPage() {
    const user = await getCurrentUser();
    const isAdminUser = await isAdmin();

    if (!user || !isAdminUser) {
        redirect('/auth/login');
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Admin Notifications</h1>

            <Suspense fallback={<div className="flex justify-center my-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                {/* Prosleđujemo userRoles prop sa listom svih mogućih uloga */}
                <AdminNotificationControls userRoles={ALL_USER_ROLES} /> {/* MODIFIKOVANO */}
            </Suspense>
        </div>
    );
}