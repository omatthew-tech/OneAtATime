import { supabase } from "./supabase";
import { storeProfileId } from "./deviceId";

export async function createProfile({ name, introversion, gender, age }) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      name,
      introversion,
      gender,
      age,
      is_onboarded: false,
      user_id: user?.id || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create profile:", error.message);
    return null;
  }

  await storeProfileId(data.id);

  await supabase
    .from("profiles")
    .update({ device_id: data.id })
    .eq("id", data.id);

  return data;
}
