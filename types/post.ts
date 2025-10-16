export interface Post {
  id: string;
  userId: string;
  type: "reel" | "image";
  mediaUrls: MediaUrl[];
  thumbnail: string;
  caption: string;
  tags: string[];
  country: string;
  countryFlag: string;
  isHd: boolean;
  status: "active" | "reported" | "removed";
  createdAt: string;
  
  // User info (denormalized for performance)
  userDisplayName: string;
  userAvatar: string;
  userCountry: string;
  
  // Stats
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  giftsCount: number;
  
  // User interaction state
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface MediaUrl {
  quality: "360p" | "540p" | "720p" | "1080p";
  url: string;
  width: number;
  height: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userDisplayName: string;
  userAvatar: string;
  text: string;
  parentId?: string;
  status: "active" | "reported" | "removed";
  createdAt: string;
  
  // Stats
  likesCount: number;
  repliesCount: number;
  
  // User interaction
  isLiked?: boolean;
  
  // Nested replies (for UI)
  replies?: Comment[];
}

export interface Like {
  id: string;
  postId?: string;
  commentId?: string;
  userId: string;
  createdAt: string;
}

export interface PostReport {
  id: string;
  entityType: "post" | "comment" | "user";
  entityId: string;
  reporterId: string;
  reasonCode: string;
  reasonText?: string;
  evidenceUrl?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "like" | "comment" | "reply" | "gift" | "follow" | "mention";
  actorId: string;
  actorDisplayName: string;
  actorAvatar: string;
  payload: NotificationPayload;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPayload {
  postId?: string;
  commentId?: string;
  giftId?: string;
  text?: string;
  thumbnail?: string;
}

export interface PostUpload {
  type: "reel" | "image";
  mediaFile: {
    uri: string;
    type: string;
    name: string;
  };
  caption: string;
  tags: string[];
  country: string;
  countryFlag: string;
}
