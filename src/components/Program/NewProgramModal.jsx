import dayjs from "dayjs";
import { useState } from "react";

import { t } from "../../i18n";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

function NewProgramModal({ onCancel, onSubmit, isOpen }) {
  const today = dayjs().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(today);
  const [title, setTitle] = useState(t("program.defaultTitle"));

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleClearTitle = () => {
    setTitle("");
  };

  const onClickCancel = () => {
    setSelectedDate(today);
    setTitle(t("program.defaultTitle"));
    onCancel();
  };

  const onModalSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (selectedDate && trimmedTitle) {
      onSubmit({
        date: dayjs(selectedDate),
        title: trimmedTitle,
      });
      setSelectedDate(today);
      setTitle(t("program.defaultTitle"));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        className="bg-[#111521] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col w-full max-w-md overflow-hidden"
        onSubmit={onModalSubmit}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <p
              className="text-[#6366F1] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              {t("programModal.eyebrow")}
            </p>
            <h2 className="text-[#F8FAFC] font-semibold text-lg tracking-tight">
              {t("programModal.title")}
            </h2>
          </div>
          <button
            type="button"
            className="text-[#9AA3B2] hover:text-[#F8FAFC] text-2xl leading-none transition-colors"
            onClick={onClickCancel}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-2">
            <label className="text-[#9AA3B2] text-sm font-medium">
              {t("programModal.titleLabel")}
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="bg-[#171C2B] text-[#F8FAFC] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 w-full pr-8 outline-none focus:border-[#6366F1] transition-colors"
                required
              />
              {title && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9AA3B2] hover:text-[#EF4444] text-lg leading-none"
                  onClick={handleClearTitle}
                  tabIndex={-1}
                  aria-label={t("programModal.clearTitle")}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#9AA3B2] text-sm font-medium">
              {t("programModal.dateLabel")}
            </label>
            <input
              type="date"
              value={selectedDate || ""}
              onChange={handleDateChange}
              className="bg-[#171C2B] text-[#F8FAFC] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 outline-none focus:border-[#6366F1] transition-colors [color-scheme:dark]"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end px-5 sm:px-6 py-4 border-t border-[rgba(255,255,255,0.06)]">
          <button
            type="button"
            className="px-4 py-2 text-[#9AA3B2] text-sm border border-[rgba(255,255,255,0.1)] rounded-lg hover:border-[rgba(255,255,255,0.2)] hover:text-[#F8FAFC] transition-colors"
            onClick={onClickCancel}
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#6366F1] text-white text-sm font-semibold rounded-lg hover:bg-[#7C83FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!title.trim() || !selectedDate}
          >
            {t("common.create")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewProgramModal;
