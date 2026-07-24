import { t } from "../../i18n";

function ConfirmationModal({ isVisible, message, onCancel, onConfirm }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1d2022] border border-[rgba(69,70,77,0.4)] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex flex-col w-full max-w-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-5">
          <p className="text-[#e0e3e5] font-semibold text-lg tracking-tight leading-snug">
            {message}
          </p>
        </div>
        <div className="flex gap-3 justify-end px-5 sm:px-6 py-4 border-t border-[rgba(69,70,77,0.3)]">
          <button
            type="button"
            className="px-4 py-2 text-[#c6c6cd] text-sm border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
            onClick={onCancel}
          >
            {t("confirm.cancel")}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-[rgba(255,180,171,0.15)] border border-[rgba(255,180,171,0.35)] text-[#ffb4ab] text-sm font-bold rounded-sm hover:bg-[rgba(255,180,171,0.25)] transition-colors"
            onClick={onConfirm}
          >
            {t("confirm.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
