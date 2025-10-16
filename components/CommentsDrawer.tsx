import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { X, Heart, Send } from "lucide-react-native";
import type { Comment } from "@/types/post";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CommentsDrawerProps {
  visible: boolean;
  postId: string;
  comments: Comment[];
  onClose: () => void;
  onAddComment: (text: string, parentId?: string) => void;
  onLikeComment: (commentId: string) => void;
  onReply: (comment: Comment) => void;
}

export default function CommentsDrawer({
  visible,
  postId,
  comments,
  onClose,
  onAddComment,
  onLikeComment,
  onReply,
}: CommentsDrawerProps) {
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleSendComment = () => {
    if (commentText.trim()) {
      onAddComment(commentText.trim(), replyingTo?.id);
      setCommentText("");
      setReplyingTo(null);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    onReply(comment);
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <Image source={{ uri: item.userAvatar }} style={styles.commentAvatar} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{item.userDisplayName}</Text>
          <Text style={styles.commentTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentActionButton}
            onPress={() => handleReply(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.commentActionText}>Reply</Text>
          </TouchableOpacity>
          {item.likesCount > 0 && (
            <Text style={styles.commentLikesCount}>
              {item.likesCount} {item.likesCount === 1 ? "like" : "likes"}
            </Text>
          )}
        </View>

        {item.replies && item.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {item.replies.map((reply) => (
              <View key={reply.id} style={styles.replyContainer}>
                <Image
                  source={{ uri: reply.userAvatar }}
                  style={styles.replyAvatar}
                />
                <View style={styles.replyContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUsername}>
                      {reply.userDisplayName}
                    </Text>
                    <Text style={styles.commentTime}>{formatTime(reply.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentText}>{reply.text}</Text>
                </View>
                <TouchableOpacity
                  style={styles.likeButton}
                  onPress={() => onLikeComment(reply.id)}
                  activeOpacity={0.7}
                >
                  <Heart
                    color={reply.isLiked ? "#FF2D55" : "#888888"}
                    size={16}
                    fill={reply.isLiked ? "#FF2D55" : "transparent"}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.likeButton}
        onPress={() => onLikeComment(item.id)}
        activeOpacity={0.7}
      >
        <Heart
          color={item.isLiked ? "#FF2D55" : "#888888"}
          size={20}
          fill={item.isLiked ? "#FF2D55" : "transparent"}
          strokeWidth={2}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Comments {comments.length > 0 && `(${comments.length})`}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X color="#000000" size={24} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No comments yet</Text>
                <Text style={styles.emptySubtext}>Be the first to comment!</Text>
              </View>
            }
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            {replyingTo && (
              <View style={styles.replyingToContainer}>
                <Text style={styles.replyingToText}>
                  Replying to @{replyingTo.userDisplayName}
                </Text>
                <TouchableOpacity
                  onPress={() => setReplyingTo(null)}
                  activeOpacity={0.7}
                >
                  <X color="#888888" size={16} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor="#888888"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !commentText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSendComment}
                disabled={!commentText.trim()}
                activeOpacity={0.7}
              >
                <Send
                  color={commentText.trim() ? "#7C3AED" : "#CCCCCC"}
                  size={24}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function formatTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.7,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#DDDDDD",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#000000",
  },
  closeButton: {
    padding: 4,
  },
  commentsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  commentContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEEEEE",
  },
  commentContent: {
    flex: 1,
    gap: 6,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000000",
  },
  commentTime: {
    fontSize: 12,
    color: "#888888",
  },
  commentText: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 4,
  },
  commentActionButton: {
    paddingVertical: 2,
  },
  commentActionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#888888",
  },
  commentLikesCount: {
    fontSize: 12,
    color: "#888888",
  },
  likeButton: {
    padding: 4,
  },
  repliesContainer: {
    marginTop: 12,
    gap: 12,
  },
  replyContainer: {
    flexDirection: "row",
    gap: 10,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEEEEE",
  },
  replyContent: {
    flex: 1,
    gap: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#888888",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#AAAAAA",
  },
  replyingToContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
  },
  replyingToText: {
    fontSize: 13,
    color: "#666666",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    fontSize: 15,
    color: "#000000",
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
