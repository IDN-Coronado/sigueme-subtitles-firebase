import { useEffect, useState } from "react";

import useSongRepository from "../../firebase/useSongRepository";
import { byTitle } from "../../local/data";
import { flattenSongLines } from "../../utils/songSections";
import { showError } from "../../utils/notice";
import ErrorNotice from "../ErrorNotice";
import { t } from "../../i18n";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

const actionButton =
  "shrink-0 px-3 py-1.5 text-[#7bd0ff] text-xs border border-[rgba(123,208,255,0.4)] rounded-sm hover:bg-[rgba(123,208,255,0.1)] disabled:opacity-40 transition-colors";

/**
 * Every song either side knows about, in one list. Local songs and repository
 * songs share ids (importing and uploading both preserve them), so the union
 * is deduped by id and each row shows the one action it is missing.
 */
function mergeSongs(remote, local) {
  const byId = new Map();
  for (const song of remote) byId.set(song.id, song);
  for (const song of local) if (!byId.has(song.id)) byId.set(song.id, song);
  return [...byId.values()].sort(byTitle);
}

function SongRepositoryModal({ isOpen, onClose }) {
  const {
    songs,
    remote,
    loading,
    error,
    load,
    importSongs,
    uploadSong,
    isImported,
    isPublished,
  } = useSongRepository();
  const [busy, setBusy] = useState(false);
  // Per-song id while uploading: uploads go one at a time, so only the row
  // being pushed should show a pending state.
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  if (!isOpen) return null;

  const all = mergeSongs(remote, songs);
  const pending = remote.filter((song) => !isImported(song.id));

  const runImport = async (items) => {
    setBusy(true);
    try {
      await importSongs(items);
    } finally {
      setBusy(false);
    }
  };

  const runUpload = async (song) => {
    setUploadingId(song.id);
    try {
      await uploadSong(song);
    } catch (err) {
      console.error("Failed to upload song", err);
      showError(t("repository.uploadError"), err);
    } finally {
      setUploadingId(null);
    }
  };

  const rowAction = (song) => {
    if (!isImported(song.id)) {
      return (
        <button
          type="button"
          disabled={busy}
          onClick={() => runImport([song])}
          className={actionButton}
        >
          {t("repository.import")}
        </button>
      );
    }

    if (!isPublished(song.id)) {
      return (
        <button
          type="button"
          disabled={Boolean(uploadingId)}
          onClick={() => runUpload(song)}
          className={actionButton}
        >
          {uploadingId === song.id
            ? t("repository.uploading")
            : t("repository.upload")}
        </button>
      );
    }

    return (
      <span
        className="shrink-0 text-[#6b7280] text-[10px] uppercase tracking-[0.1em] px-2"
        style={MONO}
      >
        {t("repository.imported")}
      </span>
    );
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

          {/* The repository has to have loaded before any row is meaningful:
              without it every local song looks unpublished and would offer an
              Upload that duplicates what is already there. */}
          {!loading && error && (
            <div className="py-6">
              <ErrorNotice error={error} />
            </div>
          )}

          {!loading && !error && all.length === 0 && (
            <p className="text-[#6b7280] text-sm text-center py-8">
              {t("repository.empty")}
            </p>
          )}

          {!loading &&
            !error &&
            all.map((song) => (
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
                {rowAction(song)}
              </div>
            ))}
        </div>

        <div className="flex justify-between items-center gap-3 px-5 sm:px-6 py-4 border-t border-[rgba(69,70,77,0.3)]">
          {/* Batch import only. Uploading writes to a collection every other
              church reads, so it stays one deliberate song at a time. */}
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
