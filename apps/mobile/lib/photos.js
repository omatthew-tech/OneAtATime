import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

function base64ToArrayBuffer(base64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(128);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  let bufLen = (base64.length * 3) / 4;
  if (base64[base64.length - 1] === "=") bufLen--;
  if (base64[base64.length - 2] === "=") bufLen--;

  const bytes = new Uint8Array(bufLen);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const a = lookup[base64.charCodeAt(i)];
    const b = lookup[base64.charCodeAt(i + 1)];
    const c = lookup[base64.charCodeAt(i + 2)];
    const d = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = (a << 2) | (b >> 4);
    if (p < bufLen) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < bufLen) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes.buffer;
}

export async function pickAndUploadPhoto(profileId, displayOrder) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    console.warn("Photo library permission denied");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const storagePath = `${profileId}/${displayOrder}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(storagePath, base64ToArrayBuffer(asset.base64), {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    console.error("Photo upload failed:", uploadError.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("photos")
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Upsert the photo row
  const { data: existing } = await supabase
    .from("photos")
    .select("id")
    .eq("profile_id", profileId)
    .eq("display_order", displayOrder)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("photos")
      .update({ storage_path: storagePath, public_url: publicUrl })
      .eq("id", existing.id);
  } else {
    await supabase.from("photos").insert({
      profile_id: profileId,
      storage_path: storagePath,
      public_url: publicUrl,
      display_order: displayOrder,
    });
  }

  return publicUrl;
}

export async function fetchExistingPhotos(profileId, totalSlots) {
  const { data } = await supabase
    .from("photos")
    .select("public_url, display_order")
    .eq("profile_id", profileId)
    .order("display_order");

  const slots = Array(totalSlots).fill(null);
  for (const row of data || []) {
    if (row.display_order < totalSlots) {
      slots[row.display_order] = row.public_url;
    }
  }
  return slots;
}

export async function deletePhoto(profileId, displayOrder) {
  const { data: photo } = await supabase
    .from("photos")
    .select("id, storage_path")
    .eq("profile_id", profileId)
    .eq("display_order", displayOrder)
    .maybeSingle();

  if (!photo) return;

  await supabase.storage.from("photos").remove([photo.storage_path]);
  await supabase.from("photos").delete().eq("id", photo.id);

  // Shift remaining photos down to fill the gap
  const { data: remaining } = await supabase
    .from("photos")
    .select("id, display_order")
    .eq("profile_id", profileId)
    .gt("display_order", displayOrder)
    .order("display_order");

  for (const row of remaining || []) {
    await supabase
      .from("photos")
      .update({ display_order: row.display_order - 1 })
      .eq("id", row.id);
  }
}
