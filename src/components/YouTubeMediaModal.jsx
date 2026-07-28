import { useEffect, useState } from "react";

import { t } from "../i18n";
import { parseYouTubeId, youtubeWatchUrl } from "../utils/youtube";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

function YouTubeMediaModal({ isOpen, onClose, onSubmit, item = null }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const isEdit = Boolean(item?.id);

  useEffect(() => {
    if (!isOpen) return;
    if (item) {
      setUrl(
        item.url ||
          (item.youtubeId
            ? youtubeWatchUrl(item.youtubeId, item.startSeconds || 0)
            : "")
      );
      setTitle(item.name || item.title || "");
    } else {
      setUrl("");
      setTitle("");
    }
    setSaving(false);
    setInvalid(false);
  }, [isOpen, item]);

  const reset = () => {
    setUrl("");
    setTitle("");
    setSaving(false);
    setInvalid(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const videoId = parseYouTubeId(url);
  const canSubmit = Boolean(videoId) && !saving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        className="bg-[#1d2022] border border-[rgba(69,70,77,0.4)] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex flex-col w-full max-w-md overflow-hidden"
        onSubmit={async (e) => {
          e.preventDefault();
          const id = parseYouTubeId(url);
          if (!id) {
            setInvalid(true);
            return;
          }
          setSaving(true);
          setInvalid(false);
          try {
            await onSubmit({
              id: item?.id,
              url: url.trim(),
              title: title.trim(),
              youtubeId: id,
            });
            reset();
          } catch {
            setSaving(false);
          }
        }}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(69,70,77,0.3)]">
          <div>
            <p
              className="text-[#7bd0ff] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              {t("youtubeModal.eyebrow")}
            </p>
            <h2 className="text-[#e0e3e5] font-semibold text-lg tracking-tight">
              {isEdit ? t("youtubeModal.editTitle") : t("youtubeModal.title")}
            </h2>
          </div>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#e0e3e5] text-2xl leading-none transition-colors"
            onClick={handleClose}
            disabled={saving}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-2">
            <label className="text-[#c6c6cd] text-sm font-medium">
              {t("youtubeModal.urlLabel")}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setInvalid(false);
              }}
              placeholder={t("youtubeModal.urlPlaceholder")}
              className="bg-[#0b0f10] text-[#e0e3e5] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2.5 outline-none focus:border-[#7bd0ff] transition-colors"
              required
              autoFocus
            />
            {invalid && (
              <p className="text-[#ffb4ab] text-xs">{t("youtubeModal.invalidUrl")}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#c6c6cd] text-sm font-medium">
              {t("youtubeModal.titleLabel")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("youtubeModal.titlePlaceholder")}
              className="bg-[#0b0f10] text-[#e0e3e5] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2.5 outline-none focus:border-[#7bd0ff] transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end px-5 sm:px-6 py-4 border-t border-[rgba(69,70,77,0.3)]">
          <button
            type="button"
            className="px-4 py-2 text-[#c6c6cd] text-sm border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors disabled:opacity-40"
            onClick={handleClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#7bd0ff] text-[#00354a] text-sm font-bold rounded-sm hover:bg-[#5bc0ef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!canSubmit}
          >
            {saving
              ? t("common.saving")
              : isEdit
                ? t("common.save")
                : t("common.add")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default YouTubeMediaModal;
