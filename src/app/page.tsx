import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { homePath } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  redirect(homePath(profile.role));
}
