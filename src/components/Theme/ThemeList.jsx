import { useState } from "react";

import useThemes from "../../firebase/useThemes";

import ThemeItem from "./ThemeItem";
import ConfirmationModal from "./ConfirmationModal";
import NewThemeModal from "./NewThemeModal";

function ThemeList ({ themes, onCreateTheme}) {
  const { removeTheme } = useThemes();
  const [themeToDelete, setThemeToDelete] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Remove theme handlers
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

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {/* CTA to add new theme */}
      <div
        className="flex flex-col items-center justify-center border-2 border-dashed border-cyan-400 rounded-lg p-6 cursor-pointer hover:bg-cyan-50 aspect-[16/9]"
        onClick={toggleModal}
      >
        <span className="text-cyan-600 text-4xl mb-2">+</span>
        <span className="font-semibold text-cyan-700">Nuevo Tema</span>
      </div>
      {/* Themes */}
      {themes.map(theme => <ThemeItem key={theme.id} theme={theme} onDelete={handleOpenDelete} />)}

      <NewThemeModal
        isVisible={showModal}
        onClose={toggleModal}
        onSubmit={onCreateTheme}
      />

      <ConfirmationModal
        isVisible={showConfirm}
        message="¿Estás seguro de eliminar este tema?"
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default ThemeList;