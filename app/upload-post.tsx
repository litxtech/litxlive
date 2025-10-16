import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { ArrowLeft, Image as ImageIcon, Video, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

export default function UploadPostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

  const handleSelectMedia = () => {
    Alert.alert("Coming Soon", "Media selection will be available soon!");
  };

  const handlePost = () => {
    if (!caption.trim() && selectedMedia.length === 0) {
      Alert.alert("Error", "Please add a caption or select media");
      return;
    }

    Alert.alert("Success", "Post created successfully!", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Create Post",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft color={Colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handlePost} style={styles.postButton}>
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: Colors.background,
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <TextInput
            style={styles.captionInput}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.textMuted}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
            autoFocus
          />

          <View style={styles.mediaSection}>
            <Text style={styles.sectionTitle}>Add Media</Text>
            <View style={styles.mediaButtons}>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={handleSelectMedia}
              >
                <ImageIcon color={Colors.primary} size={24} />
                <Text style={styles.mediaButtonText}>Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaButton}
                onPress={handleSelectMedia}
              >
                <Video color={Colors.secondary} size={24} />
                <Text style={styles.mediaButtonText}>Video</Text>
              </TouchableOpacity>
            </View>
          </View>

          {selectedMedia.length > 0 && (
            <View style={styles.selectedMedia}>
              {selectedMedia.map((media, index) => (
                <View key={index} style={styles.mediaItem}>
                  <TouchableOpacity
                    style={styles.removeMedia}
                    onPress={() =>
                      setSelectedMedia(selectedMedia.filter((_, i) => i !== index))
                    }
                  >
                    <X color="#FFFFFF" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              • Your post will be visible to all users
            </Text>
            <Text style={styles.infoText}>
              • Please follow community guidelines
            </Text>
            <Text style={styles.infoText}>
              • Maximum 500 characters for caption
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    marginRight: 8,
  },
  postButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
  },
  captionInput: {
    fontSize: 16,
    color: Colors.text,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 24,
  },
  mediaSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  mediaButtons: {
    flexDirection: "row",
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mediaButtonText: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.text,
  },
  selectedMedia: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    position: "relative",
  },
  removeMedia: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoSection: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
