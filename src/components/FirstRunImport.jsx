import { useState } from "react";

import useDataStore from "../local/data";
import importFromFirebase from "../local/migrate";
import { t } from "../i18n";

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
        <h1 className="text-[#e0e3e5] font-bold text-2xl tracking-tight">
          {t("migrate.title")}
        </h1>
        <p className="text-[#c6c6cd] text-sm">{t("migrate.body")}</p>

        <button
          type="button"
          disabled={status === "running"}
          onClick={run}
          className="px-5 py-3 bg-[#7bd0ff] text-[#00354a] font-bold text-sm rounded-sm hover:bg-[#5bc0ef] disabled:opacity-40 transition-colors"
        >
          {status === "running" ? t("migrate.running") : t("migrate.action")}
        </button>

        {status === "error" && (
          <>
            <p className="text-[#ffb4ab] text-xs">{t("migrate.error")}</p>
            <p
              className="text-[#6b7280] text-[11px]"
              style={{ fontFamily: "monospace" }}
            >
              {String(error?.message || error)}
            </p>
          </>
        )}

        <button
          type="button"
          disabled={status === "running"}
          onClick={() => write({ migrated: true })}
          className="text-[#6b7280] text-xs hover:text-[#c6c6cd] transition-colors disabled:opacity-40"
        >
          {t("migrate.skip")}
        </button>
      </div>
    </div>
  );
}

export default FirstRunImport;
