import { useState, useRef } from "react";
import dayjs from "dayjs";
import DOMPurify from "dompurify";

function NewThemeModal({ isVisible, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState(""); // Track file type for validation

  const fileInputRef = useRef();

  const handleModalClose = () => {
    setTitle("");
    setFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!["image/", "video/"].some(type => f.type.startsWith(type))) {
      alert("Solo se aceptan imágenes o videos.");
      return;
    }
    setFileType(f.type);
    const url = URL.createObjectURL(f);

    // Validate blob URL and MIME type
    if (
      (f.type.startsWith("image/") || f.type.startsWith("video/")) &&
      url.startsWith("blob:")
    ) {
      // Sanitize with DOMPurify
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
    const ext = file.name.split('.').pop();
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
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form
        className="bg-white rounded-lg p-8 shadow-lg flex flex-col gap-4 min-w-[300px] relative"
        onSubmit={handleSubmit}
      >
        <label className="font-semibold">Nombre del tema:</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <label className="font-semibold">Archivo (imagen o video):</label>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="border rounded px-3 py-2"
          required
        />
        {/* Preview */}
        {previewUrl && (
          <div className="w-full flex justify-center items-center">
            {file &&
              fileType.startsWith("image/") &&
              previewUrl.startsWith("blob:") ? (
              <img src={previewUrl} alt="preview" className="max-h-40 rounded" />
            ) : file &&
              fileType.startsWith("video/") &&
              previewUrl.startsWith("blob:") ? (
              <video
                src={previewUrl}
                className="max-h-40 rounded"
                autoPlay
                loop
                muted
                playsInline
                controls={false}
              />
            ) : null}
          </div>
        )}
        <div className="flex gap-4 justify-end mt-2">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={handleModalClose}
            disabled={uploading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded"
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