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
        className="bg-[#1d2022] border border-[rgba(69,70,77,0.4)] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex flex-col w-full max-w-md overflow-hidden"
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
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(69,70,77,0.3)]">
          <div>
            <p
              className="text-[#7bd0ff] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              {t("mediaModal.eyebrow")}
            </p>
            <h2 className="text-[#e0e3e5] font-semibold text-lg tracking-tight">
              {t("mediaModal.title")}
            </h2>
          </div>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#e0e3e5] text-2xl leading-none transition-colors"
            onClick={handleClose}
            disabled={uploading}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-2">
            <label className="text-[#c6c6cd] text-sm font-medium">
              {t("mediaModal.titleLabel")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#0b0f10] text-[#e0e3e5] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2.5 outline-none focus:border-[#7bd0ff] transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#c6c6cd] text-sm font-medium">
              {t("mediaModal.fileLabel")}
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.avif,.mp4,.webm,.mov,.m4v,.ogv,.mp3,.wav,.m4a,.aac,.flac,.oga,.ogg,.opus,.wma,.pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="bg-[#0b0f10] text-[#c6c6cd] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2.5 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-sm file:border-0 file:bg-[rgba(123,208,255,0.15)] file:text-[#7bd0ff] file:text-sm file:font-medium hover:border-[rgba(123,208,255,0.35)] transition-colors"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end px-5 sm:px-6 py-4 border-t border-[rgba(69,70,77,0.3)]">
          <button
            type="button"
            className="px-4 py-2 text-[#c6c6cd] text-sm border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors disabled:opacity-40"
            onClick={handleClose}
            disabled={uploading}
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#7bd0ff] text-[#00354a] text-sm font-bold rounded-sm hover:bg-[#5bc0ef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
