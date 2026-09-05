import { useState } from "react";

import { t } from "../i18n";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

function SlideUploadModal({ isOpen, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setFile(null);
    setTitle("");
    setUploading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        className="bg-[#111521] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col w-full max-w-md overflow-hidden"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!file || !title.trim()) return;
          setUploading(true);
          try {
            await onUpload({ file, title: title.trim() });
            reset();
          } catch {
            setUploading(false);
          }
        }}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <p
              className="text-[#6366F1] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              {t("mediaModal.eyebrow")}
            </p>
            <h2 className="text-[#F8FAFC] font-semibold text-lg tracking-tight">
              {t("mediaModal.title")}
            </h2>
          </div>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#F8FAFC] text-2xl leading-none transition-colors"
            onClick={handleClose}
            disabled={uploading}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-2">
            <label className="text-[#9AA3B2] text-sm font-medium">
              {t("mediaModal.titleLabel")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#171C2B] text-[#F8FAFC] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 outline-none focus:border-[#6366F1] transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#9AA3B2] text-sm font-medium">
              {t("mediaModal.fileLabel")}
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.avif,.mp4,.webm,.mov,.m4v,.ogv,.mp3,.wav,.m4a,.aac,.flac,.oga,.ogg,.opus,.wma,.pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="bg-[#171C2B] text-[#9AA3B2] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[rgba(99,102,241,0.2)] file:text-[#7C83FF] file:text-sm file:font-medium hover:border-[rgba(99,102,241,0.4)] transition-colors"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end px-5 sm:px-6 py-4 border-t border-[rgba(255,255,255,0.06)]">
          <button
            type="button"
            className="px-4 py-2 text-[#9AA3B2] text-sm border border-[rgba(255,255,255,0.1)] rounded-lg hover:border-[rgba(255,255,255,0.2)] hover:text-[#F8FAFC] transition-colors disabled:opacity-40"
            onClick={handleClose}
            disabled={uploading}
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#6366F1] text-white text-sm font-semibold rounded-lg hover:bg-[#7C83FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!file || !title.trim() || uploading}
          >
            {uploading ? t("common.uploading") : t("common.add")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SlideUploadModal;
