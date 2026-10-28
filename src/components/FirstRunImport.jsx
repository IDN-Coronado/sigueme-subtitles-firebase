import { useState } from "react";

import useDataStore from "../local/data";
import importFromFirebase from "../local/migrate";
import { t } from "../i18n";
import { MONO } from "../fonts";

/**
 * Shown once, when the machine has no local library yet. Doubles as the data
 * migration off Firestore — documents keep their ids, so program → song and
 * program → theme references survive the move.
 */
function FirstRunImport() {
  const write = useDataStore((s) => s.write);
  const [status, setStatus] = useState("idle"); // idle | running | error
  const [error, setError] = useState(null);

  const run = async () => {
    setStatus("running");
    setError(null);
    try {
      await importFromFirebase();
      await write({ migrated: true });
    } catch (err) {
      console.error("Import from Firebase failed", err);
      setError(err);
      setStatus("error");
    }
  };

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center px-4 max-w-sm">
        <h1 className="text-fg font-bold text-2xl tracking-tight">
          {t("migrate.title")}
        </h1>
        <p className="text-fg-muted text-sm">{t("migrate.body")}</p>

        <button
          type="button"
          disabled={status === "running"}
          onClick={run}
          className="px-5 py-3 bg-primary text-primary font-bold text-sm rounded-sm hover:bg-primary-hover disabled:opacity-40 transition-colors"
        >
          {status === "running" ? t("migrate.running") : t("migrate.action")}
        </button>

        {status === "error" && (
          <>
            <p className="text-danger-fg text-xs">{t("migrate.error")}</p>
            <p
              className="text-fg-muted text-[11px]"
              style={MONO}
            >
              {String(error?.message || error)}
            </p>
          </>
        )}

        <button
          type="button"
          disabled={status === "running"}
          onClick={() => write({ migrated: true })}
          className="text-fg-muted text-xs hover:text-fg-muted transition-colors disabled:opacity-40"
        >
          {t("migrate.skip")}
        </button>
      </div>
    </div>
  );
}

export default FirstRunImport;
