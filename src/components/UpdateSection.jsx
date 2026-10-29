import { useEffect, useState } from "react";

import ErrorNotice from "./ErrorNotice";
import { MONO } from "../fonts";
import { t } from "../i18n";

/**
 * Manual update check. The app already checks once at startup, but that is
 * invisible and only happens at launch — a console left open between services
 * never looks again, and an operator who has just been told a fix is out has
 * no way to pull it.
 *
 * Staging never swaps the bundle under a running window, so applying one is a
 * restart the operator triggers themselves. That is the whole reason this is
 * in Settings rather than the console header: it must not be a stray click
 * mid-service.
 */
function UpdateSection() {
  const [versions, setVersions] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | checking | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.desktop?.update
      ?.version()
      .then(setVersions)
      .catch(() => {});
  }, []);

  const check = async () => {
    setStatus("checking");
    setError(null);
    setResult(null);
    try {
      setResult(await window.desktop.update.check());
      setStatus("done");
    } catch (err) {
      console.error("Update check failed", err);
      setError(err);
      setStatus("error");
    }
  };

  // The bundle on screen is the shipped one until an over-the-air bundle has
  // been staged and applied, and that one carries the shell's version.
  const running = versions && (versions.bundle || versions.shell);

  return (
    <section className="flex flex-col gap-3">
      <h3
        className="text-fg-muted text-[10px] tracking-[0.1em] uppercase"
        style={MONO}
      >
        {t("update.title")}
      </h3>
      <p className="text-fg-muted text-xs">{t("update.body")}</p>

      {running && (
        <p className="text-fg-muted text-xs" style={MONO} title={t("update.versionHint")}>
          {t("update.running", { version: running })}
        </p>
      )}

      <button
        type="button"
        disabled={status === "checking"}
        onClick={check}
        className="h-8 px-3 self-start inline-flex items-center rounded-sm border border-[rgba(69,70,77,0.4)] text-fg-muted text-xs hover:border-primary hover:text-primary-fg transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        {status === "checking" ? t("update.checking") : t("update.check")}
      </button>

      {status === "done" && result && (
        <>
          <p className="text-fg-muted text-xs">
            {t(`update.status.${result.status}`, {
              version: result.version || "",
              minShell: result.minShell || "",
            })}
          </p>
          {result.status === "staged" && (
            <button
              type="button"
              onClick={() => window.desktop.update.restart()}
              className="h-8 px-3 self-start inline-flex items-center rounded-sm border border-primary/45 bg-primary/15 text-primary-fg text-xs hover:bg-primary/25 transition-colors"
            >
              {t("update.restart")}
            </button>
          )}
        </>
      )}

      {status === "error" && <ErrorNotice title={t("update.failed")} error={error} />}
    </section>
  );
}

export default UpdateSection;
