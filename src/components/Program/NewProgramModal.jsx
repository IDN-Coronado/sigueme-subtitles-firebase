import dayjs from "dayjs";
import { useState } from "react";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

function NewProgramModal({ onCancel, onSubmit, isOpen }) {
  const today = dayjs().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(today);
  const [title, setTitle] = useState("Servicio Dominical");

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
    setTitle("Servicio Dominical");
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
      setTitle("Servicio Dominical");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        className="bg-[#1d2022] border border-[rgba(69,70,77,0.4)] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex flex-col w-full max-w-md overflow-hidden"
        onSubmit={onModalSubmit}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(69,70,77,0.3)]">
          <div>
            <p
              className="text-[#7bd0ff] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              New
            </p>
            <h2 className="text-[#e0e3e5] font-semibold text-lg tracking-tight">
              Nuevo programa
            </h2>
          </div>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#e0e3e5] text-2xl leading-none transition-colors"
            onClick={onClickCancel}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-2">
            <label className="text-[#c6c6cd] text-sm font-medium">
              Título del programa
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="bg-[#0b0f10] text-[#e0e3e5] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2.5 w-full pr-8 outline-none focus:border-[#7bd0ff] transition-colors"
                required
              />
              {title && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#ffb4ab] text-lg leading-none"
                  onClick={handleClearTitle}
                  tabIndex={-1}
                  aria-label="Limpiar título"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#c6c6cd] text-sm font-medium">
              Fecha del programa
            </label>
            <input
              type="date"
              value={selectedDate || ""}
              onChange={handleDateChange}
              className="bg-[#0b0f10] text-[#e0e3e5] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2.5 outline-none focus:border-[#7bd0ff] transition-colors [color-scheme:dark]"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end px-5 sm:px-6 py-4 border-t border-[rgba(69,70,77,0.3)]">
          <button
            type="button"
            className="px-4 py-2 text-[#c6c6cd] text-sm border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors"
            onClick={onClickCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#7bd0ff] text-[#00354a] text-sm font-bold rounded-sm hover:bg-[#5bc0ef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!title.trim() || !selectedDate}
          >
            Crear
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewProgramModal;
