import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";

import { t } from "../../i18n";
import { toProgramDate } from "../../i18n/formatProgramDate";
import ProgramDeleteModal from "./ProgramDeleteModal";
import { MONO } from "../../fonts";

dayjs.locale("es");


function OpenProgramModal({ isOpen, onClose, programs = [], onSelect, onDelete }) {
  const [pendingDelete, setPendingDelete] = useState(null);

  if (!isOpen) return null;

  const handleConfirmDelete = async () => {
    const program = pendingDelete;
    setPendingDelete(null);
    if (program) await onDelete?.(program);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-hairline rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] flex flex-col w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <p
              className="text-primary text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              {t("openProgram.eyebrow")}
            </p>
            <h2 className="text-fg font-semibold text-lg tracking-tight">
              {t("openProgram.title")}
            </h2>
          </div>
          <button
            type="button"
            className="text-fg-muted hover:text-fg text-2xl leading-none transition-colors"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-2">
          {programs.length === 0 && (
            <p className="text-fg-muted text-sm text-center py-8">
              {t("openProgram.empty")}
            </p>
          )}
          {programs.map((program) => {
            const formattedDate = program.date
              ? dayjs(toProgramDate(program.date)).format("D MMM, YYYY")
              : "";
            return (
              <div
                key={program.id}
                className="group flex items-center gap-2 w-full border border-hairline bg-card rounded-lg pl-4 pr-2 py-3 hover:border-[rgba(99,102,241,0.4)] hover:bg-hover transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onSelect(program)}
                  className="text-left flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-fg truncate">
                      {program.title || t("program.untitled")}
                    </p>
                    {program.active && (
                      <span
                        className="shrink-0 inline-flex items-center gap-1.5 bg-[rgba(99,102,241,0.2)] text-primary-hover text-[10px] font-medium tracking-[0.08em] uppercase px-1.5 py-0.5 rounded-full"
                        style={MONO}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {t("program.active")}
                      </span>
                    )}
                  </div>
                  {formattedDate && (
                    <p className="text-fg-muted text-sm mt-0.5" style={MONO}>
                      {formattedDate}
                    </p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(program)}
                  title={t("programDelete.tooltip")}
                  aria-label={t("programDelete.tooltip")}
                  className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-sm text-fg-muted hover:text-danger-fg hover:bg-[rgba(255,180,171,0.1)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5V13a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end px-5 sm:px-6 py-4 border-t border-[rgba(255,255,255,0.06)]">
          <button
            type="button"
            className="px-4 py-2 text-fg-muted text-sm border border-[rgba(255,255,255,0.1)] rounded-lg hover:border-[rgba(255,255,255,0.2)] hover:text-fg transition-colors"
            onClick={onClose}
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
    <ProgramDeleteModal
      isOpen={Boolean(pendingDelete)}
      onCancel={() => setPendingDelete(null)}
      onConfirm={handleConfirmDelete}
    />
    </>
  );
}

export default OpenProgramModal;
