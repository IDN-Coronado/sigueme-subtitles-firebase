import { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase/firebase";
import useAuthUser from "../hooks/useAuthUser";
import useOperatorStatus from "../hooks/useOperatorStatus";
import { t } from "../i18n";

const googleProvider = new GoogleAuthProvider();

function GateScreen({ children }) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-4 max-w-xs">
        <h1 className="text-fg font-bold text-2xl tracking-tight">Apostello</h1>
        {children}
      </div>
    </div>
  );
}

/** Blocks the operator console behind Google sign-in + admin approval. */
function AuthGate({ children }) {
  const user = useAuthUser();
  const approved = useOperatorStatus(user);
  const [error, setError] = useState(false);

  if (user === undefined) return null;

  if (user === null) {
    // Google rejects OAuth from embedded user agents, so the desktop build
    // signs in through the system browser (see electron/oauth.js) and hands
    // back an ID token; everything downstream of this is identical.
    const onSignIn = async () => {
      setError(false);
      try {
        if (window.desktop) {
          const idToken = await window.desktop.signIn();
          await signInWithCredential(
            auth,
            GoogleAuthProvider.credential(idToken)
          );
        } else {
          await signInWithPopup(auth, googleProvider);
        }
      } catch {
        setError(true);
      }
    };

    return (
      <GateScreen>
        <p className="text-fg-muted text-sm">{t("auth.signInSubtitle")}</p>
        <button
          type="button"
          className="px-5 py-3 bg-primary text-primary font-bold text-sm rounded-sm hover:bg-primary-hover transition-colors"
          onClick={onSignIn}
        >
          {t("auth.signInButton")}
        </button>
        {error && <p className="text-danger-fg text-xs">{t("auth.signInError")}</p>}
      </GateScreen>
    );
  }

  if (approved === undefined) return null;

  if (!approved) {
    return (
      <GateScreen>
        <p className="text-fg-muted text-sm">
          {t("auth.pendingSubtitle", { email: user.email })}
        </p>
        <button
          type="button"
          className="px-4 py-2 text-fg-muted text-sm border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-primary hover:text-primary-fg transition-colors"
          onClick={() => signOut(auth)}
        >
          {t("auth.signOut")}
        </button>
      </GateScreen>
    );
  }

  return children;
}

export default AuthGate;
