import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "./firebase";

export type NotificationType =
  | "interview_completed"
  | "performance_improved"
  | "performance_warning"
  | "resume_uploaded"
  | "streak"
  | "milestone";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string | null;
  createdAt: Timestamp | null;
}

/**
 * Create a notification for a user.
 */
export async function createNotification(
  uid: string,
  notification: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string | null;
  },
): Promise<void> {
  const notificationsRef = collection(db, "users", uid, "notifications");

  await addDoc(notificationsRef, {
    title: notification.title,
    message: notification.message,
    type: notification.type,
    link: notification.link ?? null,
    read: false,
    createdAt: serverTimestamp(),
  });
}

/**
 * Get all notifications for a user.
 * Newest notifications appear first.
 */
export async function getUserNotifications(
  uid: string,
): Promise<Notification[]> {
  const notificationsRef = collection(db, "users", uid, "notifications");

  const notificationsQuery = query(
    notificationsRef,
    orderBy("createdAt", "desc"),
  );

  const snapshot = await getDocs(notificationsQuery);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Notification, "id">),
  }));
}

/**
 * Mark one notification as read.
 */
export async function markNotificationAsRead(
  uid: string,
  notificationId: string,
): Promise<void> {
  const notificationRef = doc(
    db,
    "users",
    uid,
    "notifications",
    notificationId,
  );

  await updateDoc(notificationRef, {
    read: true,
  });
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsAsRead(
  uid: string,
  notifications: Notification[],
): Promise<void> {
  const unreadNotifications = notifications.filter(
    (notification) => !notification.read,
  );

  await Promise.all(
    unreadNotifications.map((notification) =>
      markNotificationAsRead(uid, notification.id),
    ),
  );
}
