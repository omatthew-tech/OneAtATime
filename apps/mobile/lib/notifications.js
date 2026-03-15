import { Platform } from "react-native";
import { upsertPushToken } from "./api";

let Notifications = null;

try {
  Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  console.warn("expo-notifications not available:", e.message);
}

export async function registerForPushNotifications(profileId) {
  if (!Notifications) return null;

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "d19b8d0f-c94d-4632-8fae-42ae3677ac4e",
    });
    const token = tokenData.data;

    await upsertPushToken(profileId, token, Platform.OS);

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return token;
  } catch (e) {
    console.warn("Push registration failed:", e);
    return null;
  }
}

export function addNotificationResponseListener(callback) {
  if (!Notifications) {
    return { remove: () => {} };
  }
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data || {};
    callback(data);
  });
}
