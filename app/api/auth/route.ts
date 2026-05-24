import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET - Verify if current session is authenticated
export async function GET() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (authToken === "authenticated") {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false });
}

// POST - Authenticate with lockscreen password
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const systemPassword = process.env.ADMIN_TRACKER_PASSWORD;

    if (password === systemPassword) {
      const cookieStore = await cookies();

      // Set an HttpOnly, Secure cookie
      cookieStore.set("auth_token", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week session
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Access Denied. Matrix passcode mismatch." },
      { status: 401 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server authentication error." },
      { status: 500 },
    );
  }
}

// DELETE - Clear auth cookie / logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");

  return NextResponse.json({ success: true });
}
