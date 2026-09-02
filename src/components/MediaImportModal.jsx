import { useState } from "react";

import importMediaFromStorage from "../local/migrateMedia";
import { t } from "../i18n";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

/**
 * One-time copy of the Firebase Storage bucket into the local media folder.
 * Safe to re-run — files already on disk are skipped — so an interrupted
 * import just resumes.
 */
function MediaImportModal({ isOpen, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1d2022] border border-[rgba(69,70,77,0.4)] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.45)] w-full max-w-md overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-[rgba(69,70,77,0.3)]">
          <p
            className="text-[#7bd0ff] text-[10px] tracking-[0.12em] uppercase mb-1"
            style={MONO}
          >
            {t("mediaImport.eyebrow")}
          </p>
          <h2 className="text-[#e0e3e5] font-semibold text-lg tracking-tight">
            {t("mediaImport.title")}
          </h2>
        </div>

        <div className="px-5 sm:px-6 py-5 flex flex-col gap-3">
          <p className="text-[#c6c6cd] text-sm">{t("mediaImport.body")}</p>

          {status === "running" && (
            <p className="text-[#c6c6cd] text-xs" style={MONO}>
              {progress.done} / {progress.total}
            </p>
          )}

          {status === "done" && result && (
            <>
              <p className="text-[#7bd0ff] text-sm">
                {t("mediaImport.done", {
                  copied: result.copied,
                  skipped: result.skipped,
                })}
              </p>
              {result.failed.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-[#ffb4ab] text-xs">
                    {t("mediaImport.failed", { count: result.failed.length })}
                  </p>
                  {result.failed.slice(0, 5).map((f) => (
                    <p
                      key={f.storagePath}
                      className="text-[#6b7280] text-[11px] truncate"
                      style={MONO}
                    >
                      {f.storagePath}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          {status === "error" && (
            <p className="text-[#ffb4ab] text-xs">
              {String(error?.message || error)}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 sm:px-6 py-4 border-t border-[rgba(69,70,77,0.3)]">
          <button
            type="button"
            disabled={status === "running"}
            className="px-4 py-2 text-[#c6c6cd] text-sm border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] disabled:opacity-40 transition-colors"
            onClick={onClose}
          >
            {t("common.close")}
          </button>
          <button
            type="button"
            disabled={status === "running"}
            onClick={run}
            className="px-4 py-2 bg-[#7bd0ff] text-[#00354a] font-bold text-sm rounded-sm hover:bg-[#5bc0ef] disabled:opacity-40 transition-colors"
          >
            {status === "running"
              ? t("mediaImport.running")
              : t("mediaImport.action")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MediaImportModal;
