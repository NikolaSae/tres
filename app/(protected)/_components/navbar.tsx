// Path: /app/(protected)/_components/navbar.tsx
"use client";

"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClientSideUserButton } from "@/components/auth/client-side-user-button";
import { NavLink } from "@/components/ui/nav-link";

interface DropdownItem {
  href: string;
  title: string;
  description?: string;
}

interface CustomDropdownProps {
  trigger: string;
  items: DropdownItem[];
  isActive: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ trigger, items, isActive }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const router = useRouter();

  const handleMouseEnter = () => {
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

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
          
          <div className="absolute left-0 top-full mt-2 w-[250px] bg-popover border rounded-md shadow-lg z-50">
            <ul className="grid gap-1 p-4">
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    onClick={() => {
                      console.log("[NAVBAR] Dropdown link clicked:", item.href);
                      setIsOpen(false);
                    }}
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left"
                  >
                    <div className="text-sm font-medium leading-none">{item.title}</div>
                    {item.description && (
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </NavLink>
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
  
  const isActivePath = (href: string) => pathname.startsWith(href);
  const isTriggerActive = (paths: string[]) => paths.some(p => isActivePath(p));

  const reklamacijePaths = ["/complaints", "/admin/complaints"];
  const analyticsPaths = ["/analytics", "/analytics/reports"];

  const reklamacijeItems = [
    { href: "/complaints", title: "Sve reklamacije", description: "Pregled svih reklamacija u sistemu" },
    { href: "/admin/complaints", title: "Admin panel", description: "Administrativno upravljanje reklamacijama" }
  ];

  const analyticsItems = [
    { href: "/analytics", title: "Pregled", description: "Osnovni analytics dashboard" },
    { href: "/analytics/reports", title: "Izveštaji", description: "Detaljni izveštaji i statistike" }
  ];

  return (
    <nav className="relative w-full flex items-center justify-between p-4 shadow-sm z-50">
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <NavLink href="/humanitarian-orgs" isActive={isActivePath("/humanitarian-orgs")}>
            Humanitarci
          </NavLink>

          <NavLink href="/providers" isActive={isActivePath("/providers")}>
            Provajderi
          </NavLink>

          <NavLink href="/operators" isActive={isActivePath("/operators")}>
            Operateri
          </NavLink>

          <NavLink href="/bulk-services" isActive={isActivePath("/bulk-services")}>
            Bulk Servisi
          </NavLink>

          <NavLink href="/parking-services" isActive={isActivePath("/parking-services")}>
            Parking
          </NavLink>

          <CustomDropdown
            trigger="Reklamacije"
            items={reklamacijeItems}
            isActive={isTriggerActive(reklamacijePaths)}
          />

          <NavLink href="/contracts" isActive={isActivePath("/contracts")}>
            Ugovori
          </NavLink>

          <NavLink href="/services" isActive={isActivePath("/services")}>
            Servisi
          </NavLink>

          <CustomDropdown
            trigger="Analytics"
            items={analyticsItems}
            isActive={isTriggerActive(analyticsPaths)}
          />

          <NavLink href="/reports" isActive={isActivePath("/reports")}>
            Reports
          </NavLink>
        </div>
      </div>

      <div className="ml-auto flex-shrink-0">
        <ClientSideUserButton />
      </div>
    </nav>
  );
};