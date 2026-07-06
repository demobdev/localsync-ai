import {
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
] as const;
