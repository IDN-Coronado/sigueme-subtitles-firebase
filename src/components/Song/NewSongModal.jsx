import { useState, useRef } from "react";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

function NewSongModal({ isOpen, onClose, onSubmit }) {
  const lineRef = useRef();
  const [title, setTitle] = useState("");
  const [lines, setLines] = useState([]);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle("");
    setLines([]);
    setSaving(false);
    if (lineRef.current) lineRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onAddLine = (e) => {
    e.preventDefault();
    const value = lineRef.current?.value?.trim();
    if (!value) return;
    setLines((prev) => [...prev, value]);
    lineRef.current.value = "";
    lineRef.current.focus();
  };

  const onRemoveLine = (index) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || lines.length === 0) return;
    setSaving(true);
    try {
      await onSubmit({ title: trimmed, body: lines });
      reset();
      onClose();
    } catch {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        className="bg-[#1d2022] border border-[rgba(69,70,77,0.4)] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(69,70,77,0.3)] shrink-0">
          <div>
            <p
              className="text-[#7bd0ff] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              Library
            </p>
            <h2 className="text-[#e0e3e5] font-semibold text-lg tracking-tight">
              Nueva canción
            </h2>
          </div>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#e0e3e5] text-2xl leading-none transition-colors"
            onClick={handleClose}
            disabled={saving}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 sm:px-6 py-5 overflow-y-auto min-h-0">
          <div className="flex flex-col gap-2">
            <label className="text-[#c6c6cd] text-sm font-medium">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#0b0f10] text-[#e0e3e5] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2.5 w-full outline-none focus:border-[#7bd0ff] transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#c6c6cd] text-sm font-medium">Letra</label>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border border-[rgba(69,70,77,0.25)] rounded-sm bg-[rgba(16,20,21,0.4)]">
              {lines.length === 0 && (
                <p className="text-[#6b7280] text-sm px-3 py-4 text-center">
                  Agrega líneas de la letra
                </p>
              )}
              {lines.map((line, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 px-3 py-2 border-b border-[rgba(69,70,77,0.2)] last:border-b-0"
                >
                  <p className="text-sm text-[#e0e3e5] flex-1 min-w-0 break-words">
                    {line}
                  </p>
                  <button
                    type="button"
                    className="text-[#ffb4ab] text-xs shrink-0 hover:underline"
                    onClick={() => onRemoveLine(i)}
                  >
                    Borrar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              ref={lineRef}
              placeholder="Agregar línea..."
              className="bg-[#0b0f10] text-[#e0e3e5] placeholder-[#6b7280] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2.5 flex-1 min-w-0 outline-none focus:border-[#7bd0ff] transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddLine(e);
                }
              }}
            />
            <button
              type="button"
              className="px-3 py-2.5 bg-[rgba(123,208,255,0.1)] border border-[rgba(123,208,255,0.3)] text-[#7bd0ff] text-sm font-medium rounded-sm shrink-0 hover:bg-[rgba(123,208,255,0.18)] transition-colors"
              onClick={onAddLine}
            >
              Agregar
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
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#7bd0ff] text-[#00354a] text-sm font-bold rounded-sm hover:bg-[#5bc0ef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!title.trim() || lines.length === 0 || saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewSongModal;
