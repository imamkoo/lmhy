import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { themeSchema } from "@/lib/validations";
import { User } from "@/models/User";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = themeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Tema tidak valid." }, { status: 400 });
    }

    await connectDB();
    await User.findByIdAndUpdate(session.userId, { theme: parsed.data.theme });

    return NextResponse.json({ theme: parsed.data.theme });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan tema." }, { status: 500 });
  }
}
