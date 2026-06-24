import useThemes from "../firebase/useThemes";
import ThemeList from "../components/Theme/ThemeList";

function Themes() {
  const { themes, addTheme } = useThemes();

  const handleCreateTheme = async ({ title, storagePath, file }) => {
    try {
      await addTheme({ title, storagePath, file });
    } catch (err) {
      alert("Error al subir el archivo o guardar el tema.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Temas</h1>
      <ThemeList themes={themes} onCreateTheme={handleCreateTheme} />
    </div>
  );
}

export default Themes;
