import dayjs from "dayjs";
import { useState } from "react";

function NewProgramModal ({
  onCancel,
  onSubmit,
  isOpen,
}) {
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
  }

  const onModalSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (selectedDate && trimmedTitle) {
      onSubmit({
        date: dayjs(selectedDate),
        title: trimmedTitle
      });
      setSelectedDate(today);
      setTitle("Servicio Dominical");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form
        className="bg-white rounded-lg p-8 shadow-lg flex flex-col gap-4 min-w-[300px] relative"
        onSubmit={onModalSubmit}
      >
        <label className="font-semibold">Título del programa:</label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="border rounded px-3 py-2 w-full pr-8"
            required
          />
          {title && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 font-bold text-lg"
              onClick={handleClearTitle}
              tabIndex={-1}
              aria-label="Limpiar título"
            >
              ×
            </button>
          )}
        </div>
        <label className="font-semibold">Selecciona la fecha del programa:</label>
        <input
          type="date"
          value={selectedDate || ""}
          onChange={handleDateChange}
          className="border rounded px-3 py-2"
          required
        />
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={onClickCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded"
            disabled={!title.trim() || !selectedDate}
          >
            Crear
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewProgramModal;