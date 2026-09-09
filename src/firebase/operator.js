import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import { auth } from "./firebase";

// This machine's operator account. Each install gets its own Firebase user, so
// firestore.rules needs no change — the uid lands in operators/{uid} exactly
// like a Google operator's did, and revoking one machine is one console edit.
//
// Browsers never run this: the PWA's /caption and /live routes only read
// caption/caption, which is public.

export function canStoreCredentials() {
  return typeof window !== "undefined" && Boolean(window.desktop?.credentials);
}

export async function loadCredentials() {
  if (!canStoreCredentials()) return null;
  return window.desktop.credentials.load();
}

/** Verifies the credentials by signing in before storing them. */
export async function saveCredentials({ email, password }) {
  await signInWithEmailAndPassword(auth, email, password);
  await window.desktop.credentials.save({ email, password });
}

export async function clearCredentials() {
  await window.desktop.credentials.save(null);
  await signOut(auth);
}

/** Signs in with whatever is stored. Called once at startup. */
export async function signInStoredOperator() {
  const stored = await loadCredentials();
  if (!stored) return;
  await signInWithEmailAndPassword(auth, stored.email, stored.password);
}
