import { useEffect, useState } from "react";

import useSongRepository from "../../firebase/useSongRepository";
import { flattenSongLines } from "../../utils/songSections";
import { t } from "../../i18n";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

function SongRepositoryModal({ isOpen, onClose }) {
  const { remote, loading, error, load, importSongs, isImported } =
    useSongRepository();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  if (!isOpen) return null;

  const pending = remote.filter((song) => !isImported(song.id));

  const runImport = async (items) => {
    setBusy(true);
    try {
      await importSongs(items);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1d2022] border border-[rgba(69,70,77,0.4)] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex flex-col w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-[rgba(69,70,77,0.3)]">
          <div className="pr-4">
            <p
              className="text-[#7bd0ff] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              {t("repository.title")}
            </p>
            <p className="text-[#c6c6cd] text-xs">{t("repository.subtitle")}</p>
          </div>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#e0e3e5] text-2xl leading-none transition-colors"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-2">
          {loading && (
            <p className="text-[#6b7280] text-sm text-center py-8">
              {t("common.loading")}
            </p>
          )}

          {!loading && error && (
            <p className="text-[#ffb4ab] text-sm text-center py-8">
              {t("repository.error")}
            </p>
          )}

          {!loading && !error && remote.length === 0 && (
            <p className="text-[#6b7280] text-sm text-center py-8">
              {t("repository.empty")}
            </p>
          )}

          {!loading &&
            !error &&
            remote.map((song) => {
              const imported = isImported(song.id);
              return (
                <div
                  key={song.id}
                  className="flex items-center gap-2 w-full border border-[rgba(69,70,77,0.35)] bg-[rgba(16,20,21,0.5)] rounded-lg pl-4 pr-2 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[#e0e3e5] text-sm font-medium truncate">
                      {song.title}
                    </p>
                    <p className="text-[#6b7280] text-xs truncate mt-0.5">
                      {flattenSongLines(song).slice(0, 1).join(" ")}
                    </p>
                  </div>
                  {imported ? (
                    <span
                      className="shrink-0 text-[#6b7280] text-[10px] uppercase tracking-[0.1em] px-2"
                      style={MONO}
                    >
                      {t("repository.imported")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => runImport([song])}
                      className="shrink-0 px-3 py-1.5 text-[#7bd0ff] text-xs border border-[rgba(123,208,255,0.4)] rounded-sm hover:bg-[rgba(123,208,255,0.1)] disabled:opacity-40 transition-colors"
                    >
                      {t("repository.import")}
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        <div className="flex justify-between items-center gap-3 px-5 sm:px-6 py-4 border-t border-[rgba(69,70,77,0.3)]">
          <button
            type="button"
            disabled={busy || pending.length === 0}
            onClick={() => runImport(pending)}
            className="px-4 py-2 bg-[#7bd0ff] text-[#00354a] font-bold text-sm rounded-sm hover:bg-[#5bc0ef] disabled:opacity-40 disabled:hover:bg-[#7bd0ff] transition-colors"
          >
            {busy
              ? t("repository.importing")
              : `${t("repository.importAll")} (${pending.length})`}
          </button>
          <button
            type="button"
            className="px-4 py-2 text-[#c6c6cd] text-sm border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
            onClick={onClose}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SongRepositoryModal;
