import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json().catch(() => ({} as any));

    // Admin girişi kontrolü
    const isAdmin = username === "support@litxtech.com" || username === "admin";
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Başarılı giriş
    return NextResponse.json({ 
      success: true, 
      username: "admin",
      token: "admin-token-" + Date.now(),
      admin_id: "cba653e7-6ef9-4152-8a52-19c095cc8f1d"
    });
  } catch (error) {
    console.error("[admin/login] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
