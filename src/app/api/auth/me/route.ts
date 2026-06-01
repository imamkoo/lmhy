import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/models/User";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(session.userId).select("name email theme");
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        theme: user.theme,
      },
    });
  } catch {
    return NextResponse.json({ error: "Gagal memuat profil." }, { status: 500 });
  }
}
