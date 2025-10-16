import type { Notification, NotificationPayload } from "@/types/post";

export class NotificationService {
  private static notifications: Notification[] = [];
  private static listeners: ((notifications: Notification[]) => void)[] = [];

  static addNotification(
    userId: string,
    type: "like" | "comment" | "reply" | "gift" | "follow" | "mention",
    actorId: string,
    actorDisplayName: string,
    actorAvatar: string,
    payload: NotificationPayload
  ): void {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      actorId,
      actorDisplayName,
      actorAvatar,
      payload,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(notification);
    this.notifyListeners();

    console.log("Notification added:", notification);
  }

  static getNotifications(userId: string): Notification[] {
    return this.notifications.filter((n) => n.userId === userId);
  }

  static getUnreadCount(userId: string): number {
    return this.notifications.filter((n) => n.userId === userId && !n.readAt).length;
  }

  static markAsRead(notificationId: string): void {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (notification && !notification.readAt) {
      notification.readAt = new Date().toISOString();
      this.notifyListeners();
    }
  }

  static markAllAsRead(userId: string): void {
    const now = new Date().toISOString();
    this.notifications.forEach((n) => {
      if (n.userId === userId && !n.readAt) {
        n.readAt = now;
      }
    });
    this.notifyListeners();
  }

  static clearNotifications(userId: string): void {
    this.notifications = this.notifications.filter((n) => n.userId !== userId);
    this.notifyListeners();
  }

  static subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.notifications));
  }

  static sendLikeNotification(
    postOwnerId: string,
    actorId: string,
    actorDisplayName: string,
    actorAvatar: string,
    postId: string,
    thumbnail: string
  ): void {
    if (postOwnerId === actorId) return;

    this.addNotification(postOwnerId, "like", actorId, actorDisplayName, actorAvatar, {
      postId,
      thumbnail,
    });
  }

  static sendCommentNotification(
    postOwnerId: string,
    actorId: string,
    actorDisplayName: string,
    actorAvatar: string,
    postId: string,
    commentId: string,
    text: string,
    thumbnail: string
  ): void {
    if (postOwnerId === actorId) return;

    this.addNotification(postOwnerId, "comment", actorId, actorDisplayName, actorAvatar, {
      postId,
      commentId,
      text: text.substring(0, 100),
      thumbnail,
    });
  }

  static sendReplyNotification(
    commentOwnerId: string,
    actorId: string,
    actorDisplayName: string,
    actorAvatar: string,
    postId: string,
    commentId: string,
    text: string
  ): void {
    if (commentOwnerId === actorId) return;

    this.addNotification(commentOwnerId, "reply", actorId, actorDisplayName, actorAvatar, {
      postId,
      commentId,
      text: text.substring(0, 100),
    });
  }

  static sendGiftNotification(
    recipientId: string,
    actorId: string,
    actorDisplayName: string,
    actorAvatar: string,
    postId: string,
    giftId: string,
    thumbnail: string
  ): void {
    if (recipientId === actorId) return;

    this.addNotification(recipientId, "gift", actorId, actorDisplayName, actorAvatar, {
      postId,
      giftId,
      thumbnail,
    });
  }

  static sendFollowNotification(
    followedUserId: string,
    actorId: string,
    actorDisplayName: string,
    actorAvatar: string
  ): void {
    if (followedUserId === actorId) return;

    this.addNotification(followedUserId, "follow", actorId, actorDisplayName, actorAvatar, {});
  }

  static getNotificationMessage(notification: Notification): string {
    switch (notification.type) {
      case "like":
        return `${notification.actorDisplayName} liked your post`;
      case "comment":
        return `${notification.actorDisplayName} commented: "${notification.payload.text}"`;
      case "reply":
        return `${notification.actorDisplayName} replied to your comment: "${notification.payload.text}"`;
      case "gift":
        return `${notification.actorDisplayName} sent you a gift`;
      case "follow":
        return `${notification.actorDisplayName} started following you`;
      case "mention":
        return `${notification.actorDisplayName} mentioned you`;
      default:
        return "New notification";
    }
  }
}

export default NotificationService;
