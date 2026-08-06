import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { auth } from "../firebase/firebase";
import useAuthUser from "../hooks/useAuthUser";
import { t } from "../i18n";

const googleProvider = new GoogleAuthProvider();

/** Blocks the operator console behind Google sign-in. */
function AuthGate({ children }) {
  const user = useAuthUser();
  const [error, setError] = useState(false);

  if (user === undefined) return null;

  if (user === null) {
    const onSignIn = () => {
      setError(false);
      signInWithPopup(auth, googleProvider).catch(() => setError(true));
    };

    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4 max-w-xs">
          <h1 className="text-[#e0e3e5] font-bold text-2xl tracking-tight">Apostello</h1>
          <p className="text-[#c6c6cd] text-sm">{t("auth.signInSubtitle")}</p>
          <button
            type="button"
            className="px-5 py-3 bg-[#7bd0ff] text-[#00354a] font-bold text-sm rounded-sm hover:bg-[#5bc0ef] transition-colors"
            onClick={onSignIn}
          >
            {t("auth.signInButton")}
          </button>
          {error && <p className="text-[#ffb4ab] text-xs">{t("auth.signInError")}</p>}
        </div>
      </div>
    );
  }

  return children;
}

export default AuthGate;
