import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { deleteDoc, doc } from "firebase/firestore";

import db from "../firebase/firebase";
import usePrograms from "../firebase/usePrograms";
import NewProgramModal from "../components/Program/NewProgramModal";
import ProgramDeleteModal from "../components/Program/ProgramDeleteModal";
import { IconCalendar, IconSearch, IconPlus, IconDots } from "../components/Icons";

dayjs.locale("es");

// ─── Component ───────────────────────────────────────────────────────────────

function Home() {
  const { programs, addProgram } = usePrograms();
  const [currentPrograms, setCurrentPrograms] = useState(programs);
  const [isNewProgramModalVisible, setIsNewProgramModalVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentPrograms(programs);
  }, [programs]);

  const handleCreateProgram = async ({ date, title }) => {
    const jsDate = date.toDate();
    const docRef = await addProgram({ date: jsDate, title });
    navigate(`/program/${docRef.id}`);
  };

  const handleOpenDelete = (programId) => {
    setProgramToDelete(programId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (programToDelete) {
      await deleteDoc(doc(db, "programs", programToDelete));
      setShowDeleteConfirm(false);
      setProgramToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setProgramToDelete(null);
  };

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 h-14 sm:h-16 bg-[#191c1e]/80 backdrop-blur-md border-b border-[rgba(69,70,77,0.3)] flex items-center justify-end px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#ffb4ab]" />
            <span
              className="hidden sm:inline text-[#c6c6cd] text-xs font-medium uppercase tracking-[0.05em] leading-4"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              SISTEMA LISTO
            </span>
          </div>
          <button className="bg-[rgba(123,208,255,0.1)] border border-[rgba(123,208,255,0.3)] text-[#7bd0ff] font-bold text-xs sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2 rounded-xl hover:bg-[rgba(123,208,255,0.2)] transition-colors whitespace-nowrap">
            Vista en Vivo
          </button>
        </div>
      </header>

      {/* Canvas */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 flex flex-col gap-6 sm:gap-8 lg:gap-10 bg-[#101415]">

        {/* Dashboard Header */}
        <div className="flex flex-col gap-4 sm:gap-6 min-w-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-[#e0e3e5] font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-10 sm:leading-[48px] lg:leading-[56px]">
                Dashboard
              </h2>
              <p className="text-[#c6c6cd] text-base sm:text-lg leading-6 sm:leading-7 mt-1 max-w-2xl">
                Administra tus producciones y revisa sesiones pasadas desde un centro de control centralizado.
              </p>
            </div>
            <button
              onClick={() => setIsNewProgramModalVisible(true)}
              className="flex items-center justify-center gap-3 sm:gap-4 bg-[#7bd0ff] text-[#00354a] font-bold text-sm sm:text-base px-5 sm:px-10 py-3 sm:py-4 rounded-lg hover:bg-[#5bc0ef] transition-colors w-full sm:w-auto shrink-0"
            >
              <IconPlus />
              <span className="sm:hidden">Nuevo Programa</span>
              <span className="hidden sm:inline">Crear Nuevo Programa</span>
            </button>
          </div>
          <div className="relative w-full max-w-[448px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder="Buscar programas..."
              className="bg-[#0b0f10] text-[#6b7280] placeholder-[#6b7280] text-sm sm:text-base rounded-xl pl-10 pr-4 sm:pr-6 py-2.5 w-full outline-none border border-[rgba(69,70,77,0.2)] focus:border-[#7bd0ff] transition-colors"
            />
          </div>
        </div>

        {/* Upcoming Programs section */}
        <div className="flex flex-col gap-4 sm:gap-6 min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <IconCalendar />
              <h3 className="text-[#e0e3e5] font-semibold text-xl sm:text-2xl tracking-tight leading-7 sm:leading-8 truncate">
                Próximos Programas
              </h3>
            </div>
            <div
              className="bg-[rgba(50,53,55,0.3)] text-[#c6c6cd] text-[10px] sm:text-xs font-medium tracking-[0.05em] px-3 sm:px-4 py-1 rounded-xl uppercase leading-4 self-start sm:self-auto shrink-0"
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {currentPrograms.length} PROGRAMADOS
            </div>
          </div>

          {/* Program grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {currentPrograms.map((program) => {
              const formattedDate = dayjs(program.date.toDate())
                .format("D MMM, YYYY")
                .toUpperCase();
              return (
                <div
                  key={program.id}
                  className="bg-[rgba(29,32,34,0.6)] backdrop-blur-md border border-[rgba(255,255,255,0.05)] rounded-lg p-4 sm:p-6 flex flex-col justify-between hover:border-[rgba(123,208,255,0.2)] transition-colors cursor-pointer min-h-[220px] sm:min-h-[264px] min-w-0"
                  onClick={() => navigate(`/program/${program.id}`)}
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <span
                        className="bg-[rgba(0,166,224,0.2)] text-[#7bd0ff] text-[10px] sm:text-xs font-medium tracking-[0.05em] px-2 py-1 rounded-sm uppercase leading-4"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        PRÓXIMO
                      </span>
                      <button
                        className="text-[#6b7280] hover:text-red-400 transition-colors p-1 leading-none shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleOpenDelete(program.id); }}
                        title="Eliminar programa"
                      >
                        <IconDots />
                      </button>
                    </div>
                    <h4 className="text-[#e0e3e5] font-bold text-base sm:text-lg leading-6 sm:leading-7 mb-2 break-words">
                      {program.title || "Programa"}
                    </h4>
                    <p
                      className="text-[#c6c6cd] text-[10px] sm:text-xs font-medium tracking-[0.05em] leading-4"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {formattedDate}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-6">
                    <button
                      className="flex-1 bg-[rgba(123,208,255,0.1)] border border-[rgba(123,208,255,0.2)] text-[#7bd0ff] font-bold text-sm sm:text-base py-2 rounded-sm hover:bg-[rgba(123,208,255,0.2)] transition-colors"
                      onClick={(e) => { e.stopPropagation(); navigate(`/program/${program.id}`); }}
                    >
                      Previsualizar
                    </button>
                    <button
                      className="flex-1 border border-[#45464d] text-[#c6c6cd] text-sm sm:text-base py-2 rounded-sm hover:bg-[rgba(50,53,55,0.3)] transition-colors"
                      onClick={(e) => { e.stopPropagation(); navigate(`/program/${program.id}`); }}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}

            {/* "Add new" card */}
            <div
              className="border-2 border-dashed border-[rgba(69,70,77,0.3)] rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[rgba(123,208,255,0.3)] hover:bg-[rgba(123,208,255,0.05)] transition-colors min-h-[120px] sm:min-h-[135px]"
              onClick={() => setIsNewProgramModalVisible(true)}
            >
              <div className="text-[#c6c6cd]">
                <IconPlus color="#c6c6cd" />
              </div>
              <p className="text-[#c6c6cd] font-bold text-sm sm:text-base leading-6">
                Nuevo Programa
              </p>
              <p
                className="text-[rgba(198,198,205,0.6)] text-[10px] sm:text-xs font-medium tracking-[0.05em] text-center leading-4"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                Llenar el calendario
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modals ── */}
      <NewProgramModal
        isOpen={isNewProgramModalVisible}
        onCancel={() => setIsNewProgramModalVisible(false)}
        onSubmit={handleCreateProgram}
      />
      <ProgramDeleteModal
        isOpen={showDeleteConfirm}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

export default Home;
