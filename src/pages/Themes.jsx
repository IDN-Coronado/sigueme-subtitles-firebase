import useThemes from "../firebase/useThemes";
import ThemeList from "../components/Theme/ThemeList";
import { IconSearch } from "../components/Icons";
import { Link } from "react-router-dom";

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
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 h-14 sm:h-16 bg-[#191c1e]/80 backdrop-blur-md border-b border-[rgba(69,70,77,0.3)] flex items-center justify-end px-4 sm:px-6">
        <button
          className="text-[#7bd0ff] font-medium text-sm sm:text-base"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          Vista en Vivo
        </button>
      </header>

      {/* Page Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 bg-[#101415] flex flex-col gap-4 sm:gap-6">

        {/* Header & Tabs */}
        <div className="border-b border-[rgba(69,70,77,0.2)] pb-4 flex flex-col gap-4 sm:gap-6 min-w-0">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between min-w-0">
            <div className="min-w-0">
              <h2 className="text-[#e0e3e5] font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-10 sm:leading-[48px] lg:leading-[56px]">
                Resources
              </h2>
              <p className="text-[#c6c6cd] text-sm sm:text-base leading-6 mt-1">
                Gestiona y accede a todo el contenido multimedia para tus presentaciones.
              </p>
            </div>

            {/* Tab bar */}
            <div className="w-full xl:w-auto min-w-0 overflow-x-auto">
              <div className="bg-[rgba(29,32,34,0.4)] border border-[rgba(69,70,77,0.2)] rounded-lg p-1 inline-flex items-center min-w-min">
                <Link to="/songs" className="text-[#c6c6cd] hover:text-[#e0e3e5] text-sm sm:text-base px-3 sm:px-4 lg:px-6 py-2 rounded transition-colors whitespace-nowrap">
                  Canciones
                </Link>
                <span className="bg-[#323537] text-[#e0e3e5] font-semibold text-sm sm:text-base px-3 sm:px-4 lg:px-6 py-2 rounded-[4px] cursor-default whitespace-nowrap">
                  Temas
                </span>
                <span className="text-[rgba(198,198,205,0.35)] text-sm sm:text-base px-3 sm:px-4 lg:px-6 py-2 cursor-not-allowed select-none whitespace-nowrap">
                  Imágenes
                </span>
                <span className="text-[rgba(198,198,205,0.35)] text-sm sm:text-base px-3 sm:px-4 lg:px-6 py-2 cursor-not-allowed select-none whitespace-nowrap">
                  Biblia
                </span>
              </div>
            </div>
          </div>
          <div className="relative w-full max-w-[448px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar recursos..."
              className="bg-[#0b0f10] text-[#6b7280] placeholder-[#6b7280] text-sm sm:text-base rounded-xl pl-10 pr-4 sm:pr-6 py-2.5 w-full outline-none border border-[rgba(69,70,77,0.2)] focus:border-[#7bd0ff] transition-colors"
            />
          </div>
        </div>

        {/* Theme List (renders action bar + grid + modals) */}
        <ThemeList themes={themes} onCreateTheme={handleCreateTheme} />
      </main>
    </>
  );
}

export default Themes;
