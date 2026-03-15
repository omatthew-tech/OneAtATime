import * as SecureStore from "expo-secure-store";

const KEY = "oaat_profile_id";

export async function getStoredProfileId() {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function storeProfileId(id) {
  return SecureStore.setItemAsync(KEY, id);
}

export async function clearProfileId() {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Key may not exist
  }
}
