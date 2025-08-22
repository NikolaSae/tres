// Path: /app/(protected)/_components/navbar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { ClientSideUserButton } from "@/components/auth/client-side-user-button";

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
          "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
          isActive && "bg-accent text-accent-foreground"
        )}
      >
        {trigger}
        <ChevronDown
          className={cn(
            "relative top-[1px] ml-1 h-3 w-3 transition duration-300",
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
                  <button
                    onClick={() => {
                      console.log("[NAVBAR] Dropdown link clicked:", item.href);
                      setIsOpen(false);
                      router.push(item.href);
                    }}
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full text-left"
                  >
                    <div className="text-sm font-medium leading-none">{item.title}</div>
                    {item.description && (
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

// Debug Link wrapper with multiple navigation strategies
const NavLink: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
}> = ({ href, children, className }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = React.useState(false);
  
  const handleClick = async (e: React.MouseEvent) => {
    console.log("[NAVBAR] === NAVIGATION DEBUG START ===");
    console.log("[NAVBAR] Link clicked:", href);
    console.log("[NAVBAR] Current pathname:", pathname);
    console.log("[NAVBAR] Current window.location:", window.location.href);
    console.log("[NAVBAR] Router object:", router);
    
    // Prevent double clicks
    if (isNavigating) {
      console.log("[NAVBAR] Already navigating, ignoring click");
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsNavigating(true);
      console.log("[NAVBAR] Starting navigation to:", href);
      
      // Try multiple navigation methods
      console.log("[NAVBAR] Method 1: router.push()");
      await router.push(href);
      
      // Add small delay to see if it helps
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("[NAVBAR] Method 1 completed");
      
      // Check if navigation actually happened
      if (window.location.pathname !== href) {
        console.log("[NAVBAR] Method 1 failed, trying router.replace()");
        await router.replace(href);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (window.location.pathname !== href) {
          console.log("[NAVBAR] Method 2 failed, trying window.location");
          window.location.href = href;
        }
      }
      
      console.log("[NAVBAR] Final URL:", window.location.href);
      
    } catch (error) {
      console.error("[NAVBAR] Navigation error:", error);
      console.log("[NAVBAR] Fallback to window.location");
      window.location.href = href;
    } finally {
      setIsNavigating(false);
      console.log("[NAVBAR] === NAVIGATION DEBUG END ===");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isNavigating}
      className={cn(
        className,
        isNavigating && "opacity-50 cursor-not-allowed"
      )}
    >
      {isNavigating ? "Loading..." : children}
    </button>
  );
};

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  
  console.log("[NAVBAR] Current pathname:", pathname);
  
  const isActivePath = (href: string) => pathname.startsWith(href);
  const isTriggerActive = (paths: string[]) => paths.some(p => isActivePath(p));

  const reklamacijePaths = ["/complaints", "/admin/complaints"];
  const analyticsPaths = ["/analytics", "/analytics/reports"];

  const reklamacijeItems: DropdownItem[] = [
    { href: "/complaints", title: "Sve reklamacije", description: "Pregled svih reklamacija u sistemu" },
    { href: "/admin/complaints", title: "Admin panel", description: "Administrativno upravljanje reklamacijama" }
  ];

  const analyticsItems: DropdownItem[] = [
    { href: "/analytics", title: "Pregled", description: "Osnovni analytics dashboard" },
    { href: "/analytics/reports", title: "Izveštaji", description: "Detaljni izveštaji i statistike" }
  ];

  return (
    <nav className="relative w-full flex items-center justify-between p-4 shadow-sm z-50">
      <div className="flex-grow">
        <div className="flex items-center space-x-1">
          {/* Navigation Links using button approach */}
          <NavLink
            href="/humanitarian-orgs"
            className={cn(
              "inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-none cursor-pointer",
              isActivePath("/humanitarian-orgs") && "bg-accent text-accent-foreground"
            )}
          >
            Humanitarci
          </NavLink>

          <NavLink
            href="/providers"
            className={cn(
              "inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-none cursor-pointer",
              isActivePath("/providers") && "bg-accent text-accent-foreground"
            )}
          >
            Provajderi
          </NavLink>

          <NavLink
            href="/operators"
            className={cn(
              "inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-none cursor-pointer",
              isActivePath("/operators") && "bg-accent text-accent-foreground"
            )}
          >
            Operateri
          </NavLink>

          <NavLink
            href="/bulk-services"
            className={cn(
              "inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-none cursor-pointer",
              isActivePath("/bulk-services") && "bg-accent text-accent-foreground"
            )}
          >
            Bulk Servisi
          </NavLink>

          <NavLink
            href="/parking-services"
            className={cn(
              "inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-none cursor-pointer",
              isActivePath("/parking-services") && "bg-accent text-accent-foreground"
            )}
          >
            Parking
          </NavLink>

          {/* Custom Dropdowns */}
          <CustomDropdown
            trigger="Reklamacije"
            items={reklamacijeItems}
            isActive={isTriggerActive(reklamacijePaths)}
          />

          <NavLink
            href="/contracts"
            className={cn(
              "inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-none cursor-pointer",
              isActivePath("/contracts") && "bg-accent text-accent-foreground"
            )}
          >
            Ugovori
          </NavLink>

          <NavLink
            href="/services"
            className={cn(
              "inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-none cursor-pointer",
              isActivePath("/services") && "bg-accent text-accent-foreground"
            )}
          >
            Servisi
          </NavLink>

          <CustomDropdown
            trigger="Analytics"
            items={analyticsItems}
            isActive={isTriggerActive(analyticsPaths)}
          />

          <NavLink
            href="/reports"
            className={cn(
              "inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-none cursor-pointer",
              isActivePath("/reports") && "bg-accent text-accent-foreground"
            )}
          >
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