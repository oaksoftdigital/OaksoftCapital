"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, EmailAuthProvider, linkWithCredential } from "firebase/auth";
import { getUserEmail, saveUserEmail } from "@/features/loan/services/coinrabbit";
import { useRouter } from "next/navigation";

export default function ClaimDashboardBanner() {
  const router = useRouter();

  const [isAnon, setIsAnon] = useState(false);
  const [claimEmail, setClaimEmail] = useState("");
  const [claimPass, setClaimPass] = useState("");
  const [claimPass2, setClaimPass2] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // Detect anon + prefill email from Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      const anon = !!u?.isAnonymous;
      setIsAnon(anon);

      if (anon) {
        try {
          const saved = await getUserEmail();
          if (saved) setClaimEmail(saved);
        } catch (e) {
          // no block UI
          console.warn("getUserEmail failed:", e?.message || e);
        }
      }
    });

    return () => unsub();
  }, []);

  if (!isAnon) return null;

  async function handleClaim() {
    setErr("");
    setOk("");

    const email = String(claimEmail || "").trim().toLowerCase();
    if (!email) return setErr("Email is required");
    if (!claimPass || claimPass.length < 6) return setErr("Password must be at least 6 characters");
    if (!claimPass2) return setErr("Please confirm your password");
    if (claimPass !== claimPass2) return setErr("Passwords do not match");

    const user = auth.currentUser;
    if (!user || !user.isAnonymous) {
      setErr("You are not in guest mode anymore.");
      return;
    }

    setBusy(true);
    try {
      // Link anon user -> Email/Password (keeps SAME uid)
      const cred = EmailAuthProvider.credential(email, claimPass);
      await linkWithCredential(user, cred);

      // Save email in Firestore (best-effort, but should work)
      try {
        await saveUserEmail(email);
      } catch (e) {
        console.warn("saveUserEmail failed:", e?.message || e);
      }

      setOk("Done. Your dashboard is now saved.");
      setClaimPass("");
      setClaimPass2("");

      // Refresh UI
      router.refresh();
    } catch (e) {
      const code = e?.code;

      if (code === "auth/email-already-in-use" || code === "auth/credential-already-in-use") {
        setErr("This email is already registered. Please sign in instead.");
      } else if (code === "auth/invalid-email") {
        setErr("Invalid email format");
      } else if (code === "auth/weak-password") {
        setErr("Password must be at least 6 characters");
      } else {
        setErr(e?.message || "Claim failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-white font-semibold mb-1">Claim your dashboard</div>
      <div className="text-white/70 text-sm mb-3">
        You’re in guest mode. Set a password to keep access to your loans on any device.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-white/60 mb-1">Email</label>
          <input
            value={claimEmail}
            onChange={(e) => setClaimEmail(e.target.value)}
            type="email"
            placeholder="you@email.com"
            className="w-full px-3 py-2 rounded-xl text-sm bg-[#161B26] text-white placeholder-white/40 border border-[#1F242F] focus:border-[#95E100] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">Password</label>
          <input
            value={claimPass}
            onChange={(e) => setClaimPass(e.target.value)}
            type="password"
            placeholder="••••••••"
            className="w-full px-3 py-2 rounded-xl text-sm bg-[#161B26] text-white placeholder-white/40 border border-[#1F242F] focus:border-[#95E100] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs text-white/60 mb-1">Confirm</label>
          <input
            value={claimPass2}
            onChange={(e) => setClaimPass2(e.target.value)}
            type="password"
            placeholder="••••••••"
            className="w-full px-3 py-2 rounded-xl text-sm bg-[#161B26] text-white placeholder-white/40 border border-[#1F242F] focus:border-[#95E100] focus:outline-none"
          />
        </div>
      </div>

      {err && <div className="mt-3 text-sm text-red-400">{err}</div>}
      {ok && <div className="mt-3 text-sm text-green-400">{ok}</div>}

      <div className="mt-3 flex gap-3">
        <button
          disabled={busy}
          className="px-4 py-2 rounded-xl font-semibold text-[#0B0F16] disabled:opacity-60"
          style={{ background: "#95E100" }}
          onClick={handleClaim}
        >
          {busy ? "Claiming..." : "Claim dashboard"}
        </button>
      </div>
    </div>
  );
}
