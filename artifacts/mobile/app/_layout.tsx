import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl } from "@workspace/api-client-react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { Colors } from "@/constants/colors";
import { getDeviceToken } from "@/utils/security";

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const EXPECTED_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";
const CREATOR_SESSION_KEY = "liftlog:creatorSession";
const CREATOR_IS_CREATOR_KEY = "liftlog:isCreator";
const CREATOR_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function isUnexpectedDomain(): boolean {
  if (Platform.OS !== "web") return false;
  try {
    const hostname = window.location.hostname;
    if (!EXPECTED_DOMAIN) return false;
    if (hostname === "localhost" || hostname.endsWith(".replit.dev")) return false;
    const expectedHostname = EXPECTED_DOMAIN.split("/")[0].split(":")[0];
    return hostname !== expectedHostname && !hostname.endsWith(`.${expectedHostname}`);
  } catch {
    return false;
  }
}

async function enforceCreatorSessionExpiry(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CREATOR_SESSION_KEY);
    if (!raw) {
      await AsyncStorage.removeItem(CREATOR_IS_CREATOR_KEY);
      return;
    }
    const session = JSON.parse(raw) as { createdAt?: number };
    if (!session.createdAt) {
      await AsyncStorage.multiRemove([CREATOR_SESSION_KEY, CREATOR_IS_CREATOR_KEY]);
      return;
    }
    const age = Date.now() - session.createdAt;
    if (age > CREATOR_SESSION_TTL_MS) {
      await AsyncStorage.multiRemove([CREATOR_SESSION_KEY, CREATOR_IS_CREATOR_KEY]);
    }
  } catch {
  }
}

function PlatformRefusalScreen() {
  return (
    <View style={styles.refusalContainer}>
      <Text style={styles.refusalEmoji}>🐾</Text>
      <Text style={styles.refusalTitle}>This isn't right.</Text>
      <Text style={styles.refusalBody}>
        Something feels off. I'm not doing anything until this is sorted.
      </Text>
      <Text style={styles.refusalSig}>— Benny</Text>
    </View>
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="checkin" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="workout" options={{ headerShown: false }} />
      <Stack.Screen name="nutrition" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="cardio" options={{ headerShown: false }} />
      <Stack.Screen name="bodyweight" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="achievements" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="workout-builder" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="sleep" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="admin" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="benny-workout" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [securityReady, setSecurityReady] = useState(false);
  const [platformBlocked, setPlatformBlocked] = useState(false);

  useEffect(() => {
    async function initSecurity() {
      await getDeviceToken();
      await enforceCreatorSessionExpiry();
      if (isUnexpectedDomain()) {
        setPlatformBlocked(true);
      }
      setSecurityReady(true);
    }
    initSecurity();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && securityReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, securityReady]);

  if (!fontsLoaded && !fontError) return null;
  if (!securityReady) return null;

  if (platformBlocked) {
    return (
      <SafeAreaProvider>
        <PlatformRefusalScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  refusalContainer: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  refusalEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  refusalTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  refusalBody: {
    color: "#AAAAAA",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  refusalSig: {
    color: "#666666",
    fontSize: 14,
    fontStyle: "italic",
  },
});
