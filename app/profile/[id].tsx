import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  ArrowLeft,
  Heart,
  X,
  MapPin,
  Calendar,
  MessageCircle,
  Gift,
  Video,
  CheckCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(false);

  const profile = {
    id: id as string,
    displayName: "Emma",
    age: 24,
    city: "London",
    country: "UK",
    bio: "Love travel and coffee ☕️\nLooking for meaningful connections 💫\nFluent in English, Spanish",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=600",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600",
    ],
    verified: true,
    isOnline: true,
    distance: 2,
    interests: ["Travel", "Coffee", "Music", "Art", "Photography"],
  };

  const handleLike = () => {
    setLiked(!liked);
    console.log("Like:", profile.id);
  };

  const handlePass = () => {
    console.log("Pass:", profile.id);
    router.back();
  };

  const handleMessage = () => {
    router.push(`/chat/${profile.id}` as any);
  };

  const handleVideoCall = () => {
    console.log("Video call:", profile.id);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <View style={styles.headerButtonBg}>
                <ArrowLeft color={Colors.text} size={24} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photosContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {profile.photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.photo}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.photoGradient}
          />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.header}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {profile.displayName}, {profile.age}
              </Text>
              {profile.verified && (
                <CheckCircle color={Colors.primary} size={24} fill={Colors.primary} />
              )}
            </View>
            {profile.isOnline && (
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            )}
          </View>

          <View style={styles.locationRow}>
            <MapPin color={Colors.textMuted} size={16} />
            <Text style={styles.location}>
              {profile.city}, {profile.country}
            </Text>
            <Text style={styles.distance}>• {profile.distance} km away</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actionsContainer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePass}>
          <View style={styles.actionButtonCircle}>
            <X color="#FF4444" size={28} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
          <View style={styles.actionButtonCircle}>
            <MessageCircle color={Colors.primary} size={24} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleVideoCall}>
          <View style={styles.actionButtonCircle}>
            <Video color={Colors.secondary} size={24} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
        >
          <View
            style={[
              styles.actionButtonCircle,
              liked && styles.actionButtonCircleActive,
            ]}
          >
            <Heart
              color={liked ? "#FFFFFF" : Colors.success}
              size={28}
              strokeWidth={2.5}
              fill={liked ? "#FFFFFF" : "none"}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    marginLeft: 16,
  },
  headerButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  photosContainer: {
    width: width,
    height: width * 1.2,
    position: "relative",
  },
  photo: {
    width: width,
    height: width * 1.2,
    backgroundColor: Colors.borderLight,
  },
  photoGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  infoContainer: {
    padding: 24,
  },
  header: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  onlineText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.success,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  location: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  distance: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  interestText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  actionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    marginBottom: 8,
  },
  actionButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonCircleActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
});
