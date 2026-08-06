import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

import { auth } from "../firebase/firebase";
import useAuthUser from "../hooks/useAuthUser";
import useOperatorStatus from "../hooks/useOperatorStatus";
import { t } from "../i18n";

const googleProvider = new GoogleAuthProvider();

function GateScreen({ children }) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-4 max-w-xs">
        <h1 className="text-[#e0e3e5] font-bold text-2xl tracking-tight">Apostello</h1>
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
    const onSignIn = () => {
      setError(false);
      signInWithPopup(auth, googleProvider).catch(() => setError(true));
    };

    return (
      <GateScreen>
        <p className="text-[#c6c6cd] text-sm">{t("auth.signInSubtitle")}</p>
        <button
          type="button"
          className="px-5 py-3 bg-[#7bd0ff] text-[#00354a] font-bold text-sm rounded-sm hover:bg-[#5bc0ef] transition-colors"
          onClick={onSignIn}
        >
          {t("auth.signInButton")}
        </button>
        {error && <p className="text-[#ffb4ab] text-xs">{t("auth.signInError")}</p>}
      </GateScreen>
    );
  }

  if (approved === undefined) return null;

  if (!approved) {
    return (
      <GateScreen>
        <p className="text-[#c6c6cd] text-sm">
          {t("auth.pendingSubtitle", { email: user.email })}
        </p>
        <button
          type="button"
          className="px-4 py-2 text-[#c6c6cd] text-sm border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
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
