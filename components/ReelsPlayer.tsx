import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
  FlatList,
  ViewToken,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import {
  Heart,
  MessageCircle,
  Send,
  Gift,
  MoreVertical,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import type { Post } from "@/types/post";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface ReelsPlayerProps {
  posts: Post[];
  initialIndex?: number;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onGift: (postId: string) => void;
  onReport: (postId: string) => void;
  onUserPress: (userId: string) => void;
}

export default function ReelsPlayer({
  posts,
  initialIndex = 0,
  onLike,
  onComment,
  onShare,
  onGift,
  onReport,
  onUserPress,
}: ReelsPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [showMore, setShowMore] = useState<Record<string, boolean>>({});
  const [visibleItems, setVisibleItems] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadMuteState = async () => {
      try {
        const saved = await AsyncStorage.getItem("reels_muted");
        if (saved !== null) {
          setIsMuted(saved === "true");
        }
      } catch (e) {
        console.log("Failed to load mute state", e);
      }
    };
    loadMuteState();
  }, []);

  const toggleMute = useCallback(async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    try {
      await AsyncStorage.setItem("reels_muted", String(newMuted));
    } catch (e) {
      console.log("Failed to save mute state", e);
    }
  }, [isMuted]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visible = viewableItems.map((item) => item.item.id);
    setVisibleItems(visible);
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const renderItem = useCallback(
    ({ item: post }: { item: Post }) => {
      const isVisible = visibleItems.includes(post.id);
      return (
        <ReelItem
          post={post}
          isVisible={isVisible}
          isMuted={isMuted}
          showMore={showMore[post.id] || false}
          onToggleMore={() =>
            setShowMore((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
          }
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onGift={onGift}
          onReport={onReport}
          onUserPress={onUserPress}
        />
      );
    },
    [visibleItems, isMuted, showMore, onLike, onComment, onShare, onGift, onReport, onUserPress]
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        removeClippedSubviews
        maxToRenderPerBatch={3}
        windowSize={3}
      />
      <TouchableOpacity
        style={styles.muteButton}
        onPress={toggleMute}
        activeOpacity={0.8}
      >
        {isMuted ? (
          <VolumeX color="#FFFFFF" size={24} />
        ) : (
          <Volume2 color="#FFFFFF" size={24} />
        )}
      </TouchableOpacity>
    </View>
  );
}

interface ReelItemProps {
  post: Post;
  isVisible: boolean;
  isMuted: boolean;
  showMore: boolean;
  onToggleMore: () => void;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onGift: (postId: string) => void;
  onReport: (postId: string) => void;
  onUserPress: (userId: string) => void;
}

function ReelItem({
  post,
  isVisible,
  isMuted,
  showMore,
  onToggleMore,
  onLike,
  onComment,
  onShare,
  onGift,
  onReport,
  onUserPress,
}: ReelItemProps) {
  const getVideoUrl = (p: Post): string => {
    const preferredQuality = Platform.OS === "web" ? "480p" : "720p";
    const media = p.mediaUrls.find((m) => m.quality === preferredQuality);
    return media?.url || p.mediaUrls[0]?.url || "";
  };

  const videoPlayer = useVideoPlayer(
    post.type === "reel" && isVisible ? getVideoUrl(post) : "",
    (player: any) => {
      player.loop = true;
      player.muted = isMuted;
      if (isVisible) {
        player.play();
      }
    }
  );

  useEffect(() => {
    if (post.type === "reel") {
      if (isVisible) {
        videoPlayer.replace(getVideoUrl(post));
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    }
  }, [isVisible, post, videoPlayer]);

  useEffect(() => {
    videoPlayer.muted = isMuted;
  }, [isMuted, videoPlayer]);

  return (
    <View style={styles.videoContainer}>
      {post.type === "reel" ? (
        <VideoView
          player={videoPlayer}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <Image
          source={{ uri: post.mediaUrls[0]?.url }}
          style={styles.video}
          resizeMode="cover"
        />
      )}

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
        style={styles.gradient}
      />

      <View style={styles.bottomContent}>
        <View style={styles.leftContent}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => onUserPress(post.userId)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: post.userAvatar }} style={styles.avatar} />
            <View style={styles.userTextContainer}>
              <Text style={styles.username}>{post.userDisplayName}</Text>
              <View style={styles.locationRow}>
                <Text style={styles.countryFlag}>{post.countryFlag}</Text>
                <Text style={styles.country}>{post.country}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {post.caption && (
            <Text style={styles.caption} numberOfLines={showMore ? undefined : 2}>
              {post.caption}
            </Text>
          )}
          {post.caption && post.caption.length > 100 && (
            <TouchableOpacity onPress={onToggleMore}>
              <Text style={styles.moreText}>
                {showMore ? "Show less" : "...more"}
              </Text>
            </TouchableOpacity>
          )}

          {post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.map((tag, index) => (
                <Text key={index} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(post.id)}
            activeOpacity={0.8}
          >
            <Heart
              color={post.isLiked ? "#FF2D55" : "#FFFFFF"}
              size={28}
              fill={post.isLiked ? "#FF2D55" : "transparent"}
              strokeWidth={2}
            />
            <Text style={styles.actionText}>
              {post.likesCount > 0 ? formatCount(post.likesCount) : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(post.id)}
            activeOpacity={0.8}
          >
            <MessageCircle color="#FFFFFF" size={28} strokeWidth={2} />
            <Text style={styles.actionText}>
              {post.commentsCount > 0 ? formatCount(post.commentsCount) : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onGift(post.id)}
            activeOpacity={0.8}
          >
            <Gift color="#FFFFFF" size={28} strokeWidth={2} />
            <Text style={styles.actionText}>
              {post.giftsCount > 0 ? formatCount(post.giftsCount) : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare(post.id)}
            activeOpacity={0.8}
          >
            <Send color="#FFFFFF" size={28} strokeWidth={2} />
            <Text style={styles.actionText}>
              {post.sharesCount > 0 ? formatCount(post.sharesCount) : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReport(post.id)}
            activeOpacity={0.8}
          >
            <MoreVertical color="#FFFFFF" size={24} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.5,
  },
  muteButton: {
    position: "absolute",
    top: 60,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  bottomContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 16,
  },
  leftContent: {
    flex: 1,
    gap: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userTextContainer: {
    flex: 1,
    gap: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  countryFlag: {
    fontSize: 16,
  },
  country: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#FFFFFF",
  },
  caption: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 18,
  },
  moreText: {
    fontSize: 13,
    color: "#CCCCCC",
    fontWeight: "600" as const,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },
  rightActions: {
    gap: 20,
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    gap: 2,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
