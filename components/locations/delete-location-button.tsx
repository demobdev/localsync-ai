"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteLocationAction } from "@/app/actions/locations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteLocationButton({
  locationId,
  locationName,
}: {
  locationId: string;
  locationName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteLocationAction(locationId);
        toast.success(`Deleted ${locationName}`);
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete location",
        );
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isPending}
        onClick={() => setOpen(true)}
        aria-label={`Delete ${locationName}`}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2Icon className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {locationName}?</DialogTitle>
            <DialogDescription>
              This removes the profile, version history, audits, visibility page,
              and tasks. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending ? "Deleting…" : "Delete location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
