// app/(protected)/_components/navbar.tsx
"use client";

import * as React from "react";
import { 
  ChevronDown, 
  Lock, 
  Home,
  Bell,
  HelpCircle,
  Settings as SettingsIcon
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ClientSideUserButton } from "@/components/auth/client-side-user-button";
import { RefreshSessionButton } from "@/components/auth/refresh-session-button";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { getUnreadNotificationCount } from "@/actions/notifications/get-unread-count"; // ✅ Dodaj ovo

interface DropdownItem {
  href: string;
  title: string;
  description?: string;
  badge?: string;
}

interface CustomDropdownProps {
  trigger: string;
  items: DropdownItem[];
  isActive: boolean;
  disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  trigger, 
  items, 
  isActive, 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  const handleItemClick = () => {
    setIsOpen(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (disabled) {
    return (
      <button
        className={cn(
          "relative overflow-hidden",
          "inline-flex items-center justify-center gap-2",
          "px-4 py-2 rounded-lg h-9",
          "text-sm font-medium",
          "cursor-not-allowed opacity-50",
          "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600",
          "text-gray-500 dark:text-gray-400"
        )}
        disabled
        title="Nemate pristup"
      >
        <Lock className="h-3 w-3" />
        {trigger}
      </button>
    );
  }

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          "relative overflow-hidden",
          "inline-flex items-center justify-center gap-2",
          "px-4 py-2 rounded-lg h-9",
          "text-white font-medium text-sm",
          "bg-gradient-to-r from-teal-400 to-cyan-500",
          "shadow-md shadow-teal-400/20",
          "hover:shadow-lg hover:shadow-teal-400/30",
          "hover:-translate-y-0.5",
          "active:translate-y-0",
          "transition-all duration-300 ease-in-out",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "before:translate-x-[-200%]",
          "hover:before:translate-x-[200%]",
          "before:transition-transform before:duration-700",
          isActive && "ring-2 ring-white/30"
        )}
      >
        {trigger}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition duration-300",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      
      {isOpen && (
        <>
          <div className="absolute left-0 top-full w-full h-2 bg-transparent" />
          
          <div className="absolute left-0 top-full mt-2 w-[280px] bg-popover border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-200">
            <ul className="grid gap-1 p-4">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleItemClick}
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium leading-none">{item.title}</div>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

interface SimpleNavLinkProps {
  href: string;
  children: React.ReactNode;
  isActive: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const SimpleNavLink: React.FC<SimpleNavLinkProps> = ({ 
  href, 
  children, 
  isActive, 
  disabled = false,
  icon
}) => {
  if (disabled) {
    return (
      <button
        className={cn(
          "relative overflow-hidden",
          "inline-flex items-center justify-center gap-2",
          "px-4 py-2 rounded-lg h-9",
          "text-sm font-medium",
          "cursor-not-allowed opacity-50",
          "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600",
          "text-gray-500 dark:text-gray-400"
        )}
        disabled
        title="Nemate pristup"
      >
        <Lock className="h-3 w-3" />
        {children}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "relative overflow-hidden",
        "inline-flex items-center justify-center gap-2",
        "px-4 py-2 rounded-lg h-9",
        "text-white font-medium text-sm",
        "bg-gradient-to-r from-teal-400 to-cyan-500",
        "shadow-md shadow-teal-400/20",
        "hover:shadow-lg hover:shadow-teal-400/30",
        "hover:-translate-y-0.5",
        "active:translate-y-0",
        "transition-all duration-300 ease-in-out",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:translate-x-[-200%]",
        "hover:before:translate-x-[200%]",
        "before:transition-transform before:duration-700",
        isActive && "ring-2 ring-white/30"
      )}
    >
      {icon}
      {children}
    </Link>
  );
};

interface IconNavButtonProps {
  href: string;
  icon: React.ReactNode;
  isActive: boolean;
  title: string;
  badge?: number;
}

const IconNavButton: React.FC<IconNavButtonProps> = ({ 
  href, 
  icon, 
  isActive, 
  title,
  badge 
}) => {
  return (
    <Link
      href={href}
      title={title}
      className={cn(
        "relative overflow-hidden",
        "inline-flex items-center justify-center",
        "w-9 h-9 rounded-lg",
        "text-white",
        "bg-gradient-to-r from-teal-400 to-cyan-500",
        "shadow-md shadow-teal-400/20",
        "hover:shadow-lg hover:shadow-teal-400/30",
        "hover:-translate-y-0.5",
        "active:translate-y-0",
        "transition-all duration-300 ease-in-out",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:translate-x-[-200%]",
        "hover:before:translate-x-[200%]",
        "before:transition-transform before:duration-700",
        isActive && "ring-2 ring-white/30"
      )}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-background shadow-lg">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
};

export const Navbar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;
  
  // TODO: Replace with actual notification count from API
  const [notificationCount, setNotificationCount] = React.useState(0);
  
  // Fetch notification count on mount and when pathname changes
  React.useEffect(() => {
    async function fetchNotificationCount() {
      const count = await getUnreadNotificationCount();
      if (typeof count === 'number') {
        setNotificationCount(count);
      }
    }
    
    if (session?.user?.id) {
      fetchNotificationCount();
    }
  }, [session?.user?.id, pathname]);
  
  // Definiši pristupna prava za svaki link
  const permissions = React.useMemo(() => ({
    // Basic access
    dashboard: true,
    humanitarianOrgs: true,
    operators: true,
    parking: true,
    bulkServices: true,
    services: true,
    contracts: true,
    complaints: true,
    notifications: true,
    help: true,
    settings: true,
    profile: true,
    
    // Advanced access
    providers: userRole === 'ADMIN' || userRole === 'MANAGER',
    adminComplaints: userRole === 'ADMIN',
    analytics: userRole === 'ADMIN' || userRole === 'MANAGER',
    reports: userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'AGENT',
    admin: userRole === 'ADMIN',
    auditLogs: userRole === 'ADMIN',
  }), [userRole]);
  
  const isActivePath = (href: string) => pathname.startsWith(href);
  const isTriggerActive = (paths: string[]) => paths.some(p => isActivePath(p));

  // Dropdown paths
  const operacijePaths = ["/humanitarian-orgs", "/providers", "/operators", "/parking-services"];
  const servisiPaths = ["/services", "/bulk-services"];
  const ugovoriPaths = ["/contracts"];
  const reklamacijePaths = ["/complaints", "/admin/complaints"];
  const analyticsPaths = ["/analytics"];
  const reportsPaths = ["/reports"];
  const adminPaths = ["/admin"];

  // Dropdown items
  const operacijeItems: DropdownItem[] = [
    { 
      href: "/humanitarian-orgs", 
      title: "Humanitarne organizacije", 
      description: "Upravljanje humanitarnim organizacijama"
    },
    ...(permissions.providers ? [{
      href: "/providers", 
      title: "Provajderi", 
      description: "Upravljanje provajderima usluga"
    }] : []),
    { 
      href: "/operators", 
      title: "Operateri", 
      description: "Upravljanje operaterima"
    },
    { 
      href: "/parking-services", 
      title: "Parking servisi", 
      description: "Upravljanje parking uslugama"
    },
  ];

  const servisiItems: DropdownItem[] = [
    { 
      href: "/services", 
      title: "Servisi", 
      description: "Pregled svih servisa po tipu"
    },
    { 
      href: "/bulk-services", 
      title: "Bulk servisi", 
      description: "Masovno upravljanje servisima"
    },
  ];

  const ugovoriItems: DropdownItem[] = [
    { 
      href: "/contracts", 
      title: "Svi ugovori", 
      description: "Pregled svih ugovora"
    },
    { 
      href: "/contracts/expiring", 
      title: "Ugovori koji ističu", 
      description: "Ugovori koji uskoro ističu",
      badge: "!"
    },
    { 
      href: "/contracts/providers", 
      title: "Po provajderima", 
      description: "Ugovori grupisani po provajderima"
    },
  ];

  const reklamacijeItems: DropdownItem[] = [
    { 
      href: "/complaints", 
      title: "Sve reklamacije", 
      description: "Pregled svih reklamacija u sistemu"
    },
    ...(permissions.adminComplaints ? [{
      href: "/admin/complaints", 
      title: "Admin panel", 
      description: "Administrativno upravljanje reklamacijama"
    }] : []),
  ];

  const analyticsItems: DropdownItem[] = [
    { 
      href: "/analytics", 
      title: "Pregled", 
      description: "Osnovni analytics dashboard"
    },
    { 
      href: "/analytics/providers", 
      title: "Provajderi", 
      description: "Analitika provajdera"
    },
    { 
      href: "/analytics/sales", 
      title: "Prodaja", 
      description: "Analitika prodaje"
    },
    { 
      href: "/analytics/complaints", 
      title: "Reklamacije", 
      description: "Analitika reklamacija"
    },
    { 
      href: "/analytics/financials", 
      title: "Finansije", 
      description: "Finansijska analitika"
    },
  ];

  const reportsItems: DropdownItem[] = [
    { 
      href: "/reports", 
      title: "Izveštaji", 
      description: "Pregled svih izveštaja"
    },
    { 
      href: "/reports/generate", 
      title: "Generiši", 
      description: "Kreiraj nove izveštaje"
    },
    { 
      href: "/reports/scheduled", 
      title: "Zakazani", 
      description: "Automatski zakazani izveštaji"
    },
  ];

  const adminItems: DropdownItem[] = [
    { 
      href: "/admin", 
      title: "Dashboard", 
      description: "Admin kontrolna tabla"
    },
    { 
      href: "/admin/aidash", 
      title: "AI Dashboard", 
      description: "AI insights i analytics",
      badge: "NEW"
    },
    { 
      href: "/admin/security", 
      title: "Sigurnost", 
      description: "Bezbednosne postavke"
    },
    { 
      href: "/admin/security/activity-logs", 
      title: "Activity Logs", 
      description: "Logovi aktivnosti korisnika"
    },
    { 
      href: "/admin/security/user-roles", 
      title: "Korisničke uloge", 
      description: "Upravljanje ulogama i pravima"
    },
    { 
      href: "/admin/notifications", 
      title: "Notifikacije", 
      description: "Sistemske notifikacije"
    },
    { 
      href: "/audit-logs", 
      title: "Audit Logs", 
      description: "Kompletan audit trail"
    },
  ];

  return (
    <nav className="relative w-full flex items-center justify-between p-4 shadow-sm z-50">
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          {/* Dashboard Home Icon */}
          <IconNavButton
            href="/dashboard"
            icon={<Home className="h-4 w-4" />}
            isActive={isActivePath("/dashboard")}
            title="Dashboard"
          />

          {/* Operacije Dropdown */}
          <CustomDropdown
            trigger="Operacije"
            items={operacijeItems}
            isActive={isTriggerActive(operacijePaths)}
          />

          {/* Servisi Dropdown */}
          <CustomDropdown
            trigger="Servisi"
            items={servisiItems}
            isActive={isTriggerActive(servisiPaths)}
          />

          {/* Ugovori Dropdown */}
          <CustomDropdown
            trigger="Ugovori"
            items={ugovoriItems}
            isActive={isTriggerActive(ugovoriPaths)}
          />

          {/* Reklamacije Dropdown */}
          <CustomDropdown
            trigger="Reklamacije"
            items={reklamacijeItems}
            isActive={isTriggerActive(reklamacijePaths)}
          />

          {/* Analytics Dropdown */}
          <CustomDropdown
            trigger="Analytics"
            items={analyticsItems}
            isActive={isTriggerActive(analyticsPaths)}
            disabled={!permissions.analytics}
          />

          {/* Reports Dropdown */}
          <CustomDropdown
            trigger="Reports"
            items={reportsItems}
            isActive={isTriggerActive(reportsPaths)}
            disabled={!permissions.reports}
          />

          {/* Admin Dropdown */}
          <CustomDropdown
            trigger="Admin"
            items={adminItems}
            isActive={isTriggerActive(adminPaths)}
            disabled={!permissions.admin}
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="ml-auto flex-shrink-0 flex items-center gap-2">
        {/* Notifications */}
          <IconNavButton
            href="/notifications"
            icon={<Bell className="h-4 w-4" />}
            isActive={isActivePath("/notifications")}
            title={notificationCount > 0 ? `${notificationCount} nepročitanih notifikacija` : "Notifikacije"}
            badge={notificationCount}
          />

        {/* Help */}
        <IconNavButton
          href="/help/documentation"
          icon={<HelpCircle className="h-4 w-4" />}
          isActive={isActivePath("/help")}
          title="Pomoć"
        />

        {/* Settings */}
        <IconNavButton
          href="/settings"
          icon={<SettingsIcon className="h-4 w-4" />}
          isActive={isActivePath("/settings")}
          title="Podešavanja"
        />

        {/* Refresh Session */}
        <RefreshSessionButton />
        
        {/* User Button */}
        <ClientSideUserButton />
      </div>
    </nav>
  );
};