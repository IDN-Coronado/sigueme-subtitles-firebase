import React, { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import db from "../firebase/firebase";
import storage from "../firebase/storage";
import dayjs from "dayjs";

function Themes() {
  const [themes, setThemes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "themes"), (snapshot) => {
      setThemes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!["image/", "video/"].some(type => f.type.startsWith(type))) {
      alert("Solo se aceptan imágenes o videos.");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleModalClose = () => {
    setShowModal(false);
    setTitle("");
    setFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `themes/${dayjs().valueOf()}_${title}.${ext}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, "themes"), {
        title: title.trim(),
        backgroundUrl: url,
        storagePath: storageRef.fullPath, // Save storage path for deletion
      });
      handleModalClose();
    } catch (err) {
      alert("Error al subir el archivo o guardar el tema.");
    }
    setUploading(false);
  };

  // Remove theme handlers
  const handleOpenDelete = (theme) => {
    setThemeToDelete(theme);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (themeToDelete) {
      try {
        // Remove file from storage if storagePath exists
        if (themeToDelete.storagePath) {
          await deleteObject(ref(storage, themeToDelete.storagePath));
        }
        await deleteDoc(doc(db, "themes", themeToDelete.id));
      } catch (err) {
        alert("Error al eliminar el tema o archivo.");
      }
      setShowConfirm(false);
      setThemeToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setThemeToDelete(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Temas</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {/* CTA to add new theme */}
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed border-cyan-400 rounded-lg p-6 cursor-pointer hover:bg-cyan-50 aspect-[16/9]"
          onClick={() => setShowModal(true)}
        >
          <span className="text-cyan-600 text-4xl mb-2">+</span>
          <span className="font-semibold text-cyan-700">Nuevo Tema</span>
        </div>
        {/* Themes */}
        {themes.map(theme => (
          <div
            key={theme.id}
            className="relative border rounded-lg flex flex-col items-center bg-white shadow aspect-[16/9] overflow-hidden p-0 group"
          >
            <button
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white rounded shadow text-gray-400 hover:text-red-500 font-bold text-lg z-10"
              title="Eliminar tema"
              onClick={() => handleOpenDelete(theme)}
              style={{ padding: 0 }}
            >
              ×
            </button>
            <div className="w-full h-full flex-1 flex items-center justify-center">
              {theme.backgroundUrl && theme.backgroundUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={theme.backgroundUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                />
              ) : (
                <img
                  src={theme.backgroundUrl}
                  alt={theme.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {/* Metadata bar for touch devices */}
            <div className="block md:hidden absolute bottom-0 left-0 w-full bg-black bg-opacity-80 py-2 px-2">
              <span className="font-semibold text-white text-sm truncate">{theme.title}</span>
            </div>
            {/* Metadata bar for non-touch devices (on hover) */}
            <div className="hidden md:block absolute bottom-0 left-0 w-full pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div
                  className="w-full py-2 px-2"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0) 100%)"
                  }}
                >
                  <span className="font-semibold text-white text-sm truncate">{theme.title}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Modal */}
      {showModal && (
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
                {file && file.type.startsWith("image/") ? (
                  <img src={previewUrl} alt="preview" className="max-h-40 rounded" />
                ) : file && file.type.startsWith("video/") ? (
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
      )}
      {/* Confirm Delete Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg flex flex-col gap-4 min-w-[300px]">
            <span className="font-semibold text-lg mb-2">¿Estás seguro de eliminar este tema?</span>
            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={handleCancelDelete}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={handleConfirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Themes;
