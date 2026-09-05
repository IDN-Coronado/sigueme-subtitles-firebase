import { useState, useRef } from "react";
import dayjs from "dayjs";
import DOMPurify from "dompurify";

import { t } from "../../i18n";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

function NewThemeModal({ isVisible, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState("");

  const fileInputRef = useRef();

  const handleModalClose = () => {
    setTitle("");
    setFile(null);
    setPreviewUrl("");
    setFileType("");
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!["image/", "video/"].some((type) => f.type.startsWith(type))) {
      alert(t("themeModal.invalidType"));
      return;
    }
    setFileType(f.type);
    const url = URL.createObjectURL(f);

    if (
      (f.type.startsWith("image/") || f.type.startsWith("video/")) &&
      url.startsWith("blob:")
    ) {
      const safeUrl = DOMPurify.sanitize(url, { SAFE_FOR_TEMPLATES: true });
      setPreviewUrl(safeUrl);
      setFile(f);
    } else {
      alert(t("themeModal.invalidPreview"));
      setPreviewUrl("");
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    await onSubmit({
      title: title.trim(),
      storagePath: `themes/${dayjs().valueOf()}_${title}.${ext}`,
      file,
    });
    setUploading(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        className="bg-[#111521] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col w-full max-w-md overflow-hidden"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <p
              className="text-[#6366F1] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              {t("themeModal.eyebrow")}
            </p>
            <h2 className="text-[#F8FAFC] font-semibold text-lg tracking-tight">
              {t("themeModal.title")}
            </h2>
          </div>
          <button
            type="button"
            className="text-[#9AA3B2] hover:text-[#F8FAFC] text-2xl leading-none transition-colors"
            onClick={handleModalClose}
            disabled={uploading}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-2">
            <label className="text-[#9AA3B2] text-sm font-medium">
              {t("themeModal.nameLabel")}
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
              {t("themeModal.fileLabel")}
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="bg-[#171C2B] text-[#9AA3B2] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[rgba(99,102,241,0.2)] file:text-[#7C83FF] file:text-sm file:font-medium hover:border-[rgba(99,102,241,0.4)] transition-colors"
              required
            />
          </div>

          {previewUrl && (
            <div className="w-full flex justify-center items-center rounded-lg overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#171C2B]">
              {file &&
              fileType.startsWith("image/") &&
              previewUrl.startsWith("blob:") ? (
                <img
                  src={previewUrl}
                  alt={t("themeModal.previewAlt")}
                  className="max-h-40 w-full object-contain"
                />
              ) : file &&
                fileType.startsWith("video/") &&
                previewUrl.startsWith("blob:") ? (
                <video
                  src={previewUrl}
                  className="max-h-40 w-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                />
              ) : null}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end px-5 sm:px-6 py-4 border-t border-[rgba(255,255,255,0.06)]">
          <button
            type="button"
            className="px-4 py-2 text-[#9AA3B2] text-sm border border-[rgba(255,255,255,0.1)] rounded-lg hover:border-[rgba(255,255,255,0.2)] hover:text-[#F8FAFC] transition-colors disabled:opacity-40"
            onClick={handleModalClose}
            disabled={uploading}
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#6366F1] text-white text-sm font-semibold rounded-lg hover:bg-[#7C83FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!title.trim() || !file || uploading}
          >
            {uploading ? t("common.uploading") : t("common.create")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewThemeModal;
