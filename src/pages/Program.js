import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSongs from "../firebase/useSongs";
import dayjs from "dayjs";
import useThemes from "../firebase/useThemes";
import usePrograms from "../firebase/usePrograms";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import storage from "../firebase/storage";

import ThemeDropdown from "../components/ThemeDropdown";
import SongDropdown from "../components/SongDropdown";
import SlideUploadModal from "../components/SlideUploadModal";
import ConfirmationModal from "../components/Theme/ConfirmationModal";
import ProgramsItemsList from "../components/ProgramItemsList";

// Toast component
function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 bg-cyan-600 text-white px-6 py-3 rounded shadow-lg z-50 animate-fade-in">
      {message}
    </div>
  );
}

function Program() {
  const { programId } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [slides, setSlides] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [programTheme, setProgramTheme] = useState({});
  const { songs } = useSongs();
  const { themes, getThemeById } = useThemes();
  const { program, updateProgram } = usePrograms(programId);

  const handleUploadSlide = async ({ file, title }) => {
    // Save slide in local state for now
    setSlides(prev => [
      ...prev,
      {
        id: `${Date.now()}-${file.name}`,
        file,
        title,
        name: file.name
      }
    ]);
    setShowSlideModal(false);
  };

  const onSelectSongs = (songId) => {
    setSelectedSongs(prev => [ ...prev, { id: songId } ]);
  };

  const handleSave = async () => {
    setShowConfirmModal(true);
  };
  const clearAllValues = () => {
    setSelectedSongs([]);
    setSlides([]);
    setSelectedTheme("");
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    // 1. Upload slide files and build slides array
    const slidesData = [];
    for (const slide of slides) {
      let fileUrl = null;
      let storagePath = null;
      let name = slide.name || (slide.file && slide.file.name) || "";
      if (slide.file) {
        const storageRef = ref(storage, `programs/${programId}/slides/${Date.now()}_${slide.file.name}`);
        await uploadBytes(storageRef, slide.file);
        fileUrl = await getDownloadURL(storageRef);
        storagePath = storageRef.fullPath;
      }
      slidesData.push({
        title: slide.title || name,
        name,
        ...(fileUrl ? { url: fileUrl } : {}),
        ...(storagePath ? { storagePath } : {}),
      });
    }
    // 2. Songs references
    const songsRefs = selectedSongs.map(song => ({ id: song.id }));
    // 3. Theme reference
    const themeRef = selectedTheme ? { id: selectedTheme } : null;

    // Remove undefined fields from the update object
    const updateData = {
      slides: [ ...program.slides, ...slidesData ],
      songs: [ ...program.songs, ...songsRefs ],
      updatedAt: dayjs().toISOString(),
    };
    if (themeRef) updateData.theme = themeRef;

    await updateProgram(programId, updateData);

    clearAllValues();

    setToast("Programa guardado correctamente.");
    setIsSaving(false);
  };

  const onRemoveTemporalSong = (songId) => (
    setSelectedSongs(prev => prev.filter(s => s.id !== songId))
  );

  const onRemoveTemporalSlide = (slideId) => (
    setSlides(prev => prev.filter(slide => slide.id !== slideId))
  );

  const onRemoveSong = (songId) => {
    const updatedSongs = program.songs.filter(s => s.id !== songId);
    updateProgram(programId, { songs: updatedSongs });
  };

  const onRemoveSlide = (slideId) => {
    const updatedSlides = program.slides.filter(s => s.id !== slideId);
    updateProgram(programId, { slides: updatedSlides });
  };

  const getFullSongs = songsList => {
    if (!songsList) return [];
    return songs.filter(song => songsList?.find(s => s.id === song.id));
  };

  useEffect(() => {
    if (program) {
      setProgramTheme(getThemeById(program.theme?.id));
    }
  }, [program, getThemeById]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Collapsible Section */}
      <div className="mb-6 border rounded-lg bg-white shadow">
        <button
          className="w-full flex justify-between items-center px-4 py-3 font-semibold text-lg"
          onClick={() => setIsCollapsed(v => !v)}
        >
          Configuración
          <span>{isCollapsed ? "▲" : "▼"}</span>
        </button>
        {isCollapsed && (
          <>
            <div className="px-4 pb-4 flex flex-col md:grid md:grid-cols-3 md:gap-4 gap-4">
              {/* Theme Dropdown */}
              <div>
                <label className="block font-medium mb-1">Tema:</label>
                <ThemeDropdown
                  themes={themes}
                  value={selectedTheme}
                  onSelect={setSelectedTheme}
                />
              </div>
              {/* Song Dropdown */}
              <div>
                <label className="block font-medium mb-1">Canción:</label>
                <SongDropdown
                  songs={songs}
                  selectedSongs={selectedSongs}
                  savedSongs={program?.songs}
                  onSelect={onSelectSongs}
                />
              </div>
              {/* Slide Upload Button */}
              <div className="flex items-end">
                <button
                  className="px-4 py-2 border-2 border-cyan-600 text-cyan-600 rounded w-full bg-transparent hover:bg-cyan-50 transition"
                  onClick={() => setShowSlideModal(true)}
                  type="button"
                >
                  Subir Slide
                </button>
              </div>
            </div>
            <div className="px-4 pb-2 flex justify-end">
              <button
                className="px-6 py-2 bg-cyan-600 text-white rounded font-semibold hover:bg-cyan-700 transition"
                type="button"
                onClick={handleSave}
              >
                Guardar
              </button>
            </div>
            <ConfirmationModal
              isVisible={showConfirmModal}
              message="¿Estás seguro de guardar los cambios?"
              onCancel={() => setShowConfirmModal(false)}
              onConfirm={handleConfirmSave}
            />
          </>
        )}
      </div>
      {/* Slide Upload Modal */}
      <SlideUploadModal
        isOpen={showSlideModal}
        onClose={() => setShowSlideModal(false)}
        onUpload={handleUploadSlide}
      />
      {/* Body: Song links and Slide buttons */}
      <div className="mb-8">
        {/* Unsaved Elements */}
        <ProgramsItemsList
          title="Elementos no guardados"
          songs={getFullSongs(selectedSongs)}
          slides={slides}
          onRemoveSong={onRemoveTemporalSong}
          onRemoveSlide={onRemoveTemporalSlide}
          isSaving={isSaving}
          isTemporal
        />

        {/* Saved Elements */}
        <ProgramsItemsList
          title="Elementos guardados"
          songs={getFullSongs(program?.songs)}
          slides={program?.slides || []}
          onRemoveSong={onRemoveSong}
          onRemoveSlide={onRemoveSlide}
          programTheme={programTheme}
        />
      </div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Program;
