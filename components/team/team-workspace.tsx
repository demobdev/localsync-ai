"use client";

import { useActionState, useMemo, useState } from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CrownIcon,
  EyeIcon,
  LockKeyholeIcon,
  MoreHorizontalIcon,
  SearchIcon,
  SendIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";

import {
  inviteTeamMemberAction,
  removeTeamMemberAction,
  resendTeamInvitationAction,
  type InviteTeamState,
} from "@/app/actions/team";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export type TeamMemberView = {
  id: string;
  userId: string;
  name: string;
  email: string;
  imageUrl: string;
  role: "Owner" | "Admin" | "Member";
  joinedAt: string;
  isCurrentUser: boolean;
};

export type TeamInvitationView = {
  id: string;
  email: string;
  role: "Admin" | "Member";
  status: "pending" | "accepted" | "revoked" | "expired";
  sentAt: string;
  expiresAt: string;
};

type TeamWorkspaceProps = {
  workspaceName: string;
  members: TeamMemberView[];
  invitations: TeamInvitationView[];
  seatLimit: number;
  canManage: boolean;
};

const initialInviteTeamState: InviteTeamState = {
  status: "idle",
  message: "",
};

const roleDetails = [
  {
    name: "Owner",
    description:
      "Controls billing, members, roles, and every workspace setting.",
    icon: CrownIcon,
    color: "text-violet-500",
    surface: "bg-violet-500/10",
  },
  {
    name: "Admin",
    description: "Manages teammates and has full access to workspace data.",
    icon: ShieldCheckIcon,
    color: "text-primary",
    surface: "bg-primary/10",
  },
  {
    name: "Member",
    description:
      "Works across clients and locations without managing the team.",
    icon: SparklesIcon,
    color: "text-amber-500",
    surface: "bg-amber-500/10",
  },
  {
    name: "Viewer",
    description: "Planned: read-only access to assigned clients and locations.",
    icon: EyeIcon,
    color: "text-sky-500",
    surface: "bg-sky-500/10",
  },
] as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    inviteTeamMemberAction,
    initialInviteTeamState,
  );
  const [role, setRole] = useState<"org:admin" | "org:member">("org:member");
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <form action={formAction} className="space-y-6 px-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="team-email">Email address</Label>
            <Input
              id="team-email"
              name="email"
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              required
              aria-invalid={Boolean(state.fieldErrors?.email)}
              className="h-10"
            />
            {state.fieldErrors?.email?.map((error) => (
              <p key={error} className="text-xs text-destructive">
                {error}
              </p>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              name="role"
              value={role}
              onValueChange={(value) =>
                value && setRole(value as "org:admin" | "org:member")
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue>
                  {role === "org:admin" ? "Admin" : "Member"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="org:member">Member</SelectItem>
                <SelectItem value="org:admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs leading-5 text-muted-foreground">
              {role === "org:admin"
                ? "Admins can invite teammates and manage the entire workspace."
                : "Members can currently work across every client and location."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-note">Personal note</Label>
            <Textarea
              id="team-note"
              name="note"
              placeholder="Optional context for your teammate"
              className="min-h-24 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Clerk sends the secure invitation. Personalized note delivery is
              not included yet.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <Checkbox
              name="accessAcknowledged"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(Boolean(checked))}
              className="mt-0.5"
            />
            <span className="text-xs leading-5 text-muted-foreground">
              I understand this teammate will receive workspace-wide access.
              Client-scoped access is not enabled yet.
            </span>
          </label>
          {state.fieldErrors?.accessAcknowledged?.map((error) => (
            <p key={error} className="text-xs text-destructive">
              {error}
            </p>
          ))}

          {state.message ? (
            <div
              className={
                state.status === "success"
                  ? "flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"
                  : "flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              }
              aria-live="polite"
            >
              {state.status === "success" ? (
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
              ) : (
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
              )}
              {state.message}
            </div>
          ) : null}

          {state.status === "success" ? (
            <Button type="button" size="lg" className="w-full" onClick={onDone}>
              <CheckCircle2Icon />
              Done
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={pending || !acknowledged}
            >
              <SendIcon />
              {pending ? "Sending invitation…" : "Send invitation"}
            </Button>
          )}

          <div className="border-t pt-6">
            <h3 className="mb-4 text-sm font-semibold">Role permissions</h3>
            <div className="space-y-4">
              {roleDetails.map((detail) => {
                const Icon = detail.icon;
                return (
                  <div key={detail.name} className="flex gap-3">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${detail.surface} ${detail.color}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{detail.name}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {detail.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
    </form>
  );
}

function InviteDrawer({ canManage }: { canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setFormKey((current) => current + 1);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button size="lg" disabled={!canManage}>
            <UserPlusIcon />
            Invite teammate
          </Button>
        }
      />
      <SheetContent
        side="right"
        className="w-[min(100vw,460px)] gap-0 overflow-y-auto border-l bg-background p-0 sm:max-w-[460px]"
      >
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-xl font-semibold">
            Invite teammate
          </SheetTitle>
          <SheetDescription>
            Add one trusted internal teammate to this workspace.
          </SheetDescription>
        </SheetHeader>

        <InviteForm
          key={formKey}
          onDone={() => handleOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

function MemberActions({ member }: { member: TeamMemberView }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Manage ${member.name}`}
          />
        }
      >
        <MoreHorizontalIcon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {member.name}?</DialogTitle>
          <DialogDescription>
            They will lose access to this workspace. You can invite them again
            at any time.
          </DialogDescription>
        </DialogHeader>
        <form action={removeTeamMemberAction}>
          <input type="hidden" name="userId" value={member.userId} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Keep member
            </DialogClose>
            <Button type="submit" variant="destructive">
              Remove member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamWorkspace({
  workspaceName,
  members,
  invitations,
  seatLimit,
  canManage,
}: TeamWorkspaceProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleMembers = useMemo(
    () =>
      normalizedQuery
        ? members.filter((member) =>
            `${member.name} ${member.email} ${member.role}`
              .toLowerCase()
              .includes(normalizedQuery),
          )
        : members,
    [members, normalizedQuery],
  );
  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Control who can work inside {workspaceName}.
          </p>
        </div>
        <InviteDrawer canManage={canManage} />
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border bg-card px-5 py-5 localmap-card-glow sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UsersIcon className="size-5" />
          </span>
          <div>
            <p className="font-semibold">
              {members.length} of {seatLimit} seats used
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {Math.max(seatLimit - members.length, 0)} seats remain in Clerk.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <LockKeyholeIcon className="size-3.5" />
          Identity and invitations secured by Clerk
        </div>
      </section>

      <Tabs defaultValue="members" className="gap-4">
        <TabsList variant="line" className="h-10 gap-5 border-b">
          <TabsTrigger value="members" className="px-1">
            Members{" "}
            <span className="text-xs text-muted-foreground">
              {members.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="px-1">
            Invitations
            {pendingInvitations.length ? (
              <Badge variant="secondary" className="ml-1">
                {pendingInvitations.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">Keep client access scoped.</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Internal teammates can join this workspace. Client accounts should
              wait for location-level permissions instead of receiving full
              agency access.
            </p>
          </div>
        </div>

        <TabsContent value="members" className="space-y-4">
          <div className="relative max-w-md">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search members"
              className="h-10 pl-9"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="px-4">Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar size="lg">
                          <AvatarImage src={member.imageUrl} alt="" />
                          <AvatarFallback>
                            {initials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium">
                              {member.name}
                            </p>
                            {member.isCurrentUser ? (
                              <span className="text-[11px] text-muted-foreground">
                                You
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role === "Owner" ? "secondary" : "outline"
                        }
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      All clients
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-sm">
                        <span className="size-1.5 rounded-full bg-emerald-500" />{" "}
                        Active
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.joinedAt}
                    </TableCell>
                    <TableCell>
                      {canManage && !member.isCurrentUser ? (
                        <MemberActions member={member} />
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled
                          aria-label={`Manage ${member.name}`}
                        >
                          <MoreHorizontalIcon />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {visibleMembers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No teammates match that search.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="invitations">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="px-4">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-28">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="px-4 py-4 font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>{invitation.role}</TableCell>
                    <TableCell className="capitalize">
                      {invitation.status}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invitation.sentAt}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invitation.expiresAt}
                    </TableCell>
                    <TableCell>
                      {canManage && invitation.status === "pending" ? (
                        <form action={resendTeamInvitationAction}>
                          <input
                            type="hidden"
                            name="invitationId"
                            value={invitation.id}
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Send again
                          </Button>
                        </form>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
                {invitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center">
                      <div className="mx-auto max-w-sm">
                        <p className="font-medium">No invitations yet</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Use one controlled internal test before inviting the
                          rest of the team.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
