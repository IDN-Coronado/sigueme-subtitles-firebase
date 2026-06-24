import { useState } from "react";

function SlideUploadModal({ isOpen, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form
        className="bg-white rounded-lg p-8 shadow-lg flex flex-col gap-4 min-w-[300px]"
        onSubmit={e => {
          e.preventDefault();
          if (file && title.trim()) onUpload({ file, title: title.trim() });
        }}
      >
        <label className="font-semibold">Título del slide:</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <label className="font-semibold">Subir slide:</label>
        <input
          type="file"
          onChange={e => setFile(e.target.files[0])}
          className="border rounded px-3 py-2"
          required
        />
        <div className="flex gap-4 justify-end mt-2">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded"
            disabled={!file || !title.trim()}
          >
            Agregar
          </button>
        </div>
      </form>
    </div>
  );
}

export default SlideUploadModal;