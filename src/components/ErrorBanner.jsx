import useNotice from "../utils/notice";
import ErrorNotice from "./ErrorNotice";
import { t } from "../i18n";

/**
 * The console's single error surface, rendered once in the app shell.
 *
 * Fixed rather than in flow: these appear mid-service, and a banner that
 * reflowed the console under the operator's cursor would be worse than the
 * failure it reports. Not a modal for the same reason — the console has to
 * stay usable.
 */
function ErrorBanner() {
  const notice = useNotice((s) => s.notice);
  const clearNotice = useNotice((s) => s.clearNotice);
  if (!notice) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-[#1d2022] rounded-sm shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
        <ErrorNotice error={notice.error} title={notice.title} />
        <div className="flex justify-end px-3 pb-3">
          <button
            type="button"
            onClick={clearNotice}
            className="h-7 px-3 inline-flex items-center rounded-sm border border-[rgba(69,70,77,0.4)] text-[#c6c6cd] text-xs hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBanner;
