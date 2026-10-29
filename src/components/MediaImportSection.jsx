import { useState } from "react";

import importMediaFromStorage from "../local/migrateMedia";
import ErrorNotice from "./ErrorNotice";
import { t } from "../i18n";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

/**
 * One-time copy of the Firebase Storage bucket into the local media folder,
 * plus the theme records that point at those files. Safe to re-run — files
 * already on disk are skipped — so an interrupted import just resumes.
 *
 * Lives in Settings behind a signed-in operator: every read it makes needs
 * isOperator(), so offering it to a signed-out console could only fail.
 */
function MediaImportSection() {
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async () => {
    setStatus("running");
    setError(null);
    setResult(null);
    try {
      const outcome = await importMediaFromStorage(setProgress);
      setResult(outcome);
      setStatus("done");
    } catch (err) {
      console.error("Media import failed", err);
      setError(err);
      setStatus("error");
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h3
        className="text-fg-muted text-[10px] tracking-[0.1em] uppercase"
        style={MONO}
      >
        {t("mediaImport.title")}
      </h3>
      <p className="text-fg-muted text-xs">{t("mediaImport.body")}</p>

      <button
        type="button"
        disabled={status === "running"}
        onClick={run}
        className="h-9 px-3 inline-flex items-center justify-center rounded-sm border border-primary/45 text-primary-fg text-xs hover:bg-primary/10 disabled:opacity-40 transition-colors"
      >
        {status === "running" ? t("mediaImport.running") : t("mediaImport.action")}
      </button>

      {status === "running" && (
        <p className="text-fg-muted text-xs" style={MONO}>
          {progress.done} / {progress.total}
        </p>
      )}

      {status === "done" && result && (
        <>
          <p className="text-primary-fg text-xs">
            {t("mediaImport.done", {
              copied: result.copied,
              skipped: result.skipped,
            })}
          </p>
          {result.failed.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-danger-fg text-xs">
                {t("mediaImport.failed", { count: result.failed.length })}
              </p>
              {result.failed.slice(0, 5).map((f) => (
                <p
                  key={f.storagePath}
                  className="text-fg-muted text-[11px] truncate"
                  style={MONO}
                  title={f.storagePath}
                >
                  {f.storagePath}
                </p>
              ))}
            </div>
          )}
        </>
      )}

      {status === "error" && <ErrorNotice error={error} />}
    </section>
  );
}

export default MediaImportSection;
