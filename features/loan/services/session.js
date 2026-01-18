import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";

// Ensures we wait for Firebase to hydrate the currentUser on page load.
let _authReady = null;
function waitAuthReady() {
  if (_authReady) return _authReady;

  _authReady = new Promise(resolve => {
    const unsub = onAuthStateChanged(
      auth,
      u => {
        unsub();
        resolve(u);
      },
      () => {
        unsub();
        resolve(null);
      },
    );
  });

  return _authReady;
}

export async function ensureSession() {
  await waitAuthReady();

  if (auth.currentUser) return auth.currentUser;

  // Auto-create a guest session (Anonymous Auth)
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export async function getIdToken() {
  try {
    const user = await ensureSession();
    return await user.getIdToken(true);
  } catch (e) {
    console.error("Firebase Auth error:", e?.code, e?.message || e);
    throw new Error(
      `${e?.code || "auth/error"}: ${e?.message || "Auth failed"}`,
    );
  }
}
