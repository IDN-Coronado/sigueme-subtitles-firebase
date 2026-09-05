import { t } from "../../i18n";

function ProgramDeleteModal({ isOpen, onCancel, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111521] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col w-full max-w-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-5">
          <p
            className="text-[#EF4444] text-[10px] tracking-[0.12em] uppercase mb-2"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {t("programDelete.eyebrow")}
          </p>
          <p className="text-[#F8FAFC] font-semibold text-lg tracking-tight leading-snug">
            {t("programDelete.message")}
          </p>
        </div>
        <div className="flex gap-3 justify-end px-5 sm:px-6 py-4 border-t border-[rgba(255,255,255,0.06)]">
          <button
            type="button"
            className="px-4 py-2 text-[#9AA3B2] text-sm border border-[rgba(255,255,255,0.1)] rounded-lg hover:border-[rgba(255,255,255,0.2)] hover:text-[#F8FAFC] transition-colors"
            onClick={onCancel}
          >
            {t("confirm.cancel")}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.4)] text-[#EF4444] text-sm font-semibold rounded-lg hover:bg-[rgba(239,68,68,0.25)] transition-colors"
            onClick={onConfirm}
          >
            {t("confirm.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProgramDeleteModal;
