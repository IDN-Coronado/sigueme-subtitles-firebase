import { useState } from "react";

import useThemes from "../../firebase/useThemes";
import { IconPlus } from "../Icons";

import ThemeItem from "./ThemeItem";
import ConfirmationModal from "./ConfirmationModal";
import NewThemeModal from "./NewThemeModal";

function ThemeList({ themes, onCreateTheme }) {
  const { removeTheme } = useThemes();
  const [themeToDelete, setThemeToDelete] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleOpenDelete = (theme) => {
    setThemeToDelete(theme);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (themeToDelete) {
      try {
        await removeTheme(themeToDelete);
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
    <>
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 min-h-12 sm:h-14">
        <span className="text-[#c6c6cd] font-semibold text-sm sm:text-base leading-6">
          {themes.length} recursos
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[rgba(123,208,255,0.08)] border border-[rgba(123,208,255,0.2)] text-[#e0e3e5] font-bold text-sm sm:text-base px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg hover:bg-[rgba(123,208,255,0.15)] transition-colors shrink-0"
        >
          <IconPlus color="#e0e3e5" />
          Añadir
          <span
            className="bg-[rgba(69,70,77,0.4)] text-[#c6c6cd] text-xs px-2 py-0.5 rounded-sm leading-[15px]"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {themes.length}
          </span>
        </button>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Add new card */}
        <div
          className="border-2 border-dashed border-[rgba(69,70,77,0.3)] rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[rgba(123,208,255,0.3)] hover:bg-[rgba(123,208,255,0.05)] transition-colors aspect-video"
          onClick={() => setShowModal(true)}
        >
          <div className="text-[#c6c6cd]">
            <IconPlus color="#c6c6cd" />
          </div>
          <p className="text-[#c6c6cd] font-bold text-base leading-6">Nuevo Tema</p>
          <p
            className="text-[rgba(198,198,205,0.6)] text-xs font-medium tracking-[0.05em] text-center leading-4"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            Subir imagen o video
          </p>
        </div>

        {/* Theme cards */}
        {themes.map(theme => (
          <ThemeItem key={theme.id} theme={theme} onDelete={handleOpenDelete} />
        ))}
      </div>

      <NewThemeModal
        isVisible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={onCreateTheme}
      />

      <ConfirmationModal
        isVisible={showConfirm}
        message="¿Estás seguro de eliminar este tema?"
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

export default ThemeList;