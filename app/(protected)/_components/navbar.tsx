// app/(protected)/_components/navbar.tsx
"use client";

import * as React from "react";
import { ChevronDown, Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ClientSideUserButton } from "@/components/auth/client-side-user-button";
import { NavLink } from "@/components/ui/nav-link";
import { RefreshSessionButton } from "@/components/auth/refresh-session-button"; // ✅ Import
import Link from "next/link";
import { UserRole } from "@prisma/client";

interface DropdownItem {
  href: string;
  title: string;
  description?: string;
}

interface CustomDropdownProps {
  trigger: string;
  items: DropdownItem[];
  isActive: boolean;
  disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ trigger, items, isActive, disabled = false }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

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
          
          <div className="absolute left-0 top-full mt-2 w-[250px] bg-popover border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-200">
            <ul className="grid gap-1 p-4">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleItemClick}
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left"
                  >
                    <div className="text-sm font-medium leading-none">{item.title}</div>
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

export const Navbar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;
  
  // Definiši pristupna prava za svaki link
  const permissions = React.useMemo(() => ({
    humanitarianOrgs: true, // Svi mogu
    providers: userRole === 'ADMIN' || userRole === 'MANAGER',
    operators: true, // Svi mogu
    bulkServices: true, // Svi mogu
    parking: true, // Svi mogu
    complaints: true, // Svi mogu
    adminComplaints: userRole === 'ADMIN', // Samo admin
    contracts: true, // Svi mogu
    services: true, // Svi mogu
    analytics: userRole === 'ADMIN' || userRole === 'MANAGER',
    reports: userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'AGENT',
  }), [userRole]);
  
  const isActivePath = (href: string) => pathname.startsWith(href);
  const isTriggerActive = (paths: string[]) => paths.some(p => isActivePath(p));

  const reklamacijePaths = ["/complaints", "/admin/complaints"];
  const analyticsPaths = ["/analytics", "/analytics/reports"];

  // Filtriraj items za dropdowns na osnovu pristupa
  const reklamacijeItems = [
    { href: "/complaints", title: "Sve reklamacije", description: "Pregled svih reklamacija u sistemu" },
    ...(permissions.adminComplaints ? [
      { href: "/admin/complaints", title: "Admin panel", description: "Administrativno upravljanje reklamacijama" }
    ] : [])
  ];

  const analyticsItems = [
    { href: "/analytics", title: "Pregled", description: "Osnovni analytics dashboard" },
    { href: "/analytics/reports", title: "Izveštaji", description: "Detaljni izveštaji i statistike" }
  ];

  return (
    <nav className="relative w-full flex items-center justify-between p-4 shadow-sm z-50">
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <NavLink 
            href="/humanitarian-orgs" 
            isActive={isActivePath("/humanitarian-orgs")}
          >
            Humanitarci
          </NavLink>

          <NavLink 
            href="/providers" 
            isActive={isActivePath("/providers")}
            disabled={!permissions.providers}
          >
            {!permissions.providers && <Lock className="h-3 w-3 mr-1" />}
            Provajderi
          </NavLink>

          <NavLink 
            href="/operators" 
            isActive={isActivePath("/operators")}
          >
            Operateri
          </NavLink>

          <NavLink 
            href="/bulk-services" 
            isActive={isActivePath("/bulk-services")}
          >
            Bulk Servisi
          </NavLink>

          <NavLink 
            href="/parking-services" 
            isActive={isActivePath("/parking-services")}
          >
            Parking
          </NavLink>

          <CustomDropdown
            trigger="Reklamacije"
            items={reklamacijeItems}
            isActive={isTriggerActive(reklamacijePaths)}
          />

          <NavLink 
            href="/contracts" 
            isActive={isActivePath("/contracts")}
          >
            Ugovori
          </NavLink>

          <NavLink 
            href="/services" 
            isActive={isActivePath("/services")}
          >
            Servisi
          </NavLink>

          <CustomDropdown
            trigger="Analytics"
            items={analyticsItems}
            isActive={isTriggerActive(analyticsPaths)}
            disabled={!permissions.analytics}
          />

          <NavLink 
            href="/reports" 
            isActive={isActivePath("/reports")}
            disabled={!permissions.reports}
          >
            {!permissions.reports && <Lock className="h-3 w-3 mr-1" />}
            Reports
          </NavLink>
        </div>
      </div>

      <div className="ml-auto flex-shrink-0">
        <RefreshSessionButton />
        <ClientSideUserButton />
      </div>
    </nav>
  );
};