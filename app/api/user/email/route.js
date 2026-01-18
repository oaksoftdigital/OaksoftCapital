export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils/auth";
import { adminDB } from "@/lib/firebaseAdmin";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req) {
  try {
    // 1) auth (works for normal users AND anonymous users)
    const uid = await requireUser(req);

    // 2) body
    const body = await req.json();
    const emailRaw = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!emailRaw) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    if (!isValidEmail(emailRaw)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // 3) save (merge with existing xUserToken doc)
    await adminDB.collection("coinrabbit_users").doc(uid).set(
      {
        email: emailRaw,
        emailUpdatedAt: Date.now(),
      },
      { merge: true },
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("Save email error:", e);
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e?.message || "Save email failed" },
      { status: 500 },
    );
  }
}
