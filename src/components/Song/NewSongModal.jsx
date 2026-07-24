import { useEffect, useRef, useState } from "react";
import { t } from "../../i18n";
import { IconChevron, IconGrip } from "../Icons";
import {
  createSection,
  flattenSongLines,
  normalizeSong,
} from "../../utils/songSections";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

const DROP_ZONE =
  "mx-2 my-1 min-h-[2rem] rounded-sm border border-dashed border-[#7bd0ff] bg-[rgba(123,208,255,0.08)]";

const DROP_ZONE_SECTION =
  "mb-3 min-h-[2.5rem] rounded-sm border border-dashed border-[#7bd0ff] bg-[rgba(123,208,255,0.08)]";

function moveLine(sections, fromSectionId, fromIndex, toSectionId, toIndex) {
  if (
    fromSectionId === toSectionId &&
    (toIndex === fromIndex || toIndex === fromIndex + 1)
  ) {
    return sections;
  }

  const next = sections.map((section) => ({
    ...section,
    lines: [...section.lines],
  }));
  const fromSection = next.find((section) => section.id === fromSectionId);
  const toSection = next.find((section) => section.id === toSectionId);
  if (!fromSection || !toSection) return sections;
  if (fromIndex < 0 || fromIndex >= fromSection.lines.length) return sections;

  const [line] = fromSection.lines.splice(fromIndex, 1);
  let insertAt = toIndex;
  if (fromSectionId === toSectionId && fromIndex < toIndex) {
    insertAt -= 1;
  }
  insertAt = Math.max(0, Math.min(insertAt, toSection.lines.length));
  toSection.lines.splice(insertAt, 0, line);
  return next;
}

function moveSection(sections, fromIndex, toIndex) {
  if (toIndex === fromIndex || toIndex === fromIndex + 1) return sections;
  const next = [...sections];
  const [section] = next.splice(fromIndex, 1);
  let insertAt = toIndex;
  if (fromIndex < toIndex) insertAt -= 1;
  insertAt = Math.max(0, Math.min(insertAt, next.length));
  next.splice(insertAt, 0, section);
  return next;
}

function NewSongModal({ isOpen, onClose, onSubmit, song = null }) {
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState(() => [createSection()]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const [draftLines, setDraftLines] = useState({});
  const [saving, setSaving] = useState(false);
  const [dragItem, setDragItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [lineMenu, setLineMenu] = useState(null);
  const lineMenuRef = useRef(null);
  const lineInputRefs = useRef({});
  const isEdit = Boolean(song?.id);

  const expandSection = (sectionId) => {
    setCollapsedIds((prev) => {
      if (!prev.has(sectionId)) return prev;
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  };

  const toggleSection = (sectionId) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    if (song) {
      const normalized = normalizeSong(song);
      setTitle(normalized.title || "");
      setSections(normalized.sections);
      setActiveSectionId(normalized.sections[0]?.id || null);
    } else {
      const initial = createSection(t("song.defaultSection"));
      setTitle("");
      setSections([initial]);
      setActiveSectionId(initial.id);
    }
    setCollapsedIds(new Set());
    setDraftLines({});
    setSaving(false);
    setDragItem(null);
    setDropTarget(null);
    setLineMenu(null);
  }, [isOpen, song]);

  useEffect(() => {
    if (!lineMenu) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLineMenu(null);
    };
    const handleClick = (e) => {
      if (lineMenuRef.current && !lineMenuRef.current.contains(e.target)) {
        setLineMenu(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [lineMenu]);

  const reset = () => {
    const initial = createSection(t("song.defaultSection"));
    setTitle("");
    setSections([initial]);
    setActiveSectionId(initial.id);
    setCollapsedIds(new Set());
    setDraftLines({});
    setSaving(false);
    setDragItem(null);
    setDropTarget(null);
    setLineMenu(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onAddSection = () => {
    const next = createSection(t("song.defaultSection"));
    setSections((prev) => [...prev, next]);
    setActiveSectionId(next.id);
    expandSection(next.id);
  };

  const onRenameSection = (sectionId, name) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, name } : section
      )
    );
  };

  const onRemoveSection = (sectionId) => {
    if (sections.length <= 1) return;
    const next = sections.filter((section) => section.id !== sectionId);
    setSections(next);
    setCollapsedIds((prev) => {
      if (!prev.has(sectionId)) return prev;
      const updated = new Set(prev);
      updated.delete(sectionId);
      return updated;
    });
    if (activeSectionId === sectionId) {
      setActiveSectionId(next[0]?.id || null);
    }
  };

  const onAddLineToSection = (sectionId) => {
    const value = String(draftLines[sectionId] || "").trim();
    if (!value) return;
    expandSection(sectionId);
    setActiveSectionId(sectionId);
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, lines: [...section.lines, value] }
          : section
      )
    );
    setDraftLines((prev) => ({ ...prev, [sectionId]: "" }));
  };

  const onEditLine = (sectionId, lineIndex, value) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lines: section.lines.map((line, i) =>
                i === lineIndex ? value : line
              ),
            }
          : section
      )
    );
  };

  const onRemoveLine = (sectionId, lineIndex) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lines: section.lines.filter((_, i) => i !== lineIndex),
            }
          : section
      )
    );
  };

  const onInsertLineBelow = (sectionId, lineIndex) => {
    const insertAt = lineIndex + 1;
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const lines = [...section.lines];
        lines.splice(insertAt, 0, "");
        return { ...section, lines };
      })
    );
    setTimeout(() => focusLineInput(sectionId, insertAt), 0);
  };

  const onDivideSection = (sectionId, lineIndex) => {
    const sectionIndex = sections.findIndex(
      (section) => section.id === sectionId
    );
    if (sectionIndex < 0) return;
    const section = sections[sectionIndex];
    if (lineIndex < 0 || lineIndex >= section.lines.length - 1) return;

    const keepLines = section.lines.slice(0, lineIndex + 1);
    const newLines = section.lines.slice(lineIndex + 1);
    const newSection = createSection(t("song.defaultSection"), newLines);
    const next = [...sections];
    next[sectionIndex] = { ...section, lines: keepLines };
    next.splice(sectionIndex + 1, 0, newSection);
    setSections(next);
    setActiveSectionId(newSection.id);
    expandSection(newSection.id);
  };

  const openLineMenu = (e, sectionId, lineIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSectionId(sectionId);
    setLineMenu({
      sectionId,
      lineIndex,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const focusLineInput = (sectionId, lineIndex) => {
    const input = lineInputRefs.current[`${sectionId}:${lineIndex}`];
    if (!input) return;
    input.focus();
    input.select();
  };

  const clearDrag = () => {
    setDragItem(null);
    setDropTarget(null);
  };

  const onLineDragStart = (e, sectionId, index) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `line:${sectionId}:${index}`);
    setDragItem({ kind: "line", sectionId, index });
    setActiveSectionId(sectionId);
  };

  const onSectionDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `section:${index}`);
    setDragItem({ kind: "section", index });
  };

  const onLineDragOver = (e, sectionId, index) => {
    if (dragItem?.kind !== "line") return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const insertIndex =
      e.clientY < rect.top + rect.height / 2 ? index : index + 1;
    setDropTarget((prev) => {
      if (
        prev?.kind === "line" &&
        prev.sectionId === sectionId &&
        prev.index === insertIndex
      ) {
        return prev;
      }
      return { kind: "line", sectionId, index: insertIndex };
    });
    setActiveSectionId(sectionId);
    expandSection(sectionId);
  };

  const onSectionBodyDragOver = (e, sectionId) => {
    if (dragItem?.kind !== "line") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const section = sections.find((s) => s.id === sectionId);
    const insertIndex = section?.lines.length ?? 0;
    setDropTarget((prev) => {
      if (
        prev?.kind === "line" &&
        prev.sectionId === sectionId &&
        prev.index === insertIndex
      ) {
        return prev;
      }
      return { kind: "line", sectionId, index: insertIndex };
    });
    setActiveSectionId(sectionId);
    expandSection(sectionId);
  };

  const onSectionCardDragOver = (e, index) => {
    if (dragItem?.kind !== "section") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const insertIndex =
      e.clientY < rect.top + rect.height / 2 ? index : index + 1;
    setDropTarget((prev) => {
      if (prev?.kind === "section" && prev.index === insertIndex) return prev;
      return { kind: "section", index: insertIndex };
    });
  };

  const onListDragOver = (e) => {
    if (dragItem?.kind !== "section") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ kind: "section", index: sections.length });
  };

  const onDragDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragItem || !dropTarget || dragItem.kind !== dropTarget.kind) {
      clearDrag();
      return;
    }

    if (dragItem.kind === "line") {
      setSections((prev) =>
        moveLine(
          prev,
          dragItem.sectionId,
          dragItem.index,
          dropTarget.sectionId,
          dropTarget.index
        )
      );
      setActiveSectionId(dropTarget.sectionId);
      expandSection(dropTarget.sectionId);
    } else {
      setSections((prev) => moveSection(prev, dragItem.index, dropTarget.index));
    }
    clearDrag();
  };

  const cleanedSections = sections.map((section) => ({
    ...section,
    name: section.name.trim() || t("song.defaultSection"),
    lines: section.lines.map((line) => line.trim()).filter(Boolean),
  }));
  const totalLines = flattenSongLines({ sections: cleanedSections }).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || totalLines === 0) return;
    setSaving(true);
    try {
      await onSubmit({
        title: trimmed,
        sections: cleanedSections,
        id: song?.id,
      });
      reset();
      onClose();
    } catch {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const menuSection = lineMenu
    ? sections.find((section) => section.id === lineMenu.sectionId)
    : null;
  const canDivide =
    Boolean(menuSection) &&
    lineMenu.lineIndex < menuSection.lines.length - 1;
  const lineMenuOptions = lineMenu
    ? [
        {
          id: "edit",
          label: t("song.editLine"),
          onClick: () =>
            focusLineInput(lineMenu.sectionId, lineMenu.lineIndex),
        },
        {
          id: "addLine",
          label: t("song.addLineBelow"),
          onClick: () =>
            onInsertLineBelow(lineMenu.sectionId, lineMenu.lineIndex),
        },
        ...(canDivide
          ? [
              {
                id: "divide",
                label: t("song.divideSection"),
                onClick: () =>
                  onDivideSection(lineMenu.sectionId, lineMenu.lineIndex),
              },
            ]
          : []),
        {
          id: "delete",
          label: t("song.deleteLine"),
          danger: true,
          onClick: () =>
            onRemoveLine(lineMenu.sectionId, lineMenu.lineIndex),
        },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        className="bg-[#1d2022] border border-[rgba(69,70,77,0.4)] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex flex-col w-full max-w-3xl max-h-[92vh] overflow-hidden"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(69,70,77,0.3)] shrink-0">
          <div>
            <p
              className="text-[#7bd0ff] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              {t("song.eyebrow")}
            </p>
            <h2 className="text-[#e0e3e5] font-semibold text-lg tracking-tight">
              {isEdit ? t("song.editTitle") : t("song.newTitle")}
            </h2>
          </div>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#e0e3e5] text-2xl leading-none transition-colors"
            onClick={handleClose}
            disabled={saving}
            aria-label={t("song.close")}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 sm:px-6 py-5 overflow-y-auto min-h-0">
          <div className="flex flex-col gap-2">
            <label className="text-[#c6c6cd] text-sm font-medium">
              {t("song.titleLabel")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#0b0f10] text-[#e0e3e5] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2.5 w-full outline-none focus:border-[#7bd0ff] transition-colors"
              required
            />
          </div>

          <label className="text-[#c6c6cd] text-sm font-medium">
            {t("song.lyricsLabel")}
          </label>

          <div
            className="flex flex-col gap-3 min-h-[20rem] max-h-[min(32rem,55vh)] overflow-y-auto"
            onDragOver={onListDragOver}
            onDrop={onDragDrop}
          >
            {sections.map((section, sectionIndex) => {
              const isActive = section.id === activeSectionId;
              const isCollapsed = collapsedIds.has(section.id);
              const isExpanded = !isCollapsed;
              const isLineDropSection =
                dropTarget?.kind === "line" &&
                dropTarget.sectionId === section.id;
              const showSectionDropBefore =
                dropTarget?.kind === "section" &&
                dropTarget.index === sectionIndex &&
                dragItem?.kind === "section";
              const isSectionDragging =
                dragItem?.kind === "section" &&
                dragItem.index === sectionIndex;

              return (
                <div key={section.id}>
                  {showSectionDropBefore && (
                    <div className={DROP_ZONE_SECTION} aria-hidden />
                  )}
                  <div
                    className={`rounded-sm border ${
                      isActive
                        ? "border-[rgba(123,208,255,0.45)] bg-[rgba(123,208,255,0.06)]"
                        : "border-[rgba(69,70,77,0.25)] bg-[rgba(16,20,21,0.4)]"
                    } ${isSectionDragging ? "opacity-40" : ""}`}
                    onDragOver={(e) => onSectionCardDragOver(e, sectionIndex)}
                    onDrop={onDragDrop}
                  >
                    <div
                      className={`flex items-center gap-1.5 px-2 py-2 ${
                        isExpanded
                          ? "border-b border-[rgba(69,70,77,0.2)]"
                          : ""
                      }`}
                    >
                      <span
                        draggable
                        onDragStart={(e) =>
                          onSectionDragStart(e, sectionIndex)
                        }
                        onDragEnd={clearDrag}
                        className="shrink-0 text-[#6b7280] hover:text-[#c6c6cd] cursor-grab active:cursor-grabbing touch-none px-0.5 select-none"
                        aria-label={t("song.dragSection")}
                        title={t("song.dragSection")}
                        role="button"
                        tabIndex={0}
                      >
                        <IconGrip color="currentColor" />
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          toggleSection(section.id);
                          setActiveSectionId(section.id);
                        }}
                        className={`shrink-0 text-[#c6c6cd] hover:text-[#e0e3e5] ${
                          isCollapsed ? "" : "-rotate-90"
                        }`}
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded
                            ? t("song.collapseSection")
                            : t("song.expandSection")
                        }
                        title={
                          isExpanded
                            ? t("song.collapseSection")
                            : t("song.expandSection")
                        }
                      >
                        <IconChevron collapsed={isCollapsed} />
                      </button>
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) =>
                          onRenameSection(section.id, e.target.value)
                        }
                        onFocus={() => setActiveSectionId(section.id)}
                        placeholder={t("song.sectionNamePlaceholder")}
                        className="bg-transparent text-[#7bd0ff] text-xs tracking-[0.06em] uppercase flex-1 min-w-0 outline-none"
                        style={MONO}
                      />
                      {!isExpanded && (
                        <span
                          className="text-[#6b7280] text-[10px] shrink-0"
                          style={MONO}
                        >
                          {section.lines.length}
                        </span>
                      )}
                      {sections.length > 1 && (
                        <button
                          type="button"
                          className="text-[#ffb4ab] text-xs shrink-0 hover:underline"
                          onClick={() => onRemoveSection(section.id)}
                        >
                          {t("song.removeSection")}
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div
                        className="flex flex-col min-h-[2.5rem]"
                        onDragOver={(e) =>
                          onSectionBodyDragOver(e, section.id)
                        }
                        onDrop={onDragDrop}
                      >
                        {section.lines.length === 0 && (
                          <div
                            className={`mx-2 my-2 min-h-[2.5rem] flex items-center justify-center rounded-sm border border-dashed px-3 py-3 ${
                              isLineDropSection && dragItem?.kind === "line"
                                ? "border-[#7bd0ff] bg-[rgba(123,208,255,0.08)] text-[#7bd0ff]"
                                : "border-[rgba(69,70,77,0.45)] text-[#6b7280]"
                            }`}
                          >
                            <p className="text-sm text-center">
                              {dragItem?.kind === "line"
                                ? t("song.dropHere")
                                : t("song.emptySection")}
                            </p>
                          </div>
                        )}
                        {section.lines.map((line, i) => {
                          const showDropBefore =
                            isLineDropSection &&
                            dropTarget?.index === i &&
                            dragItem?.kind === "line";
                          const isDragging =
                            dragItem?.kind === "line" &&
                            dragItem.sectionId === section.id &&
                            dragItem.index === i;
                          return (
                            <div key={`${section.id}-${i}`}>
                              {showDropBefore && (
                                <div className={DROP_ZONE} aria-hidden />
                              )}
                              <div
                                className={`flex items-center justify-between gap-1.5 px-2 py-1.5 border-b border-[rgba(69,70,77,0.15)] last:border-b-0 ${
                                  isDragging ? "opacity-40" : ""
                                }`}
                                onContextMenu={(e) =>
                                  openLineMenu(e, section.id, i)
                                }
                                onDragOver={(e) =>
                                  onLineDragOver(e, section.id, i)
                                }
                                onDrop={onDragDrop}
                              >
                                <span
                                  draggable
                                  onDragStart={(e) =>
                                    onLineDragStart(e, section.id, i)
                                  }
                                  onDragEnd={clearDrag}
                                  className="shrink-0 text-[#6b7280] hover:text-[#c6c6cd] cursor-grab active:cursor-grabbing touch-none px-0.5 select-none"
                                  aria-label={t("song.dragLine")}
                                  title={t("song.dragLine")}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <IconGrip color="currentColor" />
                                </span>
                                <input
                                  ref={(el) => {
                                    const key = `${section.id}:${i}`;
                                    if (el) lineInputRefs.current[key] = el;
                                    else delete lineInputRefs.current[key];
                                  }}
                                  type="text"
                                  value={line}
                                  onChange={(e) =>
                                    onEditLine(section.id, i, e.target.value)
                                  }
                                  onFocus={() =>
                                    setActiveSectionId(section.id)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") e.preventDefault();
                                  }}
                                  className="bg-transparent text-sm text-[#e0e3e5] flex-1 min-w-0 px-1 py-1 outline-none focus:bg-[rgba(11,15,16,0.6)] rounded-sm"
                                  aria-label={t("song.editLine")}
                                />
                                <button
                                  type="button"
                                  className="text-[#ffb4ab] text-xs shrink-0 hover:underline px-1"
                                  onClick={() => onRemoveLine(section.id, i)}
                                >
                                  {t("song.deleteLine")}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {isLineDropSection &&
                          dragItem?.kind === "line" &&
                          dropTarget?.index === section.lines.length &&
                          section.lines.length > 0 && (
                            <div className={DROP_ZONE} aria-hidden />
                          )}
                        <div className="flex gap-2 px-2 py-2 border-t border-[rgba(69,70,77,0.2)]">
                          <input
                            type="text"
                            value={draftLines[section.id] || ""}
                            onChange={(e) =>
                              setDraftLines((prev) => ({
                                ...prev,
                                [section.id]: e.target.value,
                              }))
                            }
                            onFocus={() => setActiveSectionId(section.id)}
                            placeholder={t("song.addLinePlaceholder")}
                            className="bg-[#0b0f10] text-[#e0e3e5] placeholder-[#6b7280] border border-[rgba(69,70,77,0.3)] rounded-sm px-2.5 py-1.5 flex-1 min-w-0 text-sm outline-none focus:border-[#7bd0ff] transition-colors"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                onAddLineToSection(section.id);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="px-2.5 py-1.5 bg-[rgba(123,208,255,0.1)] border border-[rgba(123,208,255,0.3)] text-[#7bd0ff] text-xs font-medium rounded-sm shrink-0 hover:bg-[rgba(123,208,255,0.18)] transition-colors"
                            onClick={() => onAddLineToSection(section.id)}
                          >
                            {t("song.addLine")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {dropTarget?.kind === "section" &&
              dropTarget.index === sections.length &&
              dragItem?.kind === "section" && (
                <div className={DROP_ZONE_SECTION} aria-hidden />
              )}
            <button
              type="button"
              onClick={onAddSection}
              className="w-full text-[#7bd0ff] text-xs hover:underline py-2.5 rounded-sm border border-dashed border-[rgba(123,208,255,0.35)] hover:border-[rgba(123,208,255,0.55)] hover:bg-[rgba(123,208,255,0.06)] transition-colors"
            >
              {t("song.addSection")}
            </button>
          </div>
        </div>

        <div className="flex gap-3 justify-end px-5 sm:px-6 py-4 border-t border-[rgba(69,70,77,0.3)] shrink-0">
          <button
            type="button"
            className="px-4 py-2 text-[#c6c6cd] text-sm border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors disabled:opacity-40"
            onClick={handleClose}
            disabled={saving}
          >
            {t("song.cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#7bd0ff] text-[#00354a] text-sm font-bold rounded-sm hover:bg-[#5bc0ef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!title.trim() || totalLines === 0 || saving}
          >
            {saving
              ? t("song.saving")
              : isEdit
                ? t("song.saveChanges")
                : t("song.save")}
          </button>
        </div>
      </form>

      {lineMenu && (
        <div
          ref={lineMenuRef}
          role="menu"
          className="fixed z-[60] min-w-[10.5rem] py-1 rounded-sm border border-[rgba(69,70,77,0.45)] bg-[#1d2022] shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
          style={{ left: lineMenu.x, top: lineMenu.y }}
        >
          {lineMenuOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="menuitem"
              className={`w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors ${
                opt.danger
                  ? "text-[#ffb4ab] hover:bg-[rgba(147,0,10,0.2)]"
                  : "text-[#e0e3e5] hover:bg-[rgba(123,208,255,0.1)] hover:text-[#7bd0ff]"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setLineMenu(null);
                opt.onClick?.();
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default NewSongModal;
