import { supabase } from "./supabase";
import { storeProfileId } from "./deviceId";

export async function createProfile({ name, introversion, gender, age }) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      name,
      introversion,
      gender,
      age,
      is_onboarded: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create profile:", error.message);
    return null;
  }

  // Use the Supabase-generated UUID as the device identifier
  await storeProfileId(data.id);

  // Write it back so we can look up by device_id on future launches
  await supabase
    .from("profiles")
    .update({ device_id: data.id })
    .eq("id", data.id);

  return data;
}
