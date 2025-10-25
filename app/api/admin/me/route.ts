export async function GET() {
  try {
    // Admin bilgilerini döndür
    return Response.json({
      admin_id: "cba653e7-6ef9-4152-8a52-19c095cc8f1d",
      username: "admin",
      display_name: "Litxtech LLC",
      is_super_admin: true,
      permissions: {
        all: true,
        users: true,
        content: true,
        payments: true,
        moderation: true
      },
    });
  } catch (error) {
    console.error("[admin/me] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Default export for Expo Router
export default function AdminMeRoute() {
  return null;
}
