import { useState, useRef } from "react";
import dayjs from "dayjs";
import DOMPurify from "dompurify";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

function NewThemeModal({ isVisible, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState("");

  const fileInputRef = useRef();

  const handleModalClose = () => {
    setTitle("");
    setFile(null);
    setPreviewUrl("");
    setFileType("");
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!["image/", "video/"].some((type) => f.type.startsWith(type))) {
      alert("Solo se aceptan imágenes o videos.");
      return;
    }
    setFileType(f.type);
    const url = URL.createObjectURL(f);

    if (
      (f.type.startsWith("image/") || f.type.startsWith("video/")) &&
      url.startsWith("blob:")
    ) {
      const safeUrl = DOMPurify.sanitize(url, { SAFE_FOR_TEMPLATES: true });
      setPreviewUrl(safeUrl);
      setFile(f);
    } else {
      alert("Archivo no válido para previsualización.");
      setPreviewUrl("");
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    await onSubmit({
      title: title.trim(),
      storagePath: `themes/${dayjs().valueOf()}_${title}.${ext}`,
      file,
    });
    setUploading(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form
        className="bg-[#1d2022] border border-[rgba(69,70,77,0.4)] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.45)] flex flex-col w-full max-w-md overflow-hidden"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[rgba(69,70,77,0.3)]">
          <div>
            <p
              className="text-[#7bd0ff] text-[10px] tracking-[0.12em] uppercase mb-1"
              style={MONO}
            >
              Themes
            </p>
            <h2 className="text-[#e0e3e5] font-semibold text-lg tracking-tight">
              Nuevo tema
            </h2>
          </div>
          <button
            type="button"
            className="text-[#6b7280] hover:text-[#e0e3e5] text-2xl leading-none transition-colors"
            onClick={handleModalClose}
            disabled={uploading}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 sm:px-6 py-5">
          <div className="flex flex-col gap-2">
            <label className="text-[#c6c6cd] text-sm font-medium">
              Nombre del tema
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#0b0f10] text-[#e0e3e5] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2.5 outline-none focus:border-[#7bd0ff] transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#c6c6cd] text-sm font-medium">
              Archivo (imagen o video)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="bg-[#0b0f10] text-[#c6c6cd] border border-[rgba(69,70,77,0.3)] rounded-sm px-3 py-2.5 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-sm file:border-0 file:bg-[rgba(123,208,255,0.15)] file:text-[#7bd0ff] file:text-sm file:font-medium hover:border-[rgba(123,208,255,0.35)] transition-colors"
              required
            />
          </div>

          {previewUrl && (
            <div className="w-full flex justify-center items-center rounded-lg overflow-hidden border border-[rgba(69,70,77,0.3)] bg-[#0b0f10]">
              {file &&
              fileType.startsWith("image/") &&
              previewUrl.startsWith("blob:") ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="max-h-40 w-full object-contain"
                />
              ) : file &&
                fileType.startsWith("video/") &&
                previewUrl.startsWith("blob:") ? (
                <video
                  src={previewUrl}
                  className="max-h-40 w-full object-contain"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                />
              ) : null}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end px-5 sm:px-6 py-4 border-t border-[rgba(69,70,77,0.3)]">
          <button
            type="button"
            className="px-4 py-2 text-[#c6c6cd] text-sm border border-[rgba(69,70,77,0.4)] rounded-sm hover:border-[#7bd0ff] hover:text-[#7bd0ff] transition-colors disabled:opacity-40"
            onClick={handleModalClose}
            disabled={uploading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#7bd0ff] text-[#00354a] text-sm font-bold rounded-sm hover:bg-[#5bc0ef] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!title.trim() || !file || uploading}
          >
            {uploading ? "Subiendo..." : "Crear"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewThemeModal;
