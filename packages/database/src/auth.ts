import type { BolanteroClient } from "./client";
import type { Tables } from "./types";

export type Profile = Tables<"profiles">;

export async function getSessionProfile(
  client: BolanteroClient,
): Promise<Profile | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function requireRole(
  client: BolanteroClient,
  roles: Profile["role"][],
): Promise<Profile> {
  const profile = await getSessionProfile(client);
  if (!profile || !roles.includes(profile.role)) {
    throw new Error("Unauthorized");
  }
  return profile;
}
