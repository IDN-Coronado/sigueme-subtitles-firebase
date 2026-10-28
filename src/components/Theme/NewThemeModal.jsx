import { useState, useRef } from "react";
import DOMPurify from "dompurify";

import { t } from "../../i18n";
import { MONO } from "../../fonts";


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
    await onSubmit({
      title: title.trim(),
      file,
    });
    setUploading(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        className="bg-surface border border-hairline rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col w-full max-w-md overflow-hidden"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <p
              className="text-primary text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              {t("themeModal.eyebrow")}
            </p>
            <h2 className="text-fg font-semibold text-lg tracking-tight">
              {t("themeModal.title")}
            </h2>
          </div>
          <button
            type="button"
            className="text-fg-muted hover:text-fg text-2xl leading-none transition-colors"
            onClick={handleModalClose}
            disabled={uploading}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-2">
            <label className="text-fg-muted text-sm font-medium">
              {t("themeModal.nameLabel")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-card text-fg border border-hairline rounded-lg px-3 py-2.5 outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-fg-muted text-sm font-medium">
              {t("themeModal.fileLabel")}
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="bg-card text-fg-muted border border-hairline rounded-lg px-3 py-2.5 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary/20 file:text-primary-hover file:text-sm file:font-medium hover:border-primary/40 transition-colors"
              required
            />
          </div>

          {previewUrl && (
            <div className="w-full flex justify-center items-center rounded-lg overflow-hidden border border-hairline bg-card">
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
            className="px-4 py-2 text-fg-muted text-sm border border-[rgba(255,255,255,0.1)] rounded-lg hover:border-[rgba(255,255,255,0.2)] hover:text-fg transition-colors disabled:opacity-40"
            onClick={handleModalClose}
            disabled={uploading}
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
