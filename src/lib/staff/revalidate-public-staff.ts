import { revalidatePath } from "next/cache";

export function revalidatePublicStaffProfiles() {
  revalidatePath("/api/staff-profiles");
}
