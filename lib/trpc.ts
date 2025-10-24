import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import { getAdminToken } from "@/lib/adminSession";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && envUrl.length > 0) return envUrl;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }

  // Fallback to localhost for development
  return "http://localhost:3000";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: async () => {
        try {
          const jwt = await getAdminToken();
          console.log('[tRPC Client] Token from storage:', jwt ? 'EXISTS' : 'MISSING');
          if (jwt && jwt.length > 0) {
            console.log('[tRPC Client] Sending Authorization header');
            return { Authorization: `Bearer ${jwt}` };
          }
        } catch (e) {
          console.error("[tRPC Client] Token read error:", e);
        }
        console.log('[tRPC Client] No token, sending empty headers');
        return {};
      },
    }),
  ],
});
