import { Stack, router, usePathname } from "expo-router";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Switch } from "react-native";
import { Video, Search, MessageCircle, User, Wallet } from "lucide-react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from "@/providers/LanguageProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "@/providers/UserProvider";
import { Colors } from "@/constants/colors";
import AsyncStorage from '@react-native-async-storage/async-storage';


function BottomTabBar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');

  const tabs = [
    { name: 'home', icon: Video, path: '/(tabs)/home', label: 'Ana Sayfa' },
    { name: 'discover', icon: Search, path: '/(tabs)/discover', label: 'Keşfet' },
    { name: 'rooms', icon: 'record-voice-over', path: '/(tabs)/rooms', label: 'Ses Odaları' },
    { name: 'messages', icon: MessageCircle, path: '/(tabs)/messages', label: 'Mesajlar' },
    { name: 'wallet', icon: Wallet, path: '/(tabs)/wallet', label: 'Cüzdan' },
    { name: 'profile', icon: User, path: '/(tabs)/profile', label: 'Profil' },
  ];

  const handleMenuPositionChange = async (value: boolean) => {
    const newPosition = value ? 'top' : 'bottom';
    setMenuPosition(newPosition);
    await AsyncStorage.setItem('menuPosition', newPosition);
  };

  React.useEffect(() => {
    const loadMenuPosition = async () => {
      const savedPosition = await AsyncStorage.getItem('menuPosition');
      if (savedPosition) {
        setMenuPosition(savedPosition as 'bottom' | 'top');
      }
    };
    loadMenuPosition();
  }, []);

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.name);
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => router.push(tab.path as any)}
            testID={`tab-${tab.name}`}
          >
            {typeof tab.icon === 'string' ? (
              <MaterialIcons 
                name={tab.icon as any} 
                color={isActive ? Colors.primary : Colors.textMuted} 
                size={24}
              />
            ) : (
              <tab.icon 
                color={isActive ? Colors.primary : Colors.textMuted} 
                size={24}
                strokeWidth={isActive ? 2.5 : 2}
              />
            )}
            <Text style={[styles.tabLabel, { color: isActive ? Colors.primary : Colors.textMuted }]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TopTabBar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('top');

  const tabs = [
    { name: 'home', icon: Video, path: '/(tabs)/home', label: 'Ana Sayfa' },
    { name: 'discover', icon: Search, path: '/(tabs)/discover', label: 'Keşfet' },
    { name: 'rooms', icon: 'record-voice-over', path: '/(tabs)/rooms', label: 'Ses Odaları' },
    { name: 'messages', icon: MessageCircle, path: '/(tabs)/messages', label: 'Mesajlar' },
    { name: 'wallet', icon: Wallet, path: '/(tabs)/wallet', label: 'Cüzdan' },
    { name: 'profile', icon: User, path: '/(tabs)/profile', label: 'Profil' },
  ];

  const handleMenuPositionChange = async (value: boolean) => {
    const newPosition = value ? 'top' : 'bottom';
    setMenuPosition(newPosition);
    await AsyncStorage.setItem('menuPosition', newPosition);
  };

  React.useEffect(() => {
    const loadMenuPosition = async () => {
      const savedPosition = await AsyncStorage.getItem('menuPosition');
      if (savedPosition) {
        setMenuPosition(savedPosition as 'bottom' | 'top');
      }
    };
    loadMenuPosition();
  }, []);

  return (
    <View style={[styles.topTabBar, { paddingTop: insets.top }]}>
      <View style={styles.topTabContent}>
        {tabs.map((tab) => {
          const isActive = pathname.includes(tab.name);
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.topTabItem}
              onPress={() => router.push(tab.path as any)}
              testID={`tab-${tab.name}`}
            >
              {typeof tab.icon === 'string' ? (
                <MaterialIcons 
                  name={tab.icon as any} 
                  color={isActive ? Colors.primary : Colors.textMuted} 
                  size={20}
                />
              ) : (
                <tab.icon 
                  color={isActive ? Colors.primary : Colors.textMuted} 
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}
              <Text style={[styles.topTabLabel, { color: isActive ? Colors.primary : Colors.textMuted }]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.topActiveIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');

  React.useEffect(() => {
    const loadMenuPosition = async () => {
      const savedPosition = await AsyncStorage.getItem('menuPosition');
      if (savedPosition) {
        setMenuPosition(savedPosition as 'bottom' | 'top');
      }
    };
    loadMenuPosition();
  }, []);

  return (
    <View style={styles.container}>
      {menuPosition === 'top' && <TopTabBar />}
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="home" />
        <Stack.Screen name="discover" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="messages" />
        <Stack.Screen name="rooms" />
        <Stack.Screen name="profile" />
      </Stack>
      {menuPosition === 'bottom' && <BottomTabBar />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundColor,
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: Colors.backgroundColor,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    position: "relative",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    width: 32,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  topTabBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundColor,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  topTabContent: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  topTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: "relative",
  },
  topTabLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  topActiveIndicator: {
    position: "absolute",
    top: 0,
    width: 32,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
});
