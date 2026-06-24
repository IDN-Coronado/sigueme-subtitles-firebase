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

function Section({ title, children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="border rounded-lg bg-white shadow">
      <button
        type="button"
        className="w-full flex justify-between items-center px-4 py-3 font-semibold text-lg"
        onClick={() => setCollapsed(v => !v)}
      >
        {title}
        <span>{collapsed ? "▼" : "▲"}</span>
      </button>
      {!collapsed && <div className="pt-4">{children}</div>}
    </div>
  );
}

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
  const [slides, setSlides] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [showConfirmTheme, setShowConfirmTheme] = useState(false);
  const [showConfirmPantallas, setShowConfirmPantallas] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [programTheme, setProgramTheme] = useState({});
  const { songs } = useSongs();
  const { themes, getThemeById } = useThemes();
  const { program, updateProgram, activateProgram } = usePrograms(programId);

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

  const handleConfirmSaveTheme = async () => {
    setShowConfirmTheme(false);
    if (!selectedTheme) return;
    await updateProgram(programId, {
      theme: { id: selectedTheme },
      updatedAt: dayjs().toISOString(),
    });
    setSelectedTheme("");
    setToast("Tema guardado correctamente.");
  };

  const handleConfirmSavePantallas = async () => {
    setShowConfirmPantallas(false);
    setIsSaving(true);
    // 1. Upload slide files
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
    await updateProgram(programId, {
      slides: [...(program.slides ?? []), ...slidesData],
      songs: [...(program.songs ?? []), ...songsRefs],
      updatedAt: dayjs().toISOString(),
    });
    setSelectedSongs([]);
    setSlides([]);
    setToast("Pantallas guardadas correctamente.");
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
    <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-6">

      {/* ── Configuración ── */}
      <Section title="Configuración">
        <div className="px-4 pb-4 flex items-center gap-3">
          <span className="font-medium">Activo:</span>
          <button
            type="button"
            role="switch"
            aria-checked={!!program?.active}
            onClick={() => activateProgram(program?.active ? null : programId)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              program?.active ? "bg-cyan-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                program?.active ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-gray-500">{program?.active ? "Activo" : "Inactivo"}</span>
        </div>
        <div className="px-4 pb-4">
          <label className="block font-medium mb-1">Tema:</label>
          <ThemeDropdown
            themes={themes}
            value={selectedTheme}
            onSelect={setSelectedTheme}
          />
        </div>
        <div className="px-4 pb-4 flex justify-end">
          <button
            className="px-6 py-2 bg-cyan-600 text-white rounded font-semibold hover:bg-cyan-700 transition disabled:opacity-50"
            type="button"
            disabled={!selectedTheme}
            onClick={() => setShowConfirmTheme(true)}
          >
            Guardar tema
          </button>
        </div>
        <ConfirmationModal
          isVisible={showConfirmTheme}
          message="¿Guardar el tema seleccionado?"
          onCancel={() => setShowConfirmTheme(false)}
          onConfirm={handleConfirmSaveTheme}
        />
      </Section>

      {/* ── Pantallas ── */}
      <Section title="Pantallas">
        <div className="px-4 pb-4 flex flex-col md:grid md:grid-cols-2 md:gap-4 gap-4">
          <div>
            <label className="block font-medium mb-1">Canción:</label>
            <SongDropdown
              songs={songs}
              selectedSongs={selectedSongs}
              savedSongs={program?.songs}
              onSelect={onSelectSongs}
            />
          </div>
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

        <div className="px-4 pb-4 flex justify-end">
          <button
            className="px-6 py-2 bg-cyan-600 text-white rounded font-semibold hover:bg-cyan-700 transition disabled:opacity-50"
            type="button"
            disabled={selectedSongs.length === 0 && slides.length === 0}
            onClick={() => setShowConfirmPantallas(true)}
          >
            Guardar
          </button>
        </div>
        <ConfirmationModal
          isVisible={showConfirmPantallas}
          message="¿Guardar las canciones y slides seleccionados?"
          onCancel={() => setShowConfirmPantallas(false)}
          onConfirm={handleConfirmSavePantallas}
        />
      </Section>

      {/* ── Lists ── */}
      <ProgramsItemsList
        title="Sin guardar"
        songs={getFullSongs(selectedSongs)}
        slides={slides}
        onRemoveSong={onRemoveTemporalSong}
        onRemoveSlide={onRemoveTemporalSlide}
        isSaving={isSaving}
        isTemporal
      />
      <ProgramsItemsList
        title="Guardados"
        songs={getFullSongs(program?.songs)}
        slides={program?.slides || []}
        onRemoveSong={onRemoveSong}
        onRemoveSlide={onRemoveSlide}
        programTheme={programTheme}
      />

      <SlideUploadModal
        isOpen={showSlideModal}
        onClose={() => setShowSlideModal(false)}
        onUpload={handleUploadSlide}
      />

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Program;
