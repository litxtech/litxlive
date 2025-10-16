import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, X, MapPin, Eye } from 'lucide-react-native';
import type { FeedProfile } from '@/types/db';

interface ProfileCardProps {
  profile: FeedProfile;
  onLike: () => void;
  onPass: () => void;
  onView: () => void;
}

export default function ProfileCard({ profile, onLike, onPass, onView }: ProfileCardProps) {
  const displayName = profile.display_name || profile.username || 'Anonymous';
  const age = profile.age ? `, ${profile.age}` : '';
  const location = profile.city || profile.country || '';

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.imageContainer} onPress={onView} activeOpacity={0.9}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.image} />
        ) : (
          <LinearGradient
            colors={['#6a11cb', '#2575fc']}
            style={styles.imagePlaceholder}
          >
            <Text style={styles.placeholderText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}

        {profile.is_online && (
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
          </View>
        )}

        {profile.is_live && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}{age}
          </Text>
          {profile.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>

        {location && (
          <View style={styles.locationRow}>
            <MapPin color="#888" size={12} />
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}

        {profile.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {profile.bio}
          </Text>
        )}

        {!profile.is_online && (
          <Text style={styles.lastSeen}>{profile.last_seen_text}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onView}>
          <View style={styles.actionButtonInner}>
            <Eye color="#6a11cb" size={20} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onPass}>
          <View style={[styles.actionButtonInner, styles.passButton]}>
            <X color="#FF4444" size={20} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <LinearGradient
            colors={['#FF6B9D', '#C06C84']}
            style={styles.likeButton}
          >
            <Heart color="white" size={20} fill="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: 'white',
  },
  onlineBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: 'white',
    letterSpacing: 0.5,
  },
  info: {
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#333',
    flex: 1,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6a11cb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  verifiedText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700' as const,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: 13,
    color: '#888',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  lastSeen: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonInner: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  passButton: {
    borderColor: '#FFE5E5',
    backgroundColor: '#FFF5F5',
  },
  likeButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
