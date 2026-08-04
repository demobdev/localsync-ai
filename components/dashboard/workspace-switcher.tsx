"use client";

import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { Building2Icon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WorkspaceSwitcher() {
  const { organization } = useOrganization();
  const { userMemberships, isLoaded, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const orgCount = userMemberships.data?.length ?? 0;

  if (!isLoaded || orgCount <= 1) {
    return null;
  }

  async function switchWorkspace(organizationId: string) {
    if (organizationId === organization?.id) return;
    await setActive?.({ organization: organizationId });
    window.location.assign("/dashboard");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-auto w-full justify-start gap-2 px-2.5 py-2 text-left"
          />
        }
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
          <Building2Icon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium">
            {organization?.name ?? "Select workspace"}
          </span>
          <span className="block text-[10px] font-normal text-muted-foreground">
            Switch workspace
          </span>
        </span>
        <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-64">
        <DropdownMenuLabel>Authorized workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userMemberships.data?.map((membership) => {
          const item = membership.organization;
          const active = item.id === organization?.id;
          return (
            <DropdownMenuItem
              key={membership.id}
              onClick={() => void switchWorkspace(item.id)}
              className="gap-2 py-2"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building2Icon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{item.name}</span>
                <span className="block text-[10px] capitalize text-muted-foreground">
                  {membership.role.replace("org:", "")}
                </span>
              </span>
              {active ? <CheckIcon className="size-3.5 text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[10px] leading-4 text-muted-foreground">
          New workspaces are created by a LocalMap administrator.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
