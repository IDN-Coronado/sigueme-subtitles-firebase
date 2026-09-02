import { t } from "../i18n";

/**
 * The operator console reads and writes a local file through the Electron
 * preload bridge, so it cannot run in a browser tab. /caption and /live are
 * routed outside this gate and still work on the web.
 */
function DesktopGate({ children }) {
  if (typeof window !== "undefined" && window.desktop) return children;

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center px-4 max-w-sm">
        <h1 className="text-[#e0e3e5] font-bold text-2xl tracking-tight">
          Apostello
        </h1>
        <p className="text-[#c6c6cd] text-sm">{t("desktop.required")}</p>
      </div>
    </div>
  );
}

export default DesktopGate;
