import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Admin bilgilerini döndür
    return NextResponse.json({
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
