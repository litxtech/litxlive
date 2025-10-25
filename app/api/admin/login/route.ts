export async function POST(req: Request) {
  try {
    const { username, password } = await req.json().catch(() => ({} as any));

    // Admin girişi kontrolü
    const isAdmin = username === "support@litxtech.com" || username === "admin";
    
    if (!isAdmin) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Başarılı giriş
    return Response.json({ 
      success: true, 
      username: "admin",
      token: "admin-token-" + Date.now(),
      admin_id: "cba653e7-6ef9-4152-8a52-19c095cc8f1d"
    });
  } catch (error) {
    console.error("[admin/login] Error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// Default export for Expo Router
export default function AdminLoginRoute() {
  return null;
}
