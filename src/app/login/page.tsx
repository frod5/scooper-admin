import { redirect } from "next/navigation";
import { LoginPage } from "@/components/login/LoginPage";
import { getCurrentProfile } from "@/lib/auth/session";
import { homePath } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function Page() {
  const profile = await getCurrentProfile();
  if (profile) redirect(homePath(profile.role));
  return <LoginPage />;
}
