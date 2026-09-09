import { useEffect } from "react";

import useDataStore from "../local/data";
import { t } from "../i18n";

/**
 * Loads data.json once before the console renders. A read failure is shown
 * rather than swallowed: a corrupt file that fell back to an empty store would
 * look like a fresh install and invite an import over the only copy.
 */
function LocalDataGate({ children }) {
  const loaded = useDataStore((s) => s.loaded);
  const error = useDataStore((s) => s.error);
  const hydrate = useDataStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (error) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center px-4 max-w-md">
          <p className="text-[#ffb4ab] text-sm font-bold">
            {t("localData.error")}
          </p>
          <p className="text-[#c6c6cd] text-xs" style={{ fontFamily: "monospace" }}>
            {String(error.message || error)}
          </p>
          <p className="text-[#c6c6cd] text-xs">{t("localData.errorHint")}</p>
        </div>
      </div>
    );
  }

  if (!loaded) return null;

  // No first-run import screen: it reads from Firestore, and on a fresh machine
  // nobody is signed in yet, so it could only ever fail. An empty library opens
  // straight to the console; the import lives in the main menu, to be run once
  // the operator account is signed in.
  return children;
}

export default LocalDataGate;
