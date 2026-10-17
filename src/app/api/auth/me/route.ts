import { NextResponse } from "next/server";
import { getStaffSessionFromCookie } from "@/lib/auth";

export async function GET(req: Request) {
  const session = getStaffSessionFromCookie(req.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  });
}
