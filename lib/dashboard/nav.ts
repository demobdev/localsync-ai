import {
  ClipboardList,
  CreditCard,
  Download,
  LayoutDashboard,
  MapPin,
  Share2,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const baseDashboardNav: DashboardNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Locations",
    href: "/dashboard/locations",
    icon: MapPin,
  },
  {
    title: "Publishers",
    href: "/dashboard/publishers",
    icon: Share2,
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks",
    icon: ClipboardList,
  },
  {
    title: "Connect",
    href: "/dashboard/connect",
    icon: Download,
  },
];

const clientsNavItem: DashboardNavItem = {
  title: "Clients",
  href: "/dashboard/clients",
  icon: Users,
};

const teamNavItem: DashboardNavItem = {
  title: "Team",
  href: "/dashboard/team",
  icon: UserPlus,
};

const billingNavItem: DashboardNavItem = {
  title: "Billing",
  href: "/dashboard/billing",
  icon: CreditCard,
};

export function getDashboardNav(isAgency: boolean): DashboardNavItem[] {
  const teamItem = teamNavItem;

  if (!isAgency) {
    return [
      baseDashboardNav[0]!,
      teamItem,
      ...baseDashboardNav.slice(1),
      billingNavItem,
    ];
  }

  return [
    baseDashboardNav[0]!,
    clientsNavItem,
    teamItem,
    ...baseDashboardNav.slice(1),
    billingNavItem,
  ];
}

/** @deprecated Use getDashboardNav(isAgency) for workspace-aware navigation. */
export const dashboardNav = baseDashboardNav;
