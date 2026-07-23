import { useEffect, useMemo, useRef, useState } from "react";

import { t } from "../../i18n";
import { MONO } from "./constants";

const BIBLE_VERSIONS = [
  {
    id: "nvi",
    label: "NVI",
    load: () => import("../../bibles/nvi.json"),
  },
  {
    id: "ntv",
    label: "NTV",
    load: () => import("../../bibles/ntv.json"),
  },
  {
    id: "rv60",
    label: "RV60",
    load: () => import("../../bibles/rv60.json"),
  },
];

const bibleCache = {};

function normalizeBooks(bible) {
  if (!bible?.books) return [];
  return Array.isArray(bible.books) ? bible.books : Object.values(bible.books);
}

function getChapters(book) {
  return (book?.chapters || []).filter((ch) => ch.is_chapter !== false);
}

function verseKey(chapterUsfm, num) {
  return `${chapterUsfm || "ch"}-${num}`;
}

function BookAutocomplete({ books, bookIndex, onSelect }) {
  const selected = books[bookIndex];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.name || "");
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const pickedRef = useRef(false);
  const selectedNameRef = useRef(selected?.name || "");

  useEffect(() => {
    selectedNameRef.current = selected?.name || "";
    if (!open) setQuery(selected?.name || "");
  }, [selected?.name, bookIndex, open]);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      setOpen(false);
      if (!pickedRef.current) {
        setQuery(selectedNameRef.current);
      }
      pickedRef.current = false;
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books.map((book, index) => ({ book, index }));
    return books
      .map((book, index) => ({ book, index }))
      .filter(({ book }) =>
        book.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(
            q
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
          )
      );
  }, [books, query]);

  const pick = (index) => {
    pickedRef.current = true;
    onSelect(index);
    setQuery(books[index]?.name || "");
    setOpen(false);
  };

  const restorePrevious = () => {
    setOpen(false);
    if (!pickedRef.current) {
      setQuery(selectedNameRef.current);
    }
    pickedRef.current = false;
  };

  return (
    <div ref={rootRef} className="relative min-w-[10rem] flex-1 max-w-xs">
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={t("bible.searchBook")}
        onFocus={() => {
          pickedRef.current = false;
          setQuery("");
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            restorePrevious();
            inputRef.current?.blur();
          }
          if (e.key === "Enter" && filtered[0]) {
            e.preventDefault();
            pick(filtered[0].index);
          }
        }}
        className="w-full bg-[#0b0f10] text-[#e0e3e5] placeholder-[#6b7280] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2 text-sm outline-none focus:border-[#7bd0ff] transition-colors"
      />
      {open && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-sm border border-[rgba(69,70,77,0.4)] bg-[#1d2022] shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-[#6b7280] text-sm">
              {t("common.noResults")}
            </li>
          )}
          {filtered.map(({ book, index }) => (
            <li key={book.book_usfm || index}>
              <button
                type="button"
                onClick={() => pick(index)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  index === bookIndex
                    ? "bg-[rgba(123,208,255,0.12)] text-[#7bd0ff]"
                    : "text-[#e0e3e5] hover:bg-[rgba(123,208,255,0.08)]"
                }`}
              >
                {book.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BibleBrowser({ onAdd }) {
  const [versionId, setVersionId] = useState("nvi");
  const [bible, setBible] = useState(() => bibleCache[versionId] || null);
  const [loading, setLoading] = useState(!bibleCache[versionId]);
  const [bookIndex, setBookIndex] = useState(0);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [selected, setSelected] = useState({});
  const pendingBookNameRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    if (bibleCache[versionId]) {
      setBible(bibleCache[versionId]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const version = BIBLE_VERSIONS.find((v) => v.id === versionId);
    version
      .load()
      .then((mod) => {
        if (cancelled) return;
        const data = mod.default || mod;
        bibleCache[versionId] = data;
        setBible(data);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [versionId]);

  const books = useMemo(() => normalizeBooks(bible), [bible]);
  const book = books[bookIndex];
  const chapters = useMemo(() => getChapters(book), [book]);
  const chapter = chapters[chapterIdx];
  const verses = useMemo(
    () => (chapter?.items || []).filter((i) => i.type === "verse"),
    [chapter]
  );
  const versionLabel =
    bible?.local_abbreviation ||
    BIBLE_VERSIONS.find((v) => v.id === versionId)?.label ||
    versionId.toUpperCase();

  const selectedCount = Object.keys(selected).length;
  const selectedList = useMemo(
    () =>
      Object.values(selected).sort(
        (a, b) => a.chapter - b.chapter || a.verse - b.verse
      ),
    [selected]
  );

  const changeVersion = (id) => {
    if (id === versionId) return;
    pendingBookNameRef.current = books[bookIndex]?.name || null;
    setVersionId(id);
    setSelected({});
    setChapterIdx(0);
    setBookIndex(0);
  };

  useEffect(() => {
    const pending = pendingBookNameRef.current;
    if (!pending || books.length === 0) return;
    const idx = books.findIndex((b) => b.name === pending);
    setBookIndex(idx >= 0 ? idx : 0);
    setChapterIdx(0);
    pendingBookNameRef.current = null;
  }, [books, versionId]);

  const toggleVerse = (v) => {
    const num = v.verse_numbers?.[0];
    if (num == null || !book) return;
    const key = verseKey(chapter?.chapter_usfm, num);
    setSelected((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      const text = (v.lines || []).join(" ");
      const chapterNum = chapterIdx + 1;
      return {
        ...prev,
        [key]: {
          reference: `${book.name} ${chapterNum}:${num}`,
          text,
          book: book.name,
          chapter: chapterNum,
          verse: num,
          version: versionLabel,
        },
      };
    });
  };

  const handleAddSelected = async () => {
    if (selectedList.length === 0) return;
    await onAdd(selectedList.length === 1 ? selectedList[0] : selectedList);
    setSelected({});
  };

  if (loading || !bible) {
    return (
      <p className="text-[#6b7280] text-sm">
        {t("bible.loading", { version: versionLabel })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="inline-flex rounded-sm border border-[rgba(69,70,77,0.35)] overflow-hidden">
          {BIBLE_VERSIONS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => changeVersion(v.id)}
              className={`px-3 py-1.5 text-xs font-medium tracking-[0.06em] transition-colors ${
                versionId === v.id
                  ? "bg-[#323537] text-[#7bd0ff]"
                  : "bg-[rgba(16,20,21,0.5)] text-[#c6c6cd] hover:text-[#e0e3e5]"
              }`}
              style={MONO}
            >
              {v.label}
            </button>
          ))}
        </div>

        <BookAutocomplete
          books={books}
          bookIndex={bookIndex}
          onSelect={(index) => {
            setBookIndex(index);
            setChapterIdx(0);
            setSelected({});
          }}
        />

        <select
          className="bg-[#0b0f10] text-[#e0e3e5] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2 text-sm outline-none focus:border-[#7bd0ff]"
          value={chapterIdx}
          onChange={(e) => {
            setChapterIdx(Number(e.target.value));
          }}
        >
          {chapters.map((ch, idx) => (
            <option key={ch.chapter_usfm || idx} value={idx}>
              {t("bible.chapter", { n: idx + 1 })}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 overflow-auto min-h-0 flex-1 content-start">
        {verses.map((v) => {
          const num = v.verse_numbers?.[0];
          const text = (v.lines || []).join(" ");
          const key = verseKey(chapter?.chapter_usfm, num);
          const isSelected = !!selected[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleVerse(v)}
              className={`text-left rounded-sm border px-2 py-1.5 transition-colors ${
                isSelected
                  ? "border-[rgba(123,208,255,0.45)] bg-[rgba(123,208,255,0.12)]"
                  : "border-[rgba(69,70,77,0.25)] bg-[rgba(16,20,21,0.4)] hover:border-[rgba(123,208,255,0.3)]"
              }`}
            >
              <div className="flex items-start gap-1.5">
                <span
                  className={`text-[10px] leading-4 shrink-0 tabular-nums ${
                    isSelected ? "text-[#7bd0ff]" : "text-[#7bd0ff]/80"
                  }`}
                  style={MONO}
                >
                  {num}
                  {isSelected ? " ✓" : ""}
                </span>
                <p className="text-[#c6c6cd] text-xs leading-4 line-clamp-2 min-w-0">
                  {text}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="shrink-0 flex items-center justify-between gap-3 border-t border-[rgba(69,70,77,0.25)] pt-3">
        <p className="text-[#6b7280] text-xs" style={MONO}>
          {selectedCount === 0
            ? t("bible.selectHint")
            : t("bible.selectedCount", { count: selectedCount })}
        </p>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => setSelected({})}
              className="px-3 py-2 text-sm text-[#c6c6cd] border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
            >
              {t("common.clear")}
            </button>
          )}
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={handleAddSelected}
            className="px-4 py-2 bg-[#7bd0ff] text-[#00354a] text-sm font-bold rounded-sm hover:bg-[#5bc0ef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("bible.addToSchedule")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BibleBrowser;
