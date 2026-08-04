"use client";

import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { Building2Icon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkspaceOption } from "@/lib/org/workspace-options";

export function WorkspaceSwitcher({
  workspaces,
}: {
  workspaces: WorkspaceOption[];
}) {
  const { organization } = useOrganization();
  const { isLoaded, setActive } = useOrganizationList();

  if (!isLoaded || workspaces.length <= 1) {
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
        <DropdownMenuGroup>
          <DropdownMenuLabel>Authorized workspaces</DropdownMenuLabel>
          {workspaces.map((item) => {
            const active = item.organizationId === organization?.id;
            return (
              <DropdownMenuItem
                key={item.organizationId}
                onClick={() => void switchWorkspace(item.organizationId)}
                className="gap-2 py-2"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Building2Icon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">
                    {item.name}
                  </span>
                  <span className="block text-[10px] capitalize text-muted-foreground">
                    {item.setupComplete
                      ? `${item.businessCount} ${item.businessCount === 1 ? "business" : "businesses"}`
                      : "Setup incomplete"}
                  </span>
                </span>
                {active ? (
                  <CheckIcon className="size-3.5 text-primary" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[10px] leading-4 text-muted-foreground">
          New workspaces are created by a LocalMap administrator.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
