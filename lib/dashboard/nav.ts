import {
  Building2,
  ClipboardList,
  Download,
  LayoutDashboard,
  MapPin,
  Share2,
} from "lucide-react";

export const dashboardNav = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    href: "/dashboard/clients",
    icon: Building2,
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
    title: "Import",
    href: "/dashboard/import/google",
    icon: Download,
  },
] as const;
