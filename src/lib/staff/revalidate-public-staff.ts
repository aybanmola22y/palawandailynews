import { revalidatePath, revalidateTag } from "next/cache";

export function revalidatePublicStaffProfiles() {
  revalidateTag("staff-profiles");
  revalidatePath("/api/staff-profiles");
}
