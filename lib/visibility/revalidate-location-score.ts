import { revalidatePath } from "next/cache";

/** Revalidate dashboard + location surfaces that show workspace health. */
export function revalidateLocationScorePaths(locationId: string): void {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/locations/${locationId}`);
  revalidatePath(`/dashboard/locations/${locationId}/listings`);
  revalidatePath(`/dashboard/locations/${locationId}/visibility`);
}
